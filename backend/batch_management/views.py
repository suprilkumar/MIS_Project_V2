# batch_management/views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count
from core.models import Batch, Course, Centre, Student
from core.serializers import BatchSerializer
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


# =====================================================
# BATCH VIEWS
# =====================================================

@api_view(['GET', 'POST'])
def batch_list(request):
    """Get all batches or create new batch"""
    if request.method == 'GET':
        batches = Batch.objects.select_related('course', 'centre').all().order_by('-created_at')
        
        # Apply filters
        centre_id = request.query_params.get('centre')
        course_id = request.query_params.get('course')
        status_filter = request.query_params.get('status')
        batch_status_filter = request.query_params.get('batch_status')
        search = request.query_params.get('search')
        
        if centre_id:
            batches = batches.filter(centre_id=centre_id)
        if course_id:
            batches = batches.filter(course_id=course_id)
        if batch_status_filter:
            batches = batches.filter(batch_status=batch_status_filter)
        if search:
            batches = batches.filter(
                Q(batch_name__icontains=search) |
                Q(custom_batch_name__icontains=search) |
                Q(course__course_name__icontains=search) |
                Q(centre__centre_name__icontains=search) |
                Q(faculty_name__icontains=search)
            )
        
        # Apply date-based status filter
        if status_filter:
            today = datetime.now().date()
            if status_filter == 'active':
                batches = batches.filter(
                    batch_start_date__lte=today, 
                    batch_end_date__gte=today
                )
            elif status_filter == 'upcoming':
                batches = batches.filter(batch_start_date__gt=today)
            elif status_filter == 'completed':
                batches = batches.filter(batch_end_date__lt=today)
            elif status_filter == 'full':
                batches = [b for b in batches if b.is_full]
        
        serializer = BatchSerializer(batches, many=True)
        return Response({
            'batches': serializer.data,
            'total': len(batches) if isinstance(batches, list) else batches.count()
        }, status=status.HTTP_200_OK)
    
    elif request.method == 'POST':
        serializer = BatchSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def batch_detail(request, pk):
    """Get, update or delete a specific batch"""
    batch = get_object_or_404(Batch, pk=pk)
    
    if request.method == 'GET':
        serializer = BatchSerializer(batch)
        students = batch.students.all().values('id', 'candidate_name', 'application_number', 'gender', 'category', 'mobile_number', 'email_id', 'payment_status')
        return Response({
            **serializer.data,
            'students': list(students),
            'student_count': len(students),
            'available_seats': batch.max_capacity - len(students) if batch.max_capacity else None
        }, status=status.HTTP_200_OK)
    
    elif request.method == 'PUT':
        serializer = BatchSerializer(batch, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        batch.students.update(batch=None)
        batch.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# =====================================================
# BULK STATUS UPDATE
# =====================================================

@api_view(['POST'])
def bulk_update_batch_status(request):
    """Bulk update status for multiple batches"""
    batch_ids = request.data.get('batch_ids', [])
    new_status = request.data.get('batch_status')
    
    if not batch_ids:
        return Response({'error': 'No batch IDs provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    if not new_status:
        return Response({'error': 'No status provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate status
    valid_statuses = ['ACTIVE', 'INACTIVE', 'COMPLETED', 'UPCOMING', 'CANCELLED', 'HOLD']
    if new_status not in valid_statuses:
        return Response({'error': f'Invalid status. Must be one of: {valid_statuses}'}, status=status.HTTP_400_BAD_REQUEST)
    
    updated_count = Batch.objects.filter(id__in=batch_ids).update(batch_status=new_status)
    
    return Response({
        'message': f'Successfully updated {updated_count} batches to {new_status}',
        'updated_count': updated_count,
        'new_status': new_status
    }, status=status.HTTP_200_OK)


# =====================================================
# BATCH STUDENT MANAGEMENT
# =====================================================

@api_view(['POST'])
def add_students_to_batch(request, pk):
    """Add students to an existing batch"""
    batch = get_object_or_404(Batch, pk=pk)
    student_ids = request.data.get('student_ids', [])
    
    if not student_ids:
        return Response({'error': 'No student IDs provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    students = Student.objects.filter(id__in=student_ids)
    added_count = 0
    errors = []
    
    for student in students:
        if batch.is_full:
            errors.append(f"Batch is full. Cannot add {student.candidate_name}")
            continue
        student.batch = batch
        student.save()
        added_count += 1
    
    return Response({
        'message': f'Successfully added {added_count} students to batch',
        'added_count': added_count,
        'errors': errors
    }, status=status.HTTP_200_OK)


@api_view(['DELETE'])
def remove_student_from_batch(request, batch_id, student_id):
    """Remove a student from a batch"""
    batch = get_object_or_404(Batch, pk=batch_id)
    student = get_object_or_404(Student, pk=student_id, batch=batch)
    
    student.batch = None
    student.save()
    
    return Response({
        'message': f'Student {student.candidate_name} removed from batch {batch.batch_name or batch.custom_batch_name}'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
def batch_students(request, pk):
    """Get all students in a batch"""
    batch = get_object_or_404(Batch, pk=pk)
    students = batch.students.all().select_related('course', 'centre')
    
    students_data = []
    for student in students:
        students_data.append({
            'id': str(student.id),
            'candidate_name': student.candidate_name,
            'application_number': student.application_number,
            'registration_id': student.registration_id,
            'gender': student.gender,
            'category': student.category,
            'mobile_number': student.mobile_number,
            'email_id': student.email_id,
            'payment_status': student.payment_status,
            'application_date': student.application_date,
        })
    
    return Response({
        'students': students_data,
        'total': len(students_data),
        'batch_name': batch.batch_name or batch.custom_batch_name,
        'max_capacity': batch.max_capacity,
        'available_seats': batch.max_capacity - len(students_data) if batch.max_capacity else None
    }, status=status.HTTP_200_OK)


# =====================================================
# BATCH STATISTICS
# =====================================================

@api_view(['GET'])
def batch_statistics(request):
    """Get batch statistics"""
    total_batches = Batch.objects.count()
    
    # Status-based counts
    active_status_count = Batch.objects.filter(batch_status='ACTIVE').count()
    inactive_status_count = Batch.objects.filter(batch_status='INACTIVE').count()
    completed_status_count = Batch.objects.filter(batch_status='COMPLETED').count()
    upcoming_status_count = Batch.objects.filter(batch_status='UPCOMING').count()
    cancelled_status_count = Batch.objects.filter(batch_status='CANCELLED').count()
    hold_status_count = Batch.objects.filter(batch_status='HOLD').count()
    
    today = datetime.now().date()
    date_active_batches = Batch.objects.filter(
        batch_start_date__lte=today,
        batch_end_date__gte=today
    ).count()
    date_upcoming_batches = Batch.objects.filter(batch_start_date__gt=today).count()
    date_completed_batches = Batch.objects.filter(batch_end_date__lt=today).count()
    
    # Count full batches
    all_batches = Batch.objects.all()
    full_batches = sum(1 for b in all_batches if b.is_full)
    
    # Get batches with most students
    batches_with_counts = []
    for batch in all_batches:
        student_count = batch.students.count()
        batches_with_counts.append({
            'id': str(batch.id),
            'name': batch.batch_name or batch.custom_batch_name or 'Unnamed Batch',
            'student_count': student_count,
            'max_capacity': batch.max_capacity,
            'percentage': (student_count / batch.max_capacity * 100) if batch.max_capacity else 0,
            'batch_status': batch.batch_status
        })
    
    batches_with_counts.sort(key=lambda x: x['student_count'], reverse=True)
    
    # Centre wise batch distribution
    centre_distribution = []
    centres = Centre.objects.all()
    for centre in centres:
        batch_count = Batch.objects.filter(centre=centre).count()
        if batch_count > 0:
            centre_distribution.append({
                'centre__centre_name': centre.centre_name,
                'count': batch_count
            })
    
    return Response({
        'total_batches': total_batches,
        'active_status_count': active_status_count,
        'inactive_status_count': inactive_status_count,
        'completed_status_count': completed_status_count,
        'upcoming_status_count': upcoming_status_count,
        'cancelled_status_count': cancelled_status_count,
        'hold_status_count': hold_status_count,
        'date_active_batches': date_active_batches,
        'date_upcoming_batches': date_upcoming_batches,
        'date_completed_batches': date_completed_batches,
        'full_batches': full_batches,
        'top_batches': batches_with_counts[:5],
        'centre_distribution': centre_distribution
    }, status=status.HTTP_200_OK)


# =====================================================
# FILTERED LIST VIEWS
# =====================================================

@api_view(['GET'])
def batches_by_centre(request, centre_id):
    """Get all batches for a specific centre"""
    batches = Batch.objects.filter(centre_id=centre_id).select_related('course')
    serializer = BatchSerializer(batches, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
def batches_by_course(request, course_id):
    """Get all batches for a specific course"""
    batches = Batch.objects.filter(course_id=course_id).select_related('centre')
    serializer = BatchSerializer(batches, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
def available_batches(request):
    """Get batches with available seats"""
    batches = Batch.objects.all()
    available = [b for b in batches if not b.is_full]
    serializer = BatchSerializer(available, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


# =====================================================
# BULK DELETE
# =====================================================

@api_view(['POST'])
def bulk_delete_batches(request):
    """Delete multiple batches at once"""
    batch_ids = request.data.get('batch_ids', [])
    if not batch_ids:
        return Response({'error': 'No batch IDs provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    batches = Batch.objects.filter(id__in=batch_ids)
    for batch in batches:
        batch.students.update(batch=None)
    
    deleted_count = batches.count()
    batches.delete()
    
    return Response({
        'message': f'Successfully deleted {deleted_count} batches',
        'deleted_count': deleted_count
    }, status=status.HTTP_200_OK)