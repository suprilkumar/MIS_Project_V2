# mis_report/serializers.py
from rest_framework import serializers
from core.models import Student, Centre, Course, Enrollment
from django.utils import timezone
from datetime import datetime

class StudentUploadSerializer(serializers.ModelSerializer):
    """Serializer for student data from Excel/CSV upload"""
    
    class Meta:
        model = Student
        fields = [
            'application_number', 'registration_id', 'candidate_name',
            'gender', 'category', 'mobile_number', 'email_id',
            'application_fee', 'application_date', 'course_applied',
            'payment_status'
        ]
    
    def validate_payment_status(self, value):
        """Ensure payment status is valid"""
        if value.upper() not in ['PENDING', 'SUCCESS', 'FAILED']:
            return 'PENDING'
        return value.upper()


class StudentDetailSerializer(serializers.ModelSerializer):
    """Detailed student serializer for display"""
    month_year = serializers.SerializerMethodField()
    
    class Meta:
        model = Student
        fields = [
            'id', 'application_number', 'registration_id', 'candidate_name',
            'gender', 'category', 'mobile_number', 'email_id',
            'application_fee', 'application_date', 'month_year'
        ]
    
    def get_month_year(self, obj):
        if obj.application_date:
            return obj.application_date.strftime('%b %Y')
        return None


class BatchInfoSerializer(serializers.Serializer):
    """Serializer for batch information input"""
    batch_name = serializers.CharField(read_only=True)
    custom_batch_name = serializers.CharField(required=False, allow_blank=True)
    batch_start_date = serializers.DateField(required=True)
    batch_end_date = serializers.DateField(required=True)


class BatchCreationSerializer(serializers.Serializer):
    """Serializer for batch creation request"""
    centre_id = serializers.UUIDField()
    course_id = serializers.UUIDField()
    student_ids = serializers.ListField(child=serializers.UUIDField())
    batch_info = BatchInfoSerializer()


class UploadSummarySerializer(serializers.Serializer):
    """Serializer for upload summary statistics"""
    total_students = serializers.IntegerField()
    total_centres = serializers.IntegerField()
    centres_list = serializers.ListField(child=serializers.CharField())
    total_courses = serializers.IntegerField()
    courses_by_centre = serializers.DictField()
    months_range = serializers.ListField(child=serializers.CharField())
    gender_breakdown = serializers.DictField()
    category_breakdown = serializers.DictField()
    centre_course_counts = serializers.ListField()