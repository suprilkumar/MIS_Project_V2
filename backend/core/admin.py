# core/admin.py
from django.contrib import admin
from .models import Centre, CourseCategory, Course, Student, Enrollment, Batch


@admin.register(Centre)
class CentreAdmin(admin.ModelAdmin):
    list_display = ['centre_name', 'centre_state', 'centre_contact', 'centre_email']
    list_filter = ['centre_state']
    search_fields = ['centre_name', 'centre_address', 'centre_contact', 'centre_email']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(CourseCategory)
class CourseCategoryAdmin(admin.ModelAdmin):
    list_display = ['category_type', 'category_name', 'created_datetime']
    list_filter = ['category_type']
    search_fields = ['category_name']
    readonly_fields = ['id', 'created_datetime']


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['course_name', 'centre', 'course_category', 'course_status', 'course_fees']
    list_filter = ['course_status', 'course_category', 'centre']
    search_fields = ['course_name', 'course_scheme']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['candidate_name', 'application_number', 'course', 'centre', 'batch', 'gender', 'category', 'payment_status']
    list_filter = ['payment_status', 'gender', 'category', 'course', 'centre', 'batch']
    search_fields = ['candidate_name', 'application_number', 'registration_id', 'mobile_number', 'email_id']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ['student', 'course', 'centre', 'is_enrolled', 'is_trained', 'is_certified', 'is_placed']
    list_filter = ['is_enrolled', 'is_trained', 'is_certified', 'is_placed', 'exam_status']
    search_fields = ['student__candidate_name', 'student__application_number', 'course__course_name']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(Batch)
class BatchAdmin(admin.ModelAdmin):
    list_display = ['batch_name', 'course', 'centre', 'batch_start_date', 'batch_end_date', 'faculty_name', 'current_enrollment_count']
    list_filter = ['centre', 'course', 'batch_start_date', 'batch_end_date']
    search_fields = ['batch_name', 'custom_batch_name', 'course__course_name', 'faculty_name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    def current_enrollment_count(self, obj):
        return obj.students.count()
    current_enrollment_count.short_description = 'Enrolled Students'