# mis_report/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # File upload and processing
    path('upload/', views.mis_csv_upload, name='mis_csv_upload'),
    path('save-students/', views.save_uploaded_students, name='save_uploaded_students'),
    
    # Batch management
    path('batches/create/', views.create_batches_from_students, name='create_batches'),
    
    # Data retrieval endpoints
    path('centres/', views.get_centres_list, name='centres_list'),
    path('centres/<uuid:centre_id>/courses/', views.get_courses_by_centre, name='courses_by_centre'),
    path('students/saved/', views.get_saved_students, name='get_saved_students'),
]