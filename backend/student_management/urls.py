# student_management/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Student CRUD
    path('students/', views.student_list, name='student-list'),
    path('students/<uuid:pk>/', views.student_detail, name='student-detail'),
    
    # Filtered lists
    path('students/centre/<uuid:centre_id>/', views.students_by_centre, name='students-by-centre'),
    path('students/course/<uuid:course_id>/', views.students_by_course, name='students-by-course'),
    path('students/batch/<uuid:batch_id>/', views.students_by_batch, name='students-by-batch'),
    
    # Statistics
    path('students/statistics/', views.student_statistics, name='student-statistics'),
    
    # Bulk operations
    path('students/bulk-delete/', views.bulk_delete_students, name='bulk-delete-students'),
    path('students/bulk-assign-batch/', views.bulk_assign_batch, name='bulk-assign-batch'),
    
    # NEW: Batch and Student Enrollment Management
    path('centres-with-batches/', views.get_centres_with_batches, name='centres-with-batches'),
    path('centres/<uuid:centre_id>/batches/', views.get_batches_by_centre, name='batches-by-centre'),
    path('batches/<uuid:batch_id>/students/', views.get_batch_students_with_enrollment, name='batch-students-with-enrollment'),
    path('batches/<uuid:batch_id>/students/bulk-update/', views.bulk_update_student_status, name='bulk-update-student-status'),
    path('batches/<uuid:batch_id>/students/bulk-training/', views.bulk_update_training_status, name='bulk-update-training-status'),
    path('batches/<uuid:batch_id>/statistics/', views.batch_enrollment_statistics, name='batch-enrollment-statistics'),
    path('students/<uuid:student_id>/enrollment/', views.update_student_enrollment, name='update-student-enrollment'),
]