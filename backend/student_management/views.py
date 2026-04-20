# student_management/views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count
from core.models import Student, Course, Centre, Batch, Enrollment
from core.serializers import StudentSerializer
import logging
from django.db import transaction
from datetime import datetime, timezone
from django.utils import timezone

logger = logging.getLogger(__name__)


# =====================================================
# STUDENT VIEWS
# =====================================================

@api_view(['GET', 'POST'])
def student_list(request):
    """Get all students or create new student"""
    if request.method == 'GET':
        students = Student.objects.select_related('course', 'centre', 'batch').all().order_by('-created_at')
        
        # Apply filters
        centre_id = request.query_params.get('centre')
        course_id = request.query_params.get('course')
        batch_id = request.query_params.get('batch')
        gender = request.query_params.get('gender')
        category = request.query_params.get('category')
        payment_status = request.query_params.get('payment_status')
        search = request.query_params.get('search')
        
        if centre_id:
            students = students.filter(centre_id=centre_id)
        if course_id:
            students = students.filter(course_id=course_id)
        if batch_id:
            students = students.filter(batch_id=batch_id)
        if gender:
            students = students.filter(gender=gender)
        if category:
            students = students.filter(category=category)
        if payment_status:
            students = students.filter(payment_status=payment_status)
        if search:
            students = students.filter(
                Q(candidate_name__icontains=search) |
                Q(application_number__icontains=search) |
                Q(registration_id__icontains=search) |
                Q(mobile_number__icontains=search) |
                Q(email_id__icontains=search)
            )
        
        serializer = StudentSerializer(students, many=True)
        return Response({
            'students': serializer.data,
            'total': students.count()
        }, status=status.HTTP_200_OK)
    
    elif request.method == 'POST':
        serializer = StudentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def student_detail(request, pk):
    """Get, update or delete a specific student"""
    student = get_object_or_404(Student, pk=pk)
    
    if request.method == 'GET':
        serializer = StudentSerializer(student)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = StudentSerializer(student, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        student.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# =====================================================
# FILTERED LIST VIEWS
# =====================================================

@api_view(['GET'])
def students_by_centre(request, centre_id):
    """Get all students for a specific centre"""
    students = Student.objects.filter(centre_id=centre_id).select_related('course', 'batch')
    serializer = StudentSerializer(students, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def students_by_course(request, course_id):
    """Get all students for a specific course"""
    students = Student.objects.filter(course_id=course_id).select_related('centre', 'batch')
    serializer = StudentSerializer(students, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def students_by_batch(request, batch_id):
    """Get all students for a specific batch"""
    students = Student.objects.filter(batch_id=batch_id).select_related('course', 'centre')
    serializer = StudentSerializer(students, many=True)
    return Response(serializer.data)


# =====================================================
# STATISTICS VIEWS
# =====================================================

@api_view(['GET'])
def student_statistics(request):
    """Get student statistics"""
    total_students = Student.objects.count()
    active_students = Student.objects.filter(payment_status='SUCCESS').count()
    pending_students = Student.objects.filter(payment_status='PENDING').count()
    
    gender_breakdown = Student.objects.values('gender').annotate(count=Count('id'))
    category_breakdown = Student.objects.values('category').annotate(count=Count('id'))
    
    centre_breakdown = Student.objects.values('centre__centre_name').annotate(count=Count('id'))
    course_breakdown = Student.objects.values('course__course_name').annotate(count=Count('id'))
    
    return Response({
        'total_students': total_students,
        'active_students': active_students,
        'pending_students': pending_students,
        'gender_breakdown': gender_breakdown,
        'category_breakdown': category_breakdown,
        'centre_breakdown': centre_breakdown,
        'course_breakdown': course_breakdown,
    })


# =====================================================
# BULK OPERATIONS
# =====================================================

@api_view(['POST'])
def bulk_delete_students(request):
    """Delete multiple students at once"""
    student_ids = request.data.get('student_ids', [])
    if not student_ids:
        return Response({'error': 'No student IDs provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    deleted_count = Student.objects.filter(id__in=student_ids).delete()[0]
    return Response({
        'message': f'Successfully deleted {deleted_count} students',
        'deleted_count': deleted_count
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
def bulk_assign_batch(request):
    """Assign multiple students to a batch"""
    student_ids = request.data.get('student_ids', [])
    batch_id = request.data.get('batch_id')
    
    if not student_ids or not batch_id:
        return Response({'error': 'Missing student_ids or batch_id'}, status=status.HTTP_400_BAD_REQUEST)
    
    batch = get_object_or_404(Batch, id=batch_id)
    updated_count = Student.objects.filter(id__in=student_ids).update(batch=batch)
    
    return Response({
        'message': f'Successfully assigned {updated_count} students to batch {batch.batch_name}',
        'updated_count': updated_count
    }, status=status.HTTP_200_OK)



@api_view(['GET'])
def get_centres_with_batches(request):
    """Get all centres that have batches"""
    centres = Centre.objects.filter(batches__isnull=False).distinct()
    centres_data = []
    for centre in centres:
        centres_data.append({
            'id': str(centre.id),
            'name': centre.centre_name
        })
    return Response({'centres': centres_data}, status=status.HTTP_200_OK)


@api_view(['GET'])
def get_batches_by_centre(request, centre_id):
    """Get all batches for a specific centre with search functionality"""
    centre = get_object_or_404(Centre, id=centre_id)
    batches = Batch.objects.filter(centre=centre).select_related('course')
    
    # Apply search filters
    search = request.query_params.get('search', '')
    if search:
        batches = batches.filter(
            Q(batch_name__icontains=search) |
            Q(custom_batch_name__icontains=search) |
            Q(course__course_name__icontains=search)
        )
    
    # Apply status filter
    status_filter = request.query_params.get('status', '')
    if status_filter:
        batches = batches.filter(batch_status=status_filter)
    
    batches_data = []
    for batch in batches:
        batches_data.append({
            'id': str(batch.id),
            'batch_name': batch.batch_name,
            'custom_batch_name': batch.custom_batch_name,
            'display_name': batch.custom_batch_name or batch.batch_name or 'Unnamed Batch',
            'course_name': batch.course.course_name if batch.course else 'N/A',
            'course_id': str(batch.course.id) if batch.course else None,
            'batch_status': batch.batch_status,
            'batch_start_date': batch.batch_start_date,
            'batch_end_date': batch.batch_end_date,
            'faculty_name': batch.faculty_name,
            'max_capacity': batch.max_capacity,
            'current_enrollment': batch.current_enrollment_count,
            'is_full': batch.is_full
        })
    
    return Response({
        'centre': {
            'id': str(centre.id),
            'name': centre.centre_name
        },
        'batches': batches_data,
        'total': len(batches_data)
    }, status=status.HTTP_200_OK)


# =====================================================
# STUDENT ENROLLMENT STATUS MANAGEMENT
# =====================================================

@api_view(['GET'])
def get_batch_students_with_enrollment(request, batch_id):
    """Get all students in a batch with their enrollment status"""
    batch = get_object_or_404(Batch, id=batch_id)
    students = Student.objects.filter(batch=batch).select_related('course', 'centre')
    
    students_data = []
    for student in students:
        # Get or create enrollment record for this student
        enrollment, created = Enrollment.objects.get_or_create(
            student=student,
            course=student.course if student.course else batch.course,
            centre=student.centre if student.centre else batch.centre,
            defaults={
                'is_enrolled': True,
                'enrolled_date': timezone.now().date()
            }
        )
        
        students_data.append({
            'id': str(student.id),
            'application_number': student.application_number,
            'registration_id': student.registration_id,
            'candidate_name': student.candidate_name,
            'gender': student.gender,
            'category': student.category,
            'mobile_number': student.mobile_number,
            'email_id': student.email_id,
            'payment_status': student.payment_status,
            'application_date': student.application_date,
            'enrollment': {
                'is_enrolled': enrollment.is_enrolled,
                'enrolled_date': enrollment.enrolled_date,
                'is_trained': enrollment.is_trained,
                'trained_date': enrollment.trained_date,
                'is_certified': enrollment.is_certified,
                'certified_date': enrollment.certified_date,
                'is_placed': enrollment.is_placed,
                'placed_date': enrollment.placed_date,
                'exam_score': enrollment.exam_score,
                'exam_status': enrollment.exam_status,
                'attendance_percentage': enrollment.attendance_percentage
            }
        })
    
    return Response({
        'batch': {
            'id': str(batch.id),
            'name': batch.custom_batch_name or batch.batch_name or 'Unnamed Batch',
            'course_name': batch.course.course_name if batch.course else 'N/A',
            'centre_name': batch.centre.centre_name if batch.centre else 'N/A',
            'batch_start_date': batch.batch_start_date,
            'batch_end_date': batch.batch_end_date,
            'max_capacity': batch.max_capacity,
            'current_enrollment': len(students_data)
        },
        'students': students_data,
        'total': len(students_data)
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
def bulk_update_student_status(request, batch_id):
    """Bulk update enrollment status for multiple students in a batch"""
    batch = get_object_or_404(Batch, id=batch_id)
    student_ids = request.data.get('student_ids', [])
    updates = request.data.get('updates', {})
    
    if not student_ids:
        return Response({'error': 'No student IDs provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    if not updates:
        return Response({'error': 'No updates provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    updated_count = 0
    errors = []
    
    with transaction.atomic():
        for student_id in student_ids:
            try:
                student = Student.objects.get(id=student_id, batch=batch)
                
                # Get or create enrollment
                enrollment, created = Enrollment.objects.get_or_create(
                    student=student,
                    course=student.course if student.course else batch.course,
                    centre=student.centre if student.centre else batch.centre,
                    defaults={
                        'is_enrolled': updates.get('is_enrolled', True),
                        'enrolled_date': timezone.now().date() if updates.get('is_enrolled') else None
                    }
                )
                
                # Update enrollment fields
                if 'is_enrolled' in updates:
                    enrollment.is_enrolled = updates['is_enrolled']
                    if updates['is_enrolled'] and not enrollment.enrolled_date:
                        enrollment.enrolled_date = timezone.now().date()
                
                if 'is_trained' in updates:
                    enrollment.is_trained = updates['is_trained']
                    if updates['is_trained'] and not enrollment.trained_date:
                        enrollment.trained_date = timezone.now().date()
                
                if 'is_certified' in updates:
                    enrollment.is_certified = updates['is_certified']
                    if updates['is_certified'] and not enrollment.certified_date:
                        enrollment.certified_date = timezone.now().date()
                
                if 'is_placed' in updates:
                    enrollment.is_placed = updates['is_placed']
                    if updates['is_placed'] and not enrollment.placed_date:
                        enrollment.placed_date = timezone.now().date()
                
                if 'exam_score' in updates:
                    enrollment.exam_score = updates['exam_score']
                    # Auto-calculate exam status based on score
                    if updates['exam_score'] is not None:
                        if updates['exam_score'] >= 50:
                            enrollment.exam_status = 'PASSED'
                        else:
                            enrollment.exam_status = 'FAILED'
                
                if 'exam_status' in updates:
                    enrollment.exam_status = updates['exam_status']
                
                if 'attendance_percentage' in updates:
                    enrollment.attendance_percentage = updates['attendance_percentage']
                
                enrollment.save()
                updated_count += 1
                
            except Student.DoesNotExist:
                errors.append(f"Student with id {student_id} not found in this batch")
            except Exception as e:
                errors.append(f"Error updating student {student_id}: {str(e)}")
    
    return Response({
        'message': f'Successfully updated {updated_count} students',
        'updated_count': updated_count,
        'errors': errors
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
def bulk_update_training_status(request, batch_id):
    """Bulk update training, certification, and placement status for students"""
    batch = get_object_or_404(Batch, id=batch_id)
    student_ids = request.data.get('student_ids', [])
    status_type = request.data.get('status_type')  # 'trained', 'certified', 'placed'
    value = request.data.get('value', False)
    
    if not student_ids:
        return Response({'error': 'No student IDs provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    if status_type not in ['trained', 'certified', 'placed']:
        return Response({'error': 'Invalid status type. Must be trained, certified, or placed'}, status=status.HTTP_400_BAD_REQUEST)
    
    updated_count = 0
    errors = []
    
    with transaction.atomic():
        for student_id in student_ids:
            try:
                student = Student.objects.get(id=student_id, batch=batch)
                
                # Get or create enrollment
                enrollment, created = Enrollment.objects.get_or_create(
                    student=student,
                    course=student.course if student.course else batch.course,
                    centre=student.centre if student.centre else batch.centre,
                    defaults={'is_enrolled': True}
                )
                
                if status_type == 'trained':
                    enrollment.is_trained = value
                    if value and not enrollment.trained_date:
                        enrollment.trained_date = timezone.now().date()
                elif status_type == 'certified':
                    enrollment.is_certified = value
                    if value and not enrollment.certified_date:
                        enrollment.certified_date = timezone.now().date()
                elif status_type == 'placed':
                    enrollment.is_placed = value
                    if value and not enrollment.placed_date:
                        enrollment.placed_date = timezone.now().date()
                
                enrollment.save()
                updated_count += 1
                
            except Student.DoesNotExist:
                errors.append(f"Student with id {student_id} not found in this batch")
            except Exception as e:
                errors.append(f"Error updating student {student_id}: {str(e)}")
    
    return Response({
        'message': f'Successfully updated {updated_count} students',
        'updated_count': updated_count,
        'errors': errors
    }, status=status.HTTP_200_OK)


@api_view(['PUT'])
def update_student_enrollment(request, student_id):
    """Update individual student enrollment status"""
    student = get_object_or_404(Student, id=student_id)
    data = request.data
    
    # Get or create enrollment
    enrollment, created = Enrollment.objects.get_or_create(
        student=student,
        course=student.course,
        centre=student.centre,
        defaults={'is_enrolled': True}
    )
    
    # Update fields
    if 'is_enrolled' in data:
        enrollment.is_enrolled = data['is_enrolled']
        if data['is_enrolled'] and not enrollment.enrolled_date:
            enrollment.enrolled_date = timezone.now().date()
    
    if 'is_trained' in data:
        enrollment.is_trained = data['is_trained']
        if data['is_trained'] and not enrollment.trained_date:
            enrollment.trained_date = timezone.now().date()
    
    if 'is_certified' in data:
        enrollment.is_certified = data['is_certified']
        if data['is_certified'] and not enrollment.certified_date:
            enrollment.certified_date = timezone.now().date()
    
    if 'is_placed' in data:
        enrollment.is_placed = data['is_placed']
        if data['is_placed'] and not enrollment.placed_date:
            enrollment.placed_date = timezone.now().date()
    
    if 'exam_score' in data:
        enrollment.exam_score = data['exam_score']
        if data['exam_score'] is not None:
            if data['exam_score'] >= 50:
                enrollment.exam_status = 'PASSED'
            else:
                enrollment.exam_status = 'FAILED'
    
    if 'exam_status' in data:
        enrollment.exam_status = data['exam_status']
    
    if 'attendance_percentage' in data:
        enrollment.attendance_percentage = data['attendance_percentage']
    
    enrollment.save()
    
    serializer = StudentSerializer(student)
    return Response({
        'message': 'Student enrollment updated successfully',
        'student': serializer.data,
        'enrollment': {
            'is_enrolled': enrollment.is_enrolled,
            'is_trained': enrollment.is_trained,
            'is_certified': enrollment.is_certified,
            'is_placed': enrollment.is_placed,
            'exam_score': enrollment.exam_score,
            'exam_status': enrollment.exam_status,
            'attendance_percentage': enrollment.attendance_percentage
        }
    }, status=status.HTTP_200_OK)


# =====================================================
# BATCH STATISTICS (Enhanced)
# =====================================================

@api_view(['GET'])
def batch_enrollment_statistics(request, batch_id):
    """Get enrollment statistics for a specific batch"""
    batch = get_object_or_404(Batch, id=batch_id)
    students = Student.objects.filter(batch=batch)
    
    total_students = students.count()
    
    # Get enrollment statistics
    enrolled_count = 0
    trained_count = 0
    certified_count = 0
    placed_count = 0
    
    gender_stats = {'M': 0, 'F': 0}
    category_stats = {'GEN': 0, 'SC': 0, 'ST': 0, 'OBC': 0}
    
    for student in students:
        enrollment = Enrollment.objects.filter(student=student).first()
        
        if enrollment:
            if enrollment.is_enrolled:
                enrolled_count += 1
            if enrollment.is_trained:
                trained_count += 1
            if enrollment.is_certified:
                certified_count += 1
            if enrollment.is_placed:
                placed_count += 1
        
        # Gender stats
        if student.gender in gender_stats:
            gender_stats[student.gender] += 1
        
        # Category stats
        if student.category in category_stats:
            category_stats[student.category] += 1
    
    return Response({
        'batch': {
            'id': str(batch.id),
            'name': batch.custom_batch_name or batch.batch_name or 'Unnamed Batch',
            'course_name': batch.course.course_name if batch.course else 'N/A',
            'centre_name': batch.centre.centre_name if batch.centre else 'N/A'
        },
        'statistics': {
            'total_students': total_students,
            'enrolled': enrolled_count,
            'trained': trained_count,
            'certified': certified_count,
            'placed': placed_count,
            'enrollment_rate': round((enrolled_count / total_students * 100) if total_students > 0 else 0, 2),
            'training_rate': round((trained_count / total_students * 100) if total_students > 0 else 0, 2),
            'certification_rate': round((certified_count / total_students * 100) if total_students > 0 else 0, 2),
            'placement_rate': round((placed_count / total_students * 100) if total_students > 0 else 0, 2),
            'gender_breakdown': gender_stats,
            'category_breakdown': category_stats
        }
    }, status=status.HTTP_200_OK)