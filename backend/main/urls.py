from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path('api/auth/', include('account.urls')),
    path('api/core/', include('core.urls')),
    path('api/mis-data/', include('mis_report.urls')),
    path('api/student-management/', include('student_management.urls')),
    path('api/batch-management/', include('batch_management.urls')),
]
