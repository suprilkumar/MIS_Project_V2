# account/urls.py

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, LogoutView,
    UserProfileView, ChangePasswordView, ValidateTokenView,
    AdminUserListView, AdminUserDetailView, AdminRoleListView,
    AdminAuditLogListView, MyAdminsView, ToggleAdminStatusView,
    CheckPermissionsView  # Add this
)

urlpatterns = [
    # Authentication
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('validate-token/', ValidateTokenView.as_view(), name='validate_token'),
    path('check-permissions/', CheckPermissionsView.as_view(), name='check_permissions'),  # Add this
    
    # Admin Management
    path('admins/', AdminUserListView.as_view(), name='admin-list'),
    path('admins/<uuid:id>/', AdminUserDetailView.as_view(), name='admin-detail'),
    path('admins/<uuid:id>/toggle-status/', ToggleAdminStatusView.as_view(), name='admin-toggle-status'),
    path('roles/', AdminRoleListView.as_view(), name='admin-roles'),
    path('audit-logs/', AdminAuditLogListView.as_view(), name='audit-logs'),
    path('my-admins/', MyAdminsView.as_view(), name='my-admins'),
]