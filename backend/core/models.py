import uuid
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

# ─── 1. CENTRE ───────────────────────────────────────────────────────────────

class Centre(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    centre_name = models.CharField(max_length=100)
    centre_address = models.TextField(null=True, blank=True)
    centre_state = models.CharField(max_length=100, default="Delhi")
    centre_contact = models.CharField(max_length=20, null=True, blank=True)
    centre_email = models.EmailField(null=True, blank=True)
    centre_desc = models.TextField(null=True, blank=True)
    centre_admin = models.OneToOneField('account.User', on_delete=models.SET_NULL,  null=True,  blank=True, 
        related_name='managed_centre',
        limit_choices_to={'role': 'centreadmin'}
    )

    def __str__(self):
        return f"{self.centre_name} - {self.centre_state} - {self.centre_address}"


# ─── 2. COURSE CATEGORY ──────────────────────────────────────────────────────

class CourseCategory(models.Model):
    CATEGORY_TYPE_CHOICES = [
        ('A', 'A - Long Term >500hrs'),
        ('B', 'B - Short Term 91-500hrs'),
        ('C', 'C - Digital Competency ≤90hrs'),
        ('D', 'D - NIELIT DLC Courses'),
        ('E', 'E - NIELIT DLC Exams'),
        ('F', 'F - Summer Training'),
        ('G', 'G - Workshop'),
        ('H', 'H - NSQF'),
        ('I', 'I - Non-NSQF'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category_type = models.CharField(max_length=1, choices=CATEGORY_TYPE_CHOICES)
    category_name = models.CharField(max_length=200) 
    course_category_desc = models.TextField(null = True, blank = True)
    created_datetime = models.DateTimeField(auto_now_add = True, null = True, blank = True)         

    def __str__(self):
        return f"{self.category_type} – {self.category_name}"


# ─── 3. COURSE ───────────────────────────────────────────────────────────────

class Course(models.Model):
    MODE_CHOICES = [
        ("OnCampus", "On Campus"), 
        ("OffCampus", "Off Campus"),
        ("Online", "Online"), 
        ("Offline", "Offline"), 
        ("Hybrid", "Hybrid"),
        ("Suspended", "Suspended"),
    ]
    COURSE_STATUS = [
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
        ('COMPLETED', 'Completed'),
        ('UPCOMING', 'Upcoming'),
        ('CANCELLED', 'Cancelled'),
        ('HOLD', 'Hold'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course_name = models.CharField(max_length=300)  
    course_category = models.ForeignKey(CourseCategory, on_delete=models.CASCADE, related_name="courses")
    centre = models.ForeignKey(Centre, on_delete=models.CASCADE, related_name="courses")
    course_desc = models.TextField(null = True, blank = True)         
    duration_hours = models.IntegerField(null = True, blank = True)                    
    course_mode = models.CharField(max_length=20, choices=MODE_CHOICES, null=True, blank=True)
    course_scheme = models.CharField(max_length=100, null=True, blank=True)
    course_fees = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    #start_date = models.DateField(null=True, blank=True)
    #end_date = models.DateField(null=True, blank=True)
    course_status = models.CharField(choices = COURSE_STATUS, null = True, blank = True)
    created_at = models.DateTimeField(auto_now_add = True, null = True, blank = True)
    updated_at = models.DateTimeField(auto_now = True, null = True, blank = True)


    def __str__(self):
        return f"{self.course_name} – {self.centre.centre_name}"


# ─── 4. STUDENT ──────────────────────────────────────────────────────────────

class Student(models.Model):
    GENDER_CHOICES = [('M', 'Male'), ('F', 'Female')]
    CATEGORY_CHOICES = [('GEN', 'General'), ('SC', 'SC'), ('ST', 'ST'), ('OBC', 'OBC')]
    PAYMENT_STATUS_CHOICES = [('PENDING', 'Pending'), ('SUCCESS', 'Success'), ('FAILED', 'Failed')]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Basic Info 
    application_number = models.CharField(max_length=50, unique=True, null=True, blank=True)
    registration_id = models.CharField(max_length=50, null=True, blank=True)
    candidate_name = models.CharField(max_length=200)
    father_name = models.CharField(max_length=200, null=True, blank=True)
    mother_name = models.CharField(max_length=200, null=True, blank=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    date_of_birth = models.DateField(null=True, blank=True)
    category = models.CharField(max_length=10, choices=CATEGORY_CHOICES, default='GEN')
    is_pwd = models.BooleanField(null=True, blank=True, default=False)
    
    # Identity
    id_card_type = models.CharField(max_length=50, default='Aadhaar Card')
    id_card_number = models.CharField(max_length=100)
    
    # Contact
    address = models.TextField(null=True, blank=True)
    mobile_number = models.CharField(max_length=15, null=True, blank=True)
    email_id = models.EmailField(max_length=200, null=True, blank=True)
    
    # Qualification
    qualification = models.TextField(null=True, blank=True)
    course_applied = models.CharField(max_length=500, null=True, blank=True)  # Store original course name from Excel
    
    # Payment
    application_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='PENDING')
    fee_reference_number = models.CharField(max_length=100, null=True, blank=True)
    transaction_id = models.CharField(max_length=100, null=True, blank=True)
    payment_date = models.DateTimeField(null=True, blank=True)
    
    # Discount
    discount_criteria = models.CharField(max_length=500, null=True, blank=True)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    total_discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Dates
    application_date = models.DateField(null=True, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['candidate_name']),
            models.Index(fields=['application_number']),
            models.Index(fields=['mobile_number']),
            models.Index(fields=['email_id']),
        ]

    def __str__(self):
        return f"{self.candidate_name} ({self.application_number})"


# =====================================================
# SIMPLIFIED ENROLLMENT MODEL (Everything in one place)
# =====================================================

class Enrollment(models.Model):
    EXAM_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PASSED', 'Passed'),
        ('FAILED', 'Failed'),
        ('ABSENT', 'Absent'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Links
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    centre = models.ForeignKey(Centre, on_delete=models.CASCADE, related_name='enrollments')
    
    # Batch Info (simple fields, no separate table)
    batch_name = models.CharField(max_length=200, null=True, blank=True)
    custom_batch_name = models.CharField(max_length=400, null=True, blank=True)
    batch_start_date = models.DateField(null=True, blank=True)
    batch_end_date = models.DateField(null=True, blank=True)
    
    # Status Tracking (Simple boolean flags)
    is_enrolled = models.BooleanField(default=False)
    enrolled_date = models.DateField(null=True, blank=True)
    
    is_trained = models.BooleanField(default=False)
    trained_date = models.DateField(null=True, blank=True)
    
    is_certified = models.BooleanField(default=False)
    certified_date = models.DateField(null=True, blank=True)
    #certificate_number = models.CharField(max_length=100, null=True, blank=True)
    
    is_placed = models.BooleanField(default=False)
    placed_date = models.DateField(null=True, blank=True)
    
    # Exam Details
    exam_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Percentage score 0-100")
    exam_status = models.CharField(max_length=20, choices=EXAM_STATUS_CHOICES, default='PENDING')
    
    # Discount Applied
    final_discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    final_discount_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Attendance
    total_attendance_hours = models.IntegerField(null=True, blank=True) 
    attendance_hours = models.IntegerField(null=True, blank=True) 
    attendance_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student', 'course']  # One enrollment per student per course
        indexes = [
            models.Index(fields=['is_enrolled', 'is_trained', 'is_certified', 'is_placed']),
            models.Index(fields=['batch_name']),
            models.Index(fields=['centre', 'course']),
        ]

    def save(self, *args, **kwargs):
        # Auto-generate batch name if not provided
        if not self.batch_name and self.centre and self.course:
            month_year = timezone.now().strftime('%b %Y')
            self.batch_name = f"{self.centre.centre_name} - {self.course.course_name} - {month_year}"
        
        # Auto-set enrolled date when status changes
        if self.is_enrolled and not self.enrolled_date:
            self.enrolled_date = timezone.now().date()
        
        # Auto-set trained date
        if self.is_trained and not self.trained_date:
            self.trained_date = timezone.now().date()
        
        # Auto-set certified date
        if self.is_certified and not self.certified_date:
            self.certified_date = timezone.now().date()
        
        # Auto-set placed date
        if self.is_placed and not self.placed_date:
            self.placed_date = timezone.now().date()
        
        # Calculate discount based on exam score
        if self.exam_score and self.exam_status == 'PASSED':
            self.final_discount_percentage = self.calculate_discount()
            if self.course.course_fees:
                self.final_discount_amount = (self.course.course_fees * self.final_discount_percentage / 100)
        
        super().save(*args, **kwargs)
    
    def calculate_discount(self):
        """Calculate discount based on exam score and category"""
        score = float(self.exam_score)
        category = self.student.category
        
        # Discount rules (can be moved to database for flexibility)
        if score >= 80:
            return 75
        elif score >= 70:
            return 50
        elif score >= 60:
            return 25
        elif score >= 50:
            return 10
        
        # Category-based special discounts
        if category in ['SC', 'ST'] and score >= 45:
            return 15
        
        return 0
    
    def __str__(self):
        return f"{self.student.candidate_name} - {self.course.course_name} - {self.batch_name}"