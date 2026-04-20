# core/serializers.py
from rest_framework import serializers
from .models import Centre, CourseCategory, Course, Student, Enrollment, Batch


class CentreSerializer(serializers.ModelSerializer):
    """Reusable Centre Serializer"""
    class Meta:
        model = Centre
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class CourseCategorySerializer(serializers.ModelSerializer):
    """Reusable Course Category Serializer"""
    class Meta:
        model = CourseCategory
        fields = '__all__'
        read_only_fields = ['id', 'created_datetime']


class CourseSerializer(serializers.ModelSerializer):
    """Reusable Course Serializer with nested relations"""
    centre_name = serializers.CharField(source='centre.centre_name', read_only=True)
    category_name = serializers.CharField(source='course_category.category_name', read_only=True)
    
    class Meta:
        model = Course
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class BatchSerializer(serializers.ModelSerializer):
    """Batch Serializer"""
    course_name = serializers.CharField(source='course.course_name', read_only=True)
    centre_name = serializers.CharField(source='centre.centre_name', read_only=True)
    current_enrollment = serializers.IntegerField(read_only=True)
    is_full = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Batch
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class StudentSerializer(serializers.ModelSerializer):
    """Student Serializer"""
    course_name = serializers.CharField(source='course.course_name', read_only=True)
    centre_name = serializers.CharField(source='centre.centre_name', read_only=True)
    batch_name = serializers.CharField(source='batch.batch_name', read_only=True)
    
    class Meta:
        model = Student
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class EnrollmentSerializer(serializers.ModelSerializer):
    """Enrollment Serializer"""
    student_name = serializers.CharField(source='student.candidate_name', read_only=True)
    course_name = serializers.CharField(source='course.course_name', read_only=True)
    centre_name = serializers.CharField(source='centre.centre_name', read_only=True)
    
    class Meta:
        model = Enrollment
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class BulkBatchCreateSerializer(serializers.Serializer):
    """Serializer for batch creation request"""
    centre_id = serializers.UUIDField(required=False)
    centre_name = serializers.CharField(required=False)
    course_id = serializers.UUIDField(required=False)
    course_name = serializers.CharField(required=False)
    student_ids = serializers.ListField(child=serializers.UUIDField())
    batch_info = serializers.DictField()