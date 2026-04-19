# account/views.py

from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Q
from django.shortcuts import get_object_or_404
from .models import User, AdminAuditLog
from .serializers import (
    UserSerializer, CreateAdminSerializer, UpdateAdminSerializer,
    RegisterSerializer, LoginSerializer, ChangePasswordSerializer,
    AdminAuditLogSerializer
)
from .permissions import IsSuperAdmin, IsCoreAdmin, CanManageUsers


class RegisterView(generics.CreateAPIView):
    """Public registration - for normal users"""
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = (permissions.AllowAny,)
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            # Log logout
            AdminAuditLog.objects.create(
                user=request.user,
                action='LOGOUT',
                details={'ip': request.META.get('REMOTE_ADDR')}
            )
            
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response(status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.UpdateAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def update(self, request, *args, **kwargs):
        user = self.request.user
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            if not user.check_password(serializer.data.get("old_password")):
                return Response(
                    {"old_password": ["Wrong password."]}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user.set_password(serializer.data.get("new_password"))
            user.save()
            
            return Response(
                {"message": "Password updated successfully"}, 
                status=status.HTTP_200_OK
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ValidateTokenView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def get(self, request):
        return Response({
            'valid': True,
            'user': UserSerializer(request.user).data
        })


# ==================== ADMIN MANAGEMENT VIEWS ====================

class AdminUserListView(generics.ListCreateAPIView):
    """List and create admin users"""
    permission_classes = [permissions.IsAuthenticated]  # Changed to just IsAuthenticated initially
    
    def get_queryset(self):
        user = self.request.user
        
        # Super admin sees all admin users
        if user.is_superadmin:
            return User.objects.filter(is_staff=True)
        
        # Core admin sees centre admins, operators
        elif user.is_coreadmin:
            return User.objects.filter(
                is_staff=True,
                role__in=[User.Role.CENTRE_ADMIN, User.Role.OPERATOR]
            )
        
        # Centre admin sees only operators in their centre
        elif user.is_centreadmin:
            return User.objects.filter(
                role=User.Role.OPERATOR,
                assigned_centre=user.assigned_centre
            )
        
        # Regular users see nothing
        return User.objects.none()
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            # Check if user has permission to create
            if not (self.request.user.is_superadmin or self.request.user.is_coreadmin):
                self.permission_denied(
                    self.request,
                    message="You don't have permission to create admins"
                )
            return CreateAdminSerializer
        return UserSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    def list(self, request, *args, **kwargs):
        # Check if user has permission to view
        if not (request.user.is_superadmin or request.user.is_coreadmin or request.user.is_centreadmin):
            return Response(
                {"error": "You don't have permission to view admins"},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().list(request, *args, **kwargs)


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete an admin user"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer
    lookup_field = 'id'
    
    def get_queryset(self):
        user = self.request.user
        
        if user.is_superadmin:
            return User.objects.filter(is_staff=True)
        elif user.is_coreadmin:
            return User.objects.filter(
                is_staff=True,
                role__in=[User.Role.CENTRE_ADMIN, User.Role.OPERATOR]
            )
        elif user.is_centreadmin:
            return User.objects.filter(
                role=User.Role.OPERATOR,
                assigned_centre=user.assigned_centre
            )
        return User.objects.none()
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UpdateAdminSerializer
        return UserSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_destroy(self, instance):
        # Check permission
        if not (self.request.user.is_superadmin or 
                (self.request.user.is_coreadmin and instance.role != User.Role.SUPERADMIN)):
            self.permission_denied(
                self.request,
                message="You don't have permission to delete this admin"
            )
        
        # Log deletion
        AdminAuditLog.objects.create(
            user=self.request.user,
            action='DELETE',
            target_user=instance,
            details={'role': instance.role}
        )
        instance.delete()
    
    def retrieve(self, request, *args, **kwargs):
        # Check permission
        if not (request.user.is_superadmin or request.user.is_coreadmin or request.user.is_centreadmin):
            return Response(
                {"error": "You don't have permission to view admin details"},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().retrieve(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        # Check permission
        if not (request.user.is_superadmin or request.user.is_coreadmin):
            return Response(
                {"error": "You don't have permission to update admins"},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)



class AdminRoleListView(APIView):
    """Get list of available roles for dropdown"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        # Only super admin and core admin can see roles
        if not (request.user.is_superadmin or request.user.is_coreadmin):
            return Response(
                {"error": "You don't have permission to view roles"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        roles = [
            {'value': 'coreadmin', 'label': 'Core Admin', 'description': 'Can manage centres and centre admins'},
            {'value': 'centreadmin', 'label': 'Centre Admin', 'description': 'Can manage a specific centre'},
            {'value': 'operator', 'label': 'Operator', 'description': 'Limited operational access'},
        ]
        
        # Super admin can create all roles
        if request.user.is_superadmin:
            return Response(roles)
        
        # Core admin can only create centre admins and operators
        if request.user.is_coreadmin:
            return Response([r for r in roles if r['value'] != 'coreadmin'])
        
        return Response([])


class AdminAuditLogListView(generics.ListAPIView):
    """List admin audit logs"""
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
    serializer_class = AdminAuditLogSerializer
    
    def get_queryset(self):
        queryset = AdminAuditLog.objects.all()
        
        # Filter by user
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Filter by action
        action = self.request.query_params.get('action')
        if action:
            queryset = queryset.filter(action=action)
        
        return queryset[:100]  # Limit to last 100 logs


class MyAdminsView(APIView):
    """Get admins created by current user"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        admins = User.objects.filter(created_by=request.user)
        serializer = UserSerializer(admins, many=True)
        return Response(serializer.data)


class ToggleAdminStatusView(APIView):
    """Activate or deactivate an admin user"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, id):
        # Check permission
        if not (request.user.is_superadmin or request.user.is_coreadmin):
            return Response(
                {"error": "You don't have permission to change admin status"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        admin = get_object_or_404(User, id=id)
        
        # Core admin cannot toggle super admin status
        if request.user.is_coreadmin and admin.role == User.Role.SUPERADMIN:
            return Response(
                {"error": "You cannot change super admin status"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        admin.is_active = not admin.is_active
        admin.save()
        
        # Log status change
        AdminAuditLog.objects.create(
            user=request.user,
            action='UPDATE',
            target_user=admin,
            details={'status_toggled': admin.is_active}
        )
        
        return Response({
            'message': f'Admin {"activated" if admin.is_active else "deactivated"} successfully',
            'is_active': admin.is_active
        })
    
class CheckPermissionsView(APIView):
    """Check current user permissions"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        return Response({
            'user_id': str(user.id),
            'full_name': user.full_name,
            'role': user.role,
            'is_superadmin': user.is_superadmin,
            'is_coreadmin': user.is_coreadmin,
            'is_centreadmin': user.is_centreadmin,
            'is_operator': user.is_operator,
            'is_staff': user.is_staff,
            'is_active': user.is_active,
            'assigned_centre': user.assigned_centre_id,
            'permissions': {
                'can_view_admins': user.is_superadmin or user.is_coreadmin or user.is_centreadmin,
                'can_create_admins': user.is_superadmin or user.is_coreadmin,
                'can_edit_admins': user.is_superadmin or user.is_coreadmin,
                'can_delete_admins': user.is_superadmin,
            }
        })