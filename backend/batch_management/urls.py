# batch_management/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Batch CRUD
    path('batches/', views.batch_list, name='batch-list'),
    path('batches/<uuid:pk>/', views.batch_detail, name='batch-detail'),
    
    # Bulk operations
    path('batches/bulk-update-status/', views.bulk_update_batch_status, name='bulk-update-status'),
    path('batches/bulk-delete/', views.bulk_delete_batches, name='bulk-delete-batches'),
    
    # Batch Student Management
    path('batches/<uuid:pk>/add-students/', views.add_students_to_batch, name='add-students-to-batch'),
    path('batches/<uuid:batch_id>/remove-student/<uuid:student_id>/', views.remove_student_from_batch, name='remove-student-from-batch'),
    path('batches/<uuid:pk>/students/', views.batch_students, name='batch-students'),
    
    # Statistics
    path('batches/statistics/', views.batch_statistics, name='batch-statistics'),
    
    # Filtered lists
    path('batches/centre/<uuid:centre_id>/', views.batches_by_centre, name='batches-by-centre'),
    path('batches/course/<uuid:course_id>/', views.batches_by_course, name='batches-by-course'),
    path('batches/available/', views.available_batches, name='available-batches'),
]