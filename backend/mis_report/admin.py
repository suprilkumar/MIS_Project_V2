# core/admin.py
from django.contrib import admin
from core.models import Centre, CourseCategory, Course, Student, Enrollment

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['candidate_name', 'application_number', 'gender', 'category', 'payment_status']
    list_filter = ['payment_status', 'gender', 'category']
    search_fields = ['candidate_name', 'application_number', 'mobile_number', 'email_id']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ['student', 'course', 'centre', 'batch_name', 'is_enrolled']
    list_filter = ['is_enrolled', 'is_trained', 'is_certified', 'centre']
    search_fields = ['student__candidate_name', 'course__course_name', 'batch_name']
    readonly_fields = ['created_at', 'updated_at']