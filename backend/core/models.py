import uuid
from django.db import models
from django.contrib.auth.models import User


# ─── 1. CENTRE ───────────────────────────────────────────────────────────────

class Centre(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    centre_name = models.CharField(max_length=100)
    centre_address = models.TextField(null=True, blank=True)
    centre_state = models.CharField(max_length=100, default="Delhi")
    centre_contact = models.CharField(max_length=20, null=True, blank=True)
    centre_email = models.EmailField(null=True, blank=True)

    def __str__(self):
        return self.centre_name


# ─── 2. COURSE CATEGORY ──────────────────────────────────────────────────────

class CourseCategory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category_type = models.CharField(max_length=5)            
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
    course_category = models.ForeignKey(CourseCategory, on_delete=models.CASCADE, related_name="courses")
    centre = models.ForeignKey(Centre, on_delete=models.CASCADE, related_name="courses")
    course_name = models.CharField(max_length=300)  
    course_desc = models.TextField(null = True, blank = True)         
    duration_hours = models.IntegerField()                    
    mode = models.CharField(max_length=20, choices=MODE_CHOICES, null=True, blank=True)
    scheme = models.CharField(max_length=100, null=True, blank=True)  # Future Skills, Corporate…
    fee_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    #start_date = models.DateField(null=True, blank=True)
    #end_date = models.DateField(null=True, blank=True)
    course_status = models.CharField(choices = COURSE_STATUS, null = True, blank = True)
    created_at = models.DateTimeField(auto_now_add = True, null = True, blank = True)
    updated_at = models.DateTimeField(auto_now = True, null = True, blank = True)


    def __str__(self):
        return f"{self.course_name} – {self.centre.centre_name}"


# ─── 4. STUDENT ──────────────────────────────────────────────────────────────

class Student(models.Model):
    GENDER_CHOICES = [("M", "Male"), ("F", "Female"), ("O", "Other")]
    CATEGORY_CHOICES = [ ("GEN", "GEN"), ("SC", "SC"), ("ST", "ST"), ("OBC", "OBC"), ("EWS", "EWS") ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application_number = models.CharField(max_length=50, unique=True)  # from Excel
    registration_id = models.CharField(max_length=50, null=True, blank=True)
    full_name = models.CharField(max_length=200)
    father_name = models.CharField(max_length=200, null=True, blank=True)
    mother_name = models.CharField(max_length=200, null=True, blank=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    category = models.CharField(max_length=10, choices=CATEGORY_CHOICES, null=True, blank=True)
    is_pwd = models.BooleanField(default=False)
    id_card_type = models.CharField(max_length=30, null=True, blank=True)
    id_card_number = models.CharField(max_length=50, null=True, blank=True)
    mobile_number = models.CharField(max_length=15, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    qualification = models.CharField(max_length=200, null=True, blank=True)

    def __str__(self):
        return f"{self.full_name} ({self.application_number})"


# ─── 5. ENROLLMENT (core of everything) ──────────────────────────────────────

class Enrollment(models.Model):
    STATUS_CHOICES = [
        ("ENROLLED", "Enrolled"),
        ("TRAINED", "Trained"),
        ("CERTIFIED", "Certified"),
        ("FAILED", "Failed"),
        ("PLACED", "Placed"),
        ("DROPPED", "Dropped"),
    ]
    PAYMENT_STATUS_CHOICES = [ ("PENDING", "Pending"), ("SUCCESS", "Success"), ("FAILED", "Failed"), ("REFUNDED", "Refunded")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="enrollments")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="enrollments")

    # Lifecycle status — admin updates this
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="ENROLLED")
    application_date = models.DateField(null=True, blank=True)

    # Payment info (from Excel)
    fee_paid = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    payment_status = models.CharField(max_length=10, choices=PAYMENT_STATUS_CHOICES, default="PENDING")
    fee_reference_number = models.CharField(max_length=100, null=True, blank=True)
    transaction_id = models.CharField(max_length=100, null=True, blank=True)
    payment_datetime = models.DateTimeField(null=True, blank=True)

    # Exam results — admin fills after exam
    marks_obtained = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    total_marks = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    is_passed = models.BooleanField(null=True, blank=True)

    # Discount (admin sets or auto-computed)
    discount_criteria = models.CharField(max_length=200, null=True, blank=True)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    total_discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Placement
    placed_date = models.DateField(null=True, blank=True)
    placed_company = models.CharField(max_length=200, null=True, blank=True)

    # Audit
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [("student", "course")]   # one enrollment per student per course

    def save(self, *args, **kwargs):
        # Auto-compute percentage when marks are present
        if self.marks_obtained and self.total_marks:
            self.percentage = round((self.marks_obtained / self.total_marks) * 100, 2)
        # Auto-compute total_discount from fee and discount_percentage
        fee = self.course.fee_amount or self.fee_paid
        if fee and self.discount_percentage:
            self.total_discount = round(fee * self.discount_percentage / 100, 2)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student.full_name} – {self.course.course_name} [{self.status}]"


# ─── MIS QUERY (use in your API view) ────────────────────────────────────────
#
# from django.db.models import Count, Q
#
# Enrollment.objects.filter(
#     course__centre__id__in=centre_ids,          # filter by centre(s)
#     application_date__year=2026,                # filter by year
#     application_date__month=3,                  # filter by month (optional)
# ).values(
#     "course__centre__centre_name",
#     "course__course_category__category_type",
#     "course__course_name",
#     "course__duration_hours",
#     "course__scheme",
#     "course__mode",
# ).annotate(
#     total_enrolled  = Count("id", filter=Q(status__in=["ENROLLED","TRAINED","CERTIFIED","PLACED"])),
#     total_trained   = Count("id", filter=Q(status__in=["TRAINED","CERTIFIED","PLACED"])),
#     total_certified = Count("id", filter=Q(status="CERTIFIED")),
#     total_placed    = Count("id", filter=Q(status="PLACED")),
#     male_enrolled   = Count("id", filter=Q(student__gender="M")),
#     female_enrolled = Count("id", filter=Q(student__gender="F")),
#     sc_enrolled     = Count("id", filter=Q(student__category="SC")),
#     st_enrolled     = Count("id", filter=Q(student__category="ST")),
#     obc_enrolled    = Count("id", filter=Q(student__category="OBC")),
#     pwd_enrolled    = Count("id", filter=Q(student__is_pwd=True)),
#     # ... repeat trained/certified/placed per gender+category
# )