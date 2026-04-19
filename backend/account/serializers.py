# account/serializers.py

from rest_framework import serializers
from django.contrib.auth import authenticate
from django.db import transaction
from core.models import Centre
from .models import User, AdminAuditLog

class UserSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    assigned_centre_name = serializers.CharField(source='assigned_centre.centre_name', read_only=True)
    
    class Meta:
        model = User
        fields = ('id', 'full_name', 'email', 'contact', 'role', 'role_display', 
                  'assigned_centre', 'assigned_centre_name', 'is_active', 
                  'date_joined', 'last_login', 'created_at')
        read_only_fields = ('id', 'date_joined', 'last_login', 'created_at')


class CreateAdminSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True, min_length=6)
    
    class Meta:
        model = User
        fields = ('full_name', 'email', 'contact', 'role', 'password', 
                  'confirm_password', 'assigned_centre')
        extra_kwargs = {
            'email': {'required': False},
            'contact': {'required': False},
        }
    
    def validate(self, data):
        # Check if email or contact is provided
        if not data.get('email') and not data.get('contact'):
            raise serializers.ValidationError("Either email or contact must be provided")
        
        # Check password match
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords do not match")
        
        # Validate role-based centre assignment
        role = data.get('role')
        assigned_centre = data.get('assigned_centre')
        
        if role == User.Role.CENTRE_ADMIN and not assigned_centre:
            raise serializers.ValidationError("Centre Admin must be assigned a centre")
        
        if role != User.Role.CENTRE_ADMIN and assigned_centre:
            raise serializers.ValidationError("Only Centre Admins can be assigned a centre")
        
        # Check unique email/contact
        if data.get('email') and User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({"email": "User with this email already exists"})
        
        if data.get('contact') and User.objects.filter(contact=data['contact']).exists():
            raise serializers.ValidationError({"contact": "User with this contact already exists"})
        
        return data
    
    @transaction.atomic
    def create(self, validated_data):
        # Remove confirm_password
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        
        # Get current user as creator
        request = self.context.get('request')
        created_by = request.user if request else None
        
        # Create user
        user = User.objects.create_user(
            **validated_data,
            password=password,
            created_by=created_by,
            is_staff=True  # All admin users are staff
        )
        
        # Log the creation
        if request:
            AdminAuditLog.objects.create(
                user=request.user,
                action='CREATE',
                target_user=user,
                details={
                    'role': user.role,
                    'assigned_centre': user.assigned_centre.centre_name if user.assigned_centre else None
                }
            )
        
        return user


class UpdateAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('full_name', 'email', 'contact', 'is_active', 'assigned_centre')
    
    def validate(self, data):
        # Validate centre assignment for centre admin
        instance = self.instance
        assigned_centre = data.get('assigned_centre', instance.assigned_centre)
        
        if instance.role == User.Role.CENTRE_ADMIN and not assigned_centre:
            raise serializers.ValidationError("Centre Admin must be assigned a centre")
        
        # Check unique email/contact (excluding current instance)
        if data.get('email') and User.objects.filter(email=data['email']).exclude(id=instance.id).exists():
            raise serializers.ValidationError({"email": "User with this email already exists"})
        
        if data.get('contact') and User.objects.filter(contact=data['contact']).exclude(id=instance.id).exists():
            raise serializers.ValidationError({"contact": "User with this contact already exists"})
        
        return data
    
    @transaction.atomic
    def update(self, instance, validated_data):
        old_centre = instance.assigned_centre
        old_status = instance.is_active
        
        instance = super().update(instance, validated_data)
        
        # Log the update
        request = self.context.get('request')
        if request:
            changes = {}
            if old_centre != instance.assigned_centre:
                changes['centre_changed'] = {
                    'from': old_centre.centre_name if old_centre else None,
                    'to': instance.assigned_centre.centre_name if instance.assigned_centre else None
                }
            if old_status != instance.is_active:
                changes['status_changed'] = {
                    'from': old_status,
                    'to': instance.is_active
                }
            
            if changes:
                AdminAuditLog.objects.create(
                    user=request.user,
                    action='UPDATE',
                    target_user=instance,
                    details=changes
                )
        
        return instance


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True, min_length=6)
    
    class Meta:
        model = User
        fields = ('full_name', 'email', 'contact', 'password', 'confirm_password', 'role')
        extra_kwargs = {
            'email': {'required': False},
            'contact': {'required': False},
        }
    
    def validate(self, data):
        if not data.get('email') and not data.get('contact'):
            raise serializers.ValidationError("Either email or contact must be provided")
        
        if data['password'] != data.pop('confirm_password'):
            raise serializers.ValidationError("Passwords do not match")
        
        return data
    
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    email_or_contact = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        email_or_contact = data.get('email_or_contact')
        password = data.get('password')
        
        if email_or_contact and password:
            user = None
            # Try to find user by email or contact
            if '@' in email_or_contact:
                try:
                    user = User.objects.get(email=email_or_contact)
                except User.DoesNotExist:
                    pass
            else:
                try:
                    user = User.objects.get(contact=email_or_contact)
                except User.DoesNotExist:
                    pass
            
            if user:
                if user.check_password(password):
                    if not user.is_active:
                        raise serializers.ValidationError("User account is disabled.")
                    
                    # Log login
                    request = self.context.get('request')
                    if request:
                        AdminAuditLog.objects.create(
                            user=user,
                            action='LOGIN',
                            details={'ip': request.META.get('REMOTE_ADDR')}
                        )
                    
                    data['user'] = user
                    return data
                else:
                    raise serializers.ValidationError("Unable to log in with provided credentials.")
            else:
                raise serializers.ValidationError("User not found.")
        else:
            raise serializers.ValidationError("Must include 'email_or_contact' and 'password'.")


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=6)
    confirm_password = serializers.CharField(required=True, min_length=6)
    
    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("New passwords do not match")
        return data


class AdminAuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    target_user_name = serializers.CharField(source='target_user.full_name', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = AdminAuditLog
        fields = ('id', 'user', 'user_name', 'action', 'action_display', 
                  'target_user', 'target_user_name', 'details', 'ip_address', 'created_at')
        read_only_fields = '__all__'