
import pandas as pd
from datetime import datetime
from collections import defaultdict
from django.db import transaction
from core.models import Centre, Course, Student, Enrollment
from django.utils import timezone
import uuid

class MISReportService:
    """Service class for MIS report processing"""
    
    @staticmethod
    def parse_uploaded_file(file):
        """Parse uploaded CSV or Excel file"""
        if file.name.endswith('.csv'):
            df = pd.read_csv(file, encoding='utf-8', dtype=str)
        elif file.name.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(file, dtype=str)
        else:
            raise ValueError("Unsupported file format")
        
        df.columns = df.columns.str.strip()
        return df
    
    @staticmethod
    def validate_columns(df):
        """Validate required columns"""
        required_cols = [
            "Course Location", "Course Applied", "Category", 
            "Payment Status", "Gender", "Application Date"
        ]
        
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            raise ValueError(f"Missing columns: {', '.join(missing_cols)}")
        return True
    
    @staticmethod
    def extract_month_year(date_str):
        """Extract month-year from date string"""
        if pd.isna(date_str):
            return datetime.now().strftime("%Y-%m")
        
        date_str = str(date_str).strip()
        
        # Try DD/MM/YYYY format
        try:
            parts = date_str.split('/')
            if len(parts) == 3:
                day, month, year = parts
                if len(year) == 2:
                    year = '20' + year
                if day.isdigit() and month.isdigit() and year.isdigit():
                    month_num = int(month)
                    if 1 <= month_num <= 12:
                        return f"{int(year)}-{month_num:02d}"
        except:
            pass
        
        # Try MM/DD/YYYY format
        try:
            parts = date_str.split('/')
            if len(parts) == 3:
                month, day, year = parts
                if len(year) == 2:
                    year = '20' + year
                if month.isdigit() and day.isdigit() and year.isdigit():
                    month_num = int(month)
                    if 1 <= month_num <= 12:
                        return f"{int(year)}-{month_num:02d}"
        except:
            pass
        
        return datetime.now().strftime("%Y-%m")
    
    @staticmethod
    def normalize_data(df):
        """Normalize and clean data"""
        # Normalize categorical fields
        df["Category"] = df["Category"].str.upper().str.strip()
        df["Payment Status"] = df["Payment Status"].str.upper().str.strip()
        df["Gender"] = df["Gender"].str.upper().str.strip()
        df["Course Applied"] = df["Course Applied"].str.strip()
        df["Course Location"] = df["Course Location"].str.strip()
        
        # Apply category defaults
        valid_categories = ['GEN', 'SC', 'ST', 'OBC']
        df["Category"] = df["Category"].apply(
            lambda x: x if x in valid_categories else 'GEN'
        )
        
        # Apply gender defaults
        valid_genders = ['M', 'F']
        df["Gender"] = df["Gender"].apply(
            lambda x: x if x in valid_genders else 'M'
        )
        
        # Extract month-year
        df["Month-Year"] = df["Application Date"].apply(
            MISReportService.extract_month_year
        )
        
        # Filter only SUCCESS payments
        df_success = df[df["Payment Status"] == "SUCCESS"].copy()
        
        return df_success
    
    @staticmethod
    def get_centres_info(df):
        """Extract centres information"""
        centres = df["Course Location"].unique().tolist()
        return {
            "total_centres": len(centres),
            "centres_list": centres
        }
    
    @staticmethod
    def get_courses_info(df):
        """Extract courses information grouped by centre"""
        courses_by_centre = {}
        for centre in df["Course Location"].unique():
            centre_courses = df[df["Course Location"] == centre]["Course Applied"].unique().tolist()
            courses_by_centre[centre] = centre_courses
        
        return {
            "total_courses": df["Course Applied"].nunique(),
            "courses_by_centre": courses_by_centre
        }
    
    @staticmethod
    def get_date_range_info(df):
        """Get month-year range from application dates"""
        months = sorted(df["Month-Year"].unique())
        months_display = [datetime.strptime(m, "%Y-%m").strftime("%b %Y") for m in months]
        return {
            "months_range": months_display,
            "months_raw": months
        }
    
    @staticmethod
    def get_student_counts(df):
        """Get gender and category wise student counts"""
        gender_counts = df["Gender"].value_counts().to_dict()
        category_counts = df["Category"].value_counts().to_dict()
        
        return {
            "total_students": len(df),
            "gender_breakdown": gender_counts,
            "category_breakdown": category_counts
        }
    
    @staticmethod
    def get_centre_course_counts(df):
        """Get centre-wise course counts"""
        centre_course_counts = []
        for centre in df["Course Location"].unique():
            centre_df = df[df["Course Location"] == centre]
            course_counts = centre_df["Course Applied"].value_counts().to_dict()
            centre_course_counts.append({
                "centre_name": centre,
                "courses": course_counts,
                "total": len(centre_df)
            })
        return centre_course_counts
    
    @staticmethod
    def get_students_detail_data(df):
        """Get detailed student data for display"""
        students_data = []
        for _, row in df.iterrows():
            students_data.append({
                "month_year": MISReportService.extract_month_year(row["Application Date"]),
                "application_number": row.get("Application Number", ""),
                "registration_id": row.get("Registration ID", ""),
                "candidate_name": row.get("Candidate Name", row.get("Student Name", "")),
                "gender": row["Gender"],
                "category": row["Category"],
                "mobile_number": row.get("Mobile Number", row.get("Mobile", "")),
                "email_id": row.get("Email", row.get("Email ID", "")),
                "application_fee": row.get("Application Fee", row.get("Fees", 0)),
                "application_date": row["Application Date"],
                "course_applied": row["Course Applied"],
                "course_location": row["Course Location"]
            })
        return students_data
    
    @staticmethod
    @transaction.atomic
    def save_students_to_db(students_data):
        """Save students to database (only SUCCESS payments)"""
        created_count = 0
        updated_count = 0
        errors = []
        
        for student_info in students_data:
            try:
                # Parse application date
                app_date = None
                if student_info.get("application_date"):
                    try:
                        # Try to parse date
                        date_str = str(student_info["application_date"])
                        parts = date_str.split('/')
                        if len(parts) == 3:
                            app_date = datetime.strptime(f"{parts[2]}-{parts[1]}-{parts[0]}", "%Y-%m-%d").date()
                    except:
                        app_date = timezone.now().date()
                
                # Create or update student
                student, created = Student.objects.update_or_create(
                    application_number=student_info.get("application_number", str(uuid.uuid4())[:8]),
                    defaults={
                        "registration_id": student_info.get("registration_id"),
                        "candidate_name": student_info.get("candidate_name", "Unknown"),
                        "gender": student_info.get("gender", "M"),
                        "category": student_info.get("category", "GEN"),
                        "mobile_number": student_info.get("mobile_number"),
                        "email_id": student_info.get("email_id"),
                        "application_fee": student_info.get("application_fee", 0),
                        "application_date": app_date,
                        "course_applied": student_info.get("course_applied"),
                        "payment_status": "SUCCESS",
                        "id_card_number": "PENDING",  # Placeholder
                        "id_card_type": "Aadhaar Card"
                    }
                )
                
                if created:
                    created_count += 1
                else:
                    updated_count += 1
                    
            except Exception as e:
                errors.append(f"Error saving student {student_info.get('candidate_name')}: {str(e)}")
        
        return {
            "created": created_count,
            "updated": updated_count,
            "errors": errors
        }


