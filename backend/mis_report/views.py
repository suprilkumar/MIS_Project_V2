# mis_report/views.py
import pandas as pd
import numpy as np
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from django.utils import timezone
from datetime import datetime
import uuid
import logging
import traceback
from core.models import Centre, Course, CourseCategory, Student, Enrollment, Batch

logger = logging.getLogger(__name__)


@api_view(['POST'])
@parser_classes([FormParser, MultiPartParser])
def mis_csv_upload(request):
    """Upload and process CSV/Excel file with student data"""
    try:
        file = request.FILES.get('file')
        
        if not file:
            return Response(
                {"error": "No file uploaded"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Parse file
        if file.name.endswith('.csv'):
            encodings = ['utf-8', 'latin1', 'iso-8859-1', 'cp1252']
            df = None
            for encoding in encodings:
                try:
                    file.seek(0)
                    df = pd.read_csv(file, encoding=encoding, dtype=str)
                    logger.info(f"Successfully read CSV with encoding: {encoding}")
                    break
                except UnicodeDecodeError:
                    continue
            if df is None:
                raise ValueError("Could not read CSV file with any common encoding")
        elif file.name.endswith(('.xlsx', '.xls')):
            file.seek(0)
            df = pd.read_excel(file, dtype=str, engine='openpyxl')
        else:
            return Response(
                {"error": "Unsupported file format"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Clean column names
        df.columns = df.columns.str.strip()
        
        # Define required columns
        required_cols = ["Course Location", "Course Applied", "Payment Status", "Application Date"]
        normalized_cols = {col.lower(): col for col in df.columns}
        
        missing_cols = []
        for req_col in required_cols:
            if req_col.lower() not in normalized_cols:
                missing_cols.append(req_col)
        
        if missing_cols:
            return Response(
                {"error": f"Missing required columns: {', '.join(missing_cols)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Map actual column names
        col_mapping = {col: normalized_cols.get(col.lower(), col) for col in required_cols}
        
        # Normalize data
        df["Payment Status"] = df[col_mapping["Payment Status"]].str.upper().str.strip()
        df["Gender"] = df.get("Gender", pd.Series()).str.upper().str.strip()
        df["Category"] = df.get("Category", pd.Series()).str.upper().str.strip()
        
        # Filter only SUCCESS payments
        df_success = df[df["Payment Status"] == "SUCCESS"].copy()
        
        if len(df_success) == 0:
            payment_counts = df["Payment Status"].value_counts().to_dict()
            return Response(
                {"error": f"No successful payment records found. Payment status distribution: {payment_counts}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Parse date function
        def parse_date(date_str):
            if pd.isna(date_str) or date_str == '' or date_str == 'nan':
                return None
            date_str = str(date_str).strip()
            date_formats = [
                '%d/%m/%Y', '%d-%m-%Y', '%d.%m.%Y',
                '%m/%d/%Y', '%m-%d-%Y', '%m.%d.%Y',
                '%Y/%m/%d', '%Y-%m-%d', '%Y.%m.%d',
                '%d/%m/%y', '%d-%m-%y',
            ]
            for fmt in date_formats:
                try:
                    return datetime.strptime(date_str, fmt).date()
                except (ValueError, TypeError):
                    continue
            try:
                return pd.to_datetime(date_str).date()
            except:
                return None
        
        def parse_datetime(date_str):
            if pd.isna(date_str) or date_str == '' or date_str == 'nan':
                return None
            date_str = str(date_str).strip()
            datetime_formats = [
                '%d/%m/%Y %H:%M:%S', '%d-%m-%Y %H:%M:%S',
                '%d/%m/%Y', '%d-%m-%Y',
                '%Y-%m-%d %H:%M:%S', '%Y-%m-%d'
            ]
            for fmt in datetime_formats:
                try:
                    return datetime.strptime(date_str, fmt)
                except (ValueError, TypeError):
                    continue
            return None
        
        # Process students data
        students_data = []
        centres_set = set()
        courses_set = set()
        courses_by_centre = {}
        
        course_location_col = col_mapping.get("Course Location", "Course Location")
        course_applied_col = "Course Applied"
        app_date_col = col_mapping.get("Application Date", "Application Date")
        
        for idx, row in df_success.iterrows():
            try:
                app_date = parse_date(row.get(app_date_col, ""))
                month_year = app_date.strftime("%b %Y") if app_date else "Unknown"
                
                course_location = str(row.get(course_location_col, "")).strip()
                course_applied = str(row.get(course_applied_col, "")).strip()
                
                if not course_location or not course_applied:
                    continue
                
                student_info = {
                    "id": str(uuid.uuid4()),
                    "month_year": month_year,
                    "course_location": course_location,
                    "course_applied": course_applied,
                    "application_number": str(row.get("Application Number", "")).strip(),
                    "registration_id": str(row.get("Registration ID", "")).strip(),
                    "candidate_name": str(row.get("Candidate Name", row.get("Student Name", ""))).strip(),
                    "father_name": str(row.get("Father Name", "")).strip(),
                    "mother_name": str(row.get("Mother Name", "")).strip(),
                    "gender": str(row.get("Gender", "M"))[:1].upper() if pd.notna(row.get("Gender")) else "M",
                    "date_of_birth": parse_date(row.get("Date of Birth", "")),
                    "category": str(row.get("Category", "GEN")).upper().strip(),
                    "id_card_type": str(row.get("Identity Card Type", "Aadhaar Card")).strip(),
                    "id_card_number": str(row.get("Identity Card Number", "")).strip(),
                    "address": str(row.get("Correspondence Address", row.get("Address", ""))).strip(),
                    "permanent_address": str(row.get("Permanent Address", "")).strip(),
                    "mobile_number": str(row.get("Mobile Number", row.get("Mobile", ""))).strip(),
                    "email_id": str(row.get("Email ID", row.get("Email", ""))).strip(),
                    "qualification": str(row.get("Qualification", "")).strip(),
                    "application_fee": float(row.get("Application Fee", 0)) if pd.notna(row.get("Application Fee")) else 0,
                    "payment_status": str(row.get("Payment Status", "PENDING")).upper().strip(),
                    "fee_reference_number": str(row.get("Fee Reference Number", "")).strip(),
                    "transaction_id": str(row.get("Transaction ID", "")).strip(),
                    "payment_date": parse_datetime(row.get("Payment Date", "")),
                    "discount_criteria": str(row.get("Discount Criteria", "")).strip(),
                    "discount_percentage": float(row.get("Discount Percentage", 0)) if pd.notna(row.get("Discount Percentage")) else 0,
                    "total_discount": float(row.get("Total Discount", 0)) if pd.notna(row.get("Total Discount")) else 0,
                    "application_date": app_date
                }
                students_data.append(student_info)
                
                centres_set.add(course_location)
                courses_set.add(course_applied)
                
                if course_location not in courses_by_centre:
                    courses_by_centre[course_location] = set()
                courses_by_centre[course_location].add(course_applied)
                
            except Exception as row_error:
                logger.error(f"Error processing row {idx}: {str(row_error)}")
                continue
        
        if len(students_data) == 0:
            return Response(
                {"error": "No valid student records found"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Prepare centre_course_counts
        centre_course_counts = []
        for centre in centres_set:
            centre_data = {
                "centre_name": centre,
                "courses": {},
                "total": 0
            }
            centre_students = [s for s in students_data if s["course_location"] == centre]
            for student in centre_students:
                course = student["course_applied"]
                centre_data["courses"][course] = centre_data["courses"].get(course, 0) + 1
                centre_data["total"] += 1
            centre_course_counts.append(centre_data)
        
        summary = {
            "total_students": len(students_data),
            "total_centres": len(centres_set),
            "centres_list": list(centres_set),
            "total_courses": len(courses_set),
            "courses_by_centre": {k: list(v) for k, v in courses_by_centre.items()},
            "centre_course_counts": centre_course_counts,
            "gender_breakdown": df_success["Gender"].value_counts().to_dict() if "Gender" in df_success.columns else {},
            "category_breakdown": df_success["Category"].value_counts().to_dict() if "Category" in df_success.columns else {},
            "payment_breakdown": df_success["Payment Status"].value_counts().to_dict(),
            "months_range": sorted(set([s["month_year"] for s in students_data if s["month_year"] != "Unknown"]))
        }
        
        return Response({
            "summary": summary,
            "students": students_data,
            "total_students": len(students_data)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in mis_csv_upload: {str(e)}")
        logger.error(traceback.format_exc())
        return Response(
            {"error": f"Error processing file: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def save_uploaded_students(request):
    """Save uploaded students to database with course and centre relationships"""
    try:
        from core.models import Centre, Course, CourseCategory, Student
        from django.db import transaction
        
        students_data = request.data.get('students', [])
        
        if not students_data:
            return Response(
                {"error": "No student data provided"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get or create default course category
        default_category, _ = CourseCategory.objects.get_or_create(
            category_type='A',
            category_name='Default Category',
            defaults={'course_category_desc': 'Auto-created default category'}
        )
        
        created_count = 0
        updated_count = 0
        errors = []
        
        with transaction.atomic():
            for student_info in students_data:
                try:
                    # Get or create centre
                    centre, centre_created = Centre.objects.get_or_create(
                        centre_name=student_info.get('course_location'),
                        defaults={
                            'centre_address': 'To be updated',
                            'centre_state': 'Delhi'
                        }
                    )
                    
                    # Get or create course
                    course, course_created = Course.objects.get_or_create(
                        course_name=student_info.get('course_applied'),
                        centre=centre,
                        defaults={
                            'course_category': default_category,
                            'course_status': 'ACTIVE'
                        }
                    )
                    
                    # Check if student exists
                    application_number = student_info.get('application_number')
                    if not application_number:
                        errors.append(f"Skipping student {student_info.get('candidate_name')}: No application number")
                        continue
                    
                    # Create or update student (without batch assignment initially)
                    student, created = Student.objects.get_or_create(
                        application_number=application_number,
                        defaults={
                            'course': course,
                            'centre': centre,
                            'registration_id': student_info.get('registration_id', ''),
                            'candidate_name': student_info.get('candidate_name', 'Unknown'),
                            'father_name': student_info.get('father_name', ''),
                            'mother_name': student_info.get('mother_name', ''),
                            'gender': student_info.get('gender', 'M'),
                            'date_of_birth': student_info.get('date_of_birth'),
                            'category': student_info.get('category', 'GEN'),
                            'id_card_type': student_info.get('id_card_type', 'Aadhaar Card'),
                            'id_card_number': student_info.get('id_card_number', ''),
                            'address': student_info.get('address', ''),
                            'mobile_number': student_info.get('mobile_number', ''),
                            'email_id': student_info.get('email_id', ''),
                            'qualification': student_info.get('qualification', ''),
                            'application_fee': student_info.get('application_fee', 0),
                            'payment_status': student_info.get('payment_status', 'PENDING'),
                            'fee_reference_number': student_info.get('fee_reference_number', ''),
                            'transaction_id': student_info.get('transaction_id', ''),
                            'payment_date': student_info.get('payment_date'),
                            'discount_criteria': student_info.get('discount_criteria', ''),
                            'discount_percentage': student_info.get('discount_percentage', 0),
                            'total_discount': student_info.get('total_discount', 0),
                            'application_date': student_info.get('application_date'),
                        }
                    )
                    
                    if not created:
                        # Update existing student
                        student.course = course
                        student.centre = centre
                        student.registration_id = student_info.get('registration_id', student.registration_id)
                        student.candidate_name = student_info.get('candidate_name', student.candidate_name)
                        student.father_name = student_info.get('father_name', student.father_name)
                        student.mother_name = student_info.get('mother_name', student.mother_name)
                        student.gender = student_info.get('gender', student.gender)
                        student.date_of_birth = student_info.get('date_of_birth', student.date_of_birth)
                        student.category = student_info.get('category', student.category)
                        student.id_card_type = student_info.get('id_card_type', student.id_card_type)
                        student.id_card_number = student_info.get('id_card_number', student.id_card_number)
                        student.address = student_info.get('address', student.address)
                        student.mobile_number = student_info.get('mobile_number', student.mobile_number)
                        student.email_id = student_info.get('email_id', student.email_id)
                        student.qualification = student_info.get('qualification', student.qualification)
                        student.application_fee = student_info.get('application_fee', student.application_fee)
                        student.payment_status = student_info.get('payment_status', student.payment_status)
                        student.fee_reference_number = student_info.get('fee_reference_number', student.fee_reference_number)
                        student.transaction_id = student_info.get('transaction_id', student.transaction_id)
                        student.payment_date = student_info.get('payment_date', student.payment_date)
                        student.discount_criteria = student_info.get('discount_criteria', student.discount_criteria)
                        student.discount_percentage = student_info.get('discount_percentage', student.discount_percentage)
                        student.total_discount = student_info.get('total_discount', student.total_discount)
                        student.application_date = student_info.get('application_date', student.application_date)
                        student.save()
                        updated_count += 1
                    else:
                        created_count += 1
                        
                except Exception as e:
                    errors.append(f"Error saving student {student_info.get('candidate_name')}: {str(e)}")
                    logger.error(f"Error saving student: {str(e)}")
        
        return Response({
            'message': f'Successfully saved {created_count + updated_count} students',
            'created': created_count,
            'updated': updated_count,
            'errors': errors
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in save_uploaded_students: {str(e)}", exc_info=True)
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def create_batches_from_students(request):
    """Create batches and assign students to them"""
    try:
        from core.models import Centre, Course, CourseCategory, Student, Batch
        from django.db import transaction
        
        data = request.data
        created_count = 0
        updated_count = 0
        errors = []
        
        # Get or create default course category
        default_category, _ = CourseCategory.objects.get_or_create(
            category_type='A',
            category_name='Default Category',
            defaults={'course_category_desc': 'Auto-created default category'}
        )
        
        with transaction.atomic():
            for batch_request in data:
                centre_id = batch_request.get('centre_id')
                centre_name = batch_request.get('centre_name')
                course_id = batch_request.get('course_id')
                course_name = batch_request.get('course_name')
                student_ids = batch_request.get('student_ids', [])
                batch_info = batch_request.get('batch_info', {})
                
                # Get or create centre
                centre = None
                if centre_id:
                    try:
                        centre = Centre.objects.get(id=centre_id)
                    except Centre.DoesNotExist:
                        logger.warning(f"Centre with id {centre_id} not found")
                
                if not centre and centre_name:
                    centre, centre_created = Centre.objects.get_or_create(
                        centre_name=centre_name,
                        defaults={
                            'centre_address': 'To be updated',
                            'centre_state': 'Delhi'
                        }
                    )
                    if centre_created:
                        logger.info(f"Created new centre: {centre_name}")
                
                if not centre:
                    errors.append(f"Centre not found: {centre_name or centre_id}")
                    continue
                
                # Get or create course
                course = None
                if course_id:
                    try:
                        course = Course.objects.get(id=course_id)
                    except Course.DoesNotExist:
                        logger.warning(f"Course with id {course_id} not found")
                
                if not course and course_name:
                    course, course_created = Course.objects.get_or_create(
                        course_name=course_name,
                        centre=centre,
                        defaults={
                            'course_category': default_category,
                            'course_status': 'ACTIVE'
                        }
                    )
                    if course_created:
                        logger.info(f"Created new course: {course_name} at {centre.centre_name}")
                
                if not course:
                    errors.append(f"Course not found: {course_name or course_id}")
                    continue
                
                # Determine final batch name
                if batch_info.get('custom_batch_name'):
                    final_batch_name = batch_info['custom_batch_name']
                else:
                    final_batch_name = batch_info.get('batch_name', f"{course_name} - {centre_name}")
                
                # Create a single batch for this course/centre combination
                batch, batch_created = Batch.objects.get_or_create(
                    course=course,
                    centre=centre,
                    batch_name=final_batch_name,
                    defaults={
                        'custom_batch_name': batch_info.get('custom_batch_name', ''),
                        'batch_start_date': batch_info.get('batch_start_date'),
                        'batch_end_date': batch_info.get('batch_end_date'),
                        'faculty_name': batch_info.get('faculty_name', ''),
                        'max_capacity': batch_info.get('max_capacity', 30)
                    }
                )
                
                if batch_created:
                    created_count += 1
                    logger.info(f"Created new batch: {final_batch_name}")
                else:
                    # Update existing batch
                    batch.custom_batch_name = batch_info.get('custom_batch_name', batch.custom_batch_name)
                    batch.batch_start_date = batch_info.get('batch_start_date', batch.batch_start_date)
                    batch.batch_end_date = batch_info.get('batch_end_date', batch.batch_end_date)
                    batch.faculty_name = batch_info.get('faculty_name', batch.faculty_name)
                    batch.max_capacity = batch_info.get('max_capacity', batch.max_capacity)
                    batch.save()
                    updated_count += 1
                    logger.info(f"Updated batch: {final_batch_name}")
                
                # Assign students to this batch
                students_assigned = 0
                for student_id in student_ids:
                    try:
                        student = Student.objects.get(id=student_id)
                        student.batch = batch
                        student.save()
                        students_assigned += 1
                    except Student.DoesNotExist:
                        errors.append(f"Student with id {student_id} not found")
                    except Exception as e:
                        errors.append(f"Error assigning student {student_id}: {str(e)}")
                
                logger.info(f"Assigned {students_assigned} students to batch {final_batch_name}")
        
        return Response({
            'message': f'Successfully processed {created_count + updated_count} batches with {len(data)} groups',
            'batches_created': created_count,
            'batches_updated': updated_count,
            'errors': errors
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in create_batches_from_students: {str(e)}", exc_info=True)
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def get_centres_list(request):
    """Get all centres for dropdown selection"""
    try:
        centres = Centre.objects.all().values('id', 'centre_name')
        return Response({
            "centres": list(centres)
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error in get_centres_list: {str(e)}")
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def get_courses_by_centre(request, centre_id):
    """Get courses for a specific centre"""
    try:
        courses = Course.objects.filter(centre_id=centre_id).values('id', 'course_name')
        return Response({
            "courses": list(courses)
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error in get_courses_by_centre: {str(e)}")
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def get_saved_students(request):
    """Get saved students for batch creation"""
    try:
        students = Student.objects.filter(payment_status='SUCCESS').select_related('course', 'centre')
        
        # Group students by course and centre
        grouped_students = {}
        for student in students:
            if not student.centre or not student.course:
                continue
                
            key = f"{student.centre.id}|{student.course.id}"
            if key not in grouped_students:
                grouped_students[key] = {
                    'centre_name': student.centre.centre_name,
                    'centre_id': str(student.centre.id),
                    'course_name': student.course.course_name,
                    'course_id': str(student.course.id),
                    'students': []
                }
            grouped_students[key]['students'].append({
                'id': str(student.id),
                'application_number': student.application_number or '',
                'registration_id': student.registration_id or '',
                'candidate_name': student.candidate_name,
                'gender': student.gender,
                'category': student.category,
                'mobile_number': student.mobile_number or '',
                'email_id': student.email_id or '',
                'application_fee': float(student.application_fee) if student.application_fee else 0,
                'payment_status': student.payment_status,
                'application_date': student.application_date.strftime('%Y-%m-%d') if student.application_date else None,
            })
        
        return Response({
            "groups": list(grouped_students.values()),
            "total_students": students.count(),
            "total_groups": len(grouped_students)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in get_saved_students: {str(e)}", exc_info=True)
        return Response({
            "groups": [],
            "total_students": 0,
            "total_groups": 0,
            "error": str(e)
        }, status=status.HTTP_200_OK)


@api_view(['GET'])
def get_batches(request):
    """Get all batches"""
    try:
        batches = Batch.objects.select_related('course', 'centre').prefetch_related('students')
        
        batches_list = []
        for batch in batches:
            batches_list.append({
                'id': str(batch.id),
                'batch_name': batch.batch_name or '',
                'custom_batch_name': batch.custom_batch_name or '',
                'course_name': batch.course.course_name,
                'centre_name': batch.centre.centre_name,
                'batch_start_date': batch.batch_start_date.strftime('%Y-%m-%d') if batch.batch_start_date else None,
                'batch_end_date': batch.batch_end_date.strftime('%Y-%m-%d') if batch.batch_end_date else None,
                'faculty_name': batch.faculty_name or '',
                'max_capacity': batch.max_capacity or 0,
                'current_enrollment': batch.students.count(),
                'is_full': batch.is_full
            })
        
        return Response({
            "batches": batches_list,
            "total": len(batches_list)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in get_batches: {str(e)}", exc_info=True)
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def get_batch_detail(request, batch_id):
    """Get detailed information for a specific batch"""
    try:
        batch = Batch.objects.select_related('course', 'centre').prefetch_related('students').get(id=batch_id)
        
        students_list = []
        for student in batch.students.all():
            students_list.append({
                'id': str(student.id),
                'candidate_name': student.candidate_name,
                'application_number': student.application_number,
                'gender': student.gender,
                'category': student.category,
                'mobile_number': student.mobile_number,
                'email_id': student.email_id,
                'payment_status': student.payment_status
            })
        
        return Response({
            'id': str(batch.id),
            'batch_name': batch.batch_name,
            'custom_batch_name': batch.custom_batch_name,
            'course_name': batch.course.course_name,
            'centre_name': batch.centre.centre_name,
            'batch_start_date': batch.batch_start_date,
            'batch_end_date': batch.batch_end_date,
            'faculty_name': batch.faculty_name,
            'max_capacity': batch.max_capacity,
            'current_enrollment': len(students_list),
            'is_full': batch.is_full,
            'students': students_list
        }, status=status.HTTP_200_OK)
        
    except Batch.DoesNotExist:
        return Response(
            {"error": "Batch not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error in get_batch_detail: {str(e)}", exc_info=True)
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )