# account/permissions.py

from rest_framework import permissions

class IsSuperAdmin(permissions.BasePermission):
    """Super Admin only"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'superadmin'


class IsCoreAdmin(permissions.BasePermission):
    """Core Admin only"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'coreadmin'


class IsCentreAdmin(permissions.BasePermission):
    """Centre Admin only"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'centreadmin'


class IsAdminOrManager(permissions.BasePermission):
    """Superadmin, Coreadmin, or Centreadmin"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ['superadmin', 'coreadmin', 'centreadmin']


class IsOperator(permissions.BasePermission):
    """Operator only"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'operator'


class CanManageUsers(permissions.BasePermission):
    """Permission to manage users based on role hierarchy"""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Super admin can manage all
        if request.user.is_superadmin:
            return True
        
        # Core admin can manage centre admins, operators, and users
        if request.user.is_coreadmin:
            return True
        
        # Centre admin can only manage operators in their centre
        if request.user.is_centreadmin:
            return True
        
        return False
    
    def has_object_permission(self, request, view, obj):
        """Check if user can manage specific user object"""
        if request.user.is_superadmin:
            return True
        
        if request.user.is_coreadmin:
            # Core admin cannot manage super admins
            return obj.role not in ['superadmin']
        
        if request.user.is_centreadmin:
            # Centre admin can only manage operators in their centre
            return obj.role == 'operator' and obj.assigned_centre == request.user.assigned_centre
        
        return False


class CanAccessCentre(permissions.BasePermission):
    """Check if user can access a specific centre"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Super admin and core admin can access all centres
        if request.user.is_superadmin or request.user.is_coreadmin:
            return True
        
        # Centre admin can only access their assigned centre
        if request.user.is_centreadmin:
            return request.user.assigned_centre == obj
        
        return False