class BatchCreationService:
    """Service for batch creation from selected students"""
    
    @staticmethod
    def get_or_create_course(course_name, centre_name):
        """Get or create course for a centre"""
        centre, _ = Centre.objects.get_or_create(
            centre_name=centre_name,
            defaults={
                'centre_address': 'To be updated',
                'centre_state': 'Delhi'
            }
        )
        
        course, created = Course.objects.get_or_create(
            course_name=course_name,
            centre=centre,
            defaults={
                'course_status': 'ACTIVE',
            }
        )
        
        return course, centre
    
    @staticmethod
    def create_batches(selected_data, request_user):
        """Create batches from selected students"""
        from core.models import CourseCategory
        
        # Get or create default category
        default_category, _ = CourseCategory.objects.get_or_create(
            category_type='A',
            category_name='Default Category'
        )
        
        batches_created = []
        
        with transaction.atomic():
            for batch_request in selected_data:
                centre = Centre.objects.get(id=batch_request['centre_id'])
                course = Course.objects.get(id=batch_request['course_id'])
                student_ids = batch_request['student_ids']
                batch_info = batch_request['batch_info']
                
                # Generate batch name if not provided
                if not batch_info.get('batch_name'):
                    month_year = timezone.now().strftime('%b %Y')
                    batch_name = f"{centre.centre_name} - {course.course_name} - {month_year}"
                else:
                    batch_name = batch_info['batch_name']
                
                # Create enrollments for each student
                enrollments = []
                for student_id in student_ids:
                    student = Student.objects.get(id=student_id)
                    
                    enrollment, created = Enrollment.objects.update_or_create(
                        student=student,
                        course=course,
                        centre=centre,
                        defaults={
                            'batch_name': batch_name,
                            'custom_batch_name': batch_info.get('custom_batch_name', ''),
                            'batch_start_date': batch_info['batch_start_date'],
                            'batch_end_date': batch_info['batch_end_date'],
                            'is_enrolled': True,
                            'enrolled_date': timezone.now().date(),
                            'created_by': request_user if request_user.is_authenticated else None
                        }
                    )
                    enrollments.append(enrollment)
                
                batches_created.append({
                    'batch_name': batch_name,
                    'centre_name': centre.centre_name,
                    'course_name': course.course_name,
                    'total_students': len(enrollments),
                    'start_date': batch_info['batch_start_date'],
                    'end_date': batch_info['batch_end_date']
                })
        
        return batches_created
    
    @staticmethod
    def get_batch_statistics(centre_id, course_id, student_ids):
        """Get statistics for students before batch creation"""
        students = Student.objects.filter(id__in=student_ids)
        
        stats = {
            'total_students': students.count(),
            'gender_breakdown': students.values('gender').annotate(count=models.Count('id')),
            'category_breakdown': students.values('category').annotate(count=models.Count('id')),
        }
        
        return stats