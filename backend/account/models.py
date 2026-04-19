# account/models.py

from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils.translation import gettext_lazy as _
from django.utils import timezone

class UserManager(BaseUserManager):
    def create_user(self, email, contact, password=None, **extra_fields):
        if not email and not contact:
            raise ValueError('Either email or contact must be set')
        
        email = self.normalize_email(email) if email else None
        user = self.model(email=email, contact=contact, **extra_fields)
        user.set_password(password)
        
        # Auto-set is_staff for admin roles
        if user.role in [User.Role.SUPERADMIN, User.Role.CORE_ADMIN, 
                         User.Role.CENTRE_ADMIN, User.Role.OPERATOR]:
            user.is_staff = True
        
        user.save(using=self._db)
        return user

    def create_superuser(self, email, contact, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', User.Role.SUPERADMIN)
        extra_fields.setdefault('is_active', True)
        
        return self.create_user(email, contact, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        SUPERADMIN = 'superadmin', _('Super Admin')
        CORE_ADMIN = 'coreadmin', _('Core Admin')
        CENTRE_ADMIN = 'centreadmin', _('Centre Admin')
        OPERATOR = 'operator', _('Operator')
        USER = 'user', _('User')
    
    email = models.EmailField(_('email address'), unique=True, null=True, blank=True)
    contact = models.CharField(_('contact number'), max_length=15, unique=True, null=True, blank=True)
    full_name = models.CharField(_('full name'), max_length=255)
    role = models.CharField(_('role'), max_length=20, choices=Role.choices, default=Role.USER)
    
    # Centre assignment (for centre admins)
    assigned_centre = models.ForeignKey('core.Centre', on_delete=models.SET_NULL, null=True, blank=True, related_name='staff_users')
    
    # Admin management fields
    created_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='created_users')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Status
    is_active = models.BooleanField(_('active'), default=True)
    is_staff = models.BooleanField(_('staff status'), default=False)
    is_superuser = models.BooleanField(_('superuser status'), default=False)
    
    # Last activity
    last_login = models.DateTimeField(_('last login'), blank=True, null=True)
    date_joined = models.DateTimeField(_('date joined'), default=timezone.now)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['contact', 'full_name']
    
    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')
        ordering = ['-date_joined']
    
    def __str__(self):
        return f"{self.full_name} ({self.get_role_display()})"
    
    def get_username(self):
        return self.email or self.contact
    
    @property
    def is_superadmin(self):
        return self.role == self.Role.SUPERADMIN
    
    @property
    def is_coreadmin(self):
        return self.role == self.Role.CORE_ADMIN
    
    @property
    def is_centreadmin(self):
        return self.role == self.Role.CENTRE_ADMIN
    
    @property
    def is_operator(self):
        return self.role == self.Role.OPERATOR
    
    def can_manage_user(self, target_user):
        """Check if current user can manage target user"""
        if self.is_superadmin:
            return True
        if self.is_coreadmin:
            return target_user.role in [User.Role.CENTRE_ADMIN, User.Role.OPERATOR, User.Role.USER]
        if self.is_centreadmin:
            return target_user.role == User.Role.OPERATOR and target_user.assigned_centre == self.assigned_centre
        return False
    
    def can_view_centre(self, centre):
        """Check if user can view a specific centre"""
        if self.is_superadmin or self.is_coreadmin:
            return True
        if self.is_centreadmin:
            return self.assigned_centre == centre
        return False


class AdminAuditLog(models.Model):
    """Track admin actions for security"""
    ACTION_CHOICES = [
        ('CREATE', 'Create'),
        ('UPDATE', 'Update'),
        ('DELETE', 'Delete'),
        ('LOGIN', 'Login'),
        ('LOGOUT', 'Logout'),
        ('ASSIGN_CENTRE', 'Assign Centre'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='audit_logs')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    target_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='targeted_logs')
    details = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Admin Audit Log'
        verbose_name_plural = 'Admin Audit Logs'
    
    def __str__(self):
        return f"{self.user.full_name} - {self.action} - {self.created_at}"