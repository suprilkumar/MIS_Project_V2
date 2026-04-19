# core/serializers.py

from rest_framework import serializers
from .models import Centre, CourseCategory, Course


class CentreSerializer(serializers.ModelSerializer):
    """Reusable Centre Serializer"""
    class Meta:
        model = Centre
        fields = '__all__'
        read_only_fields = ['id']


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