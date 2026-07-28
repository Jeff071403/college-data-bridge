from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from roles.models import Role
import uuid

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('status', 'Active')
        
        # Get or create Super Admin role
        super_admin_role, _ = Role.objects.get_or_create(
            name="Super Admin",
            defaults={"description": "Super Administrator with full system control"}
        )
        extra_fields.setdefault('role', super_admin_role)

        return self.create_user(email, password, **extra_fields)

class CustomUser(AbstractBaseUser, PermissionsMixin):
    STATUS_CHOICES = (
        ('Active', 'Active'),
        ('Disabled', 'Disabled'),
    )

    email = models.EmailField(unique=True)
    name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20, blank=True, null=True)
    designation = models.CharField(max_length=100, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    stream = models.CharField(max_length=100, blank=True, null=True)
    
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, related_name='users')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True) # Used by Django auth middleware

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    def __str__(self):
        return self.email

    @property
    def is_disabled(self):
        return self.status == 'Disabled'

class UserPermission(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='user_permissions_override')
    permission = models.ForeignKey('permissions.Permission', on_delete=models.CASCADE, related_name='user_permissions')
    is_granted = models.BooleanField(default=True) # True = Granted override, False = Revoked override

    class Meta:
        unique_together = ('user', 'permission')

    def __str__(self):
        status = "Granted" if self.is_granted else "Revoked"
        return f"{self.user.email} - {self.permission.codename} ({status})"

class UserInvitation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField()
    stream = models.CharField(max_length=100)
    department = models.CharField(max_length=100)
    system_role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='invitations')
    token = models.CharField(max_length=255, unique=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    is_cancelled = models.BooleanField(default=False)
    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, related_name='created_invitations')
    created_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Invitation for {self.email} ({self.system_role.name})"
