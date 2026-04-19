# core/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Centre URLs
    path('centres/', views.centre_list, name='centre-list'),
    path('centres/<uuid:pk>/', views.centre_detail, name='centre-detail'),
    path('centres/<uuid:centre_id>/courses/', views.courses_by_centre, name='courses-by-centre'),  # Add this if missing
    
    # Category URLs
    path('categories/', views.category_list, name='category-list'),
    path('categories/<uuid:pk>/', views.category_detail, name='category-detail'),
    
    # Course URLs
    path('courses/', views.course_list, name='course-list'),
    path('courses/<uuid:pk>/', views.course_detail, name='course-detail'),
    path('courses/centre/<uuid:centre_id>/', views.courses_by_centre, name='courses-by-centre'),
    path('courses/category/<uuid:category_id>/', views.courses_by_category, name='courses-by-category'),
    path('courses/active/', views.active_courses, name='active-courses'),
]