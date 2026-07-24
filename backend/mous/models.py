from django.db import models
from django.conf import settings
from folders.models import Folder
from files.models import File
from datetime import timedelta, date

class MOUTemplate(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True, null=True)
    template_notes = models.TextField(blank=True, null=True, help_text="Explanation for non-technical users on why this template exists and field meanings")
    fields_schema = models.JSONField(default=list, help_text="List of custom field definitions: [{name, label, type, required}]")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class MOU(models.Model):
    STATUS_CHOICES = [
        ('Draft', 'Draft'),
        ('Shared', 'Shared'),
        ('Signed', 'Signed'),
        ('Pending Verification', 'Pending Verification'),
        ('Active', 'Active'),
        ('Expired', 'Expired'),
        ('Renewed', 'Renewed'),
    ]

    title = models.CharField(max_length=255)
    mou_number = models.CharField(max_length=100, unique=True)
    mou_type = models.ForeignKey(MOUTemplate, on_delete=models.SET_NULL, null=True, blank=True, related_name='mous')
    partner_organization = models.CharField(max_length=255)
    department = models.ForeignKey(Folder, on_delete=models.SET_NULL, null=True, blank=True, related_name='mous')
    department_name = models.CharField(max_length=255, blank=True, null=True)

    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_mous')
    original_mou = models.ForeignKey(File, on_delete=models.SET_NULL, null=True, blank=True, related_name='original_mous')
    signed_mou = models.ForeignKey(File, on_delete=models.SET_NULL, null=True, blank=True, related_name='signed_mous')

    effective_date = models.DateField(null=True, blank=True)
    signed_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    duration_months = models.IntegerField(default=12, help_text="Duration in months")

    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Draft')

    summary = models.TextField(blank=True, null=True)
    purpose = models.TextField(blank=True, null=True)
    objectives = models.TextField(blank=True, null=True)
    beneficiaries = models.JSONField(default=list, blank=True, null=True) # ['Students', 'Faculty', 'Researchers']
    opportunities = models.JSONField(default=list, blank=True, null=True) # ['Internship', 'Placement', 'Research']
    custom_fields_data = models.JSONField(default=dict, blank=True, null=True)

    # Coordinators
    coordinator_name = models.CharField(max_length=255, blank=True, null=True)
    coordinator_designation = models.CharField(max_length=255, blank=True, null=True)
    coordinator_email = models.EmailField(blank=True, null=True)
    coordinator_phone = models.CharField(max_length=50, blank=True, null=True)

    partner_name = models.CharField(max_length=255, blank=True, null=True)
    partner_designation = models.CharField(max_length=255, blank=True, null=True)
    partner_email = models.EmailField(blank=True, null=True)
    partner_phone = models.CharField(max_length=50, blank=True, null=True)

    additional_notes = models.TextField(blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)

    version_number = models.IntegerField(default=1)
    is_renewed = models.BooleanField(default=False)
    renewed_from = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='renewals')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def calculate_expiry(self, signed_dt=None, duration=None):
        sd = signed_dt or self.signed_date or date.today()
        dur = duration or self.duration_months or 12
        # Approx calculation: signed_date + dur * 30 days or month arithmetic
        month = sd.month - 1 + dur
        year = sd.year + month // 12
        month = month % 12 + 1
        day = min(sd.day, 28) # handle leap/month end safely
        return date(year, month, day)

    def days_remaining(self):
        if not self.expiry_date:
            return None
        today = date.today()
        return (self.expiry_date - today).days

    def __str__(self):
        return f"{self.mou_number} - {self.title} ({self.status})"

class MOUDocument(models.Model):
    DOC_TYPES = [
        ('original', 'Original MOU'),
        ('signed', 'Signed MOU'),
        ('summary', 'Summary Document'),
        ('supporting', 'Supporting Document'),
    ]
    mou = models.ForeignKey(MOU, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=50, choices=DOC_TYPES)
    file = models.ForeignKey(File, on_delete=models.CASCADE, related_name='mou_documents')
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

class MOURenewal(models.Model):
    original_mou = models.ForeignKey(MOU, on_delete=models.CASCADE, related_name='renewal_history')
    renewed_mou = models.ForeignKey(MOU, on_delete=models.CASCADE, related_name='renewed_instance')
    renewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    renewed_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)
