from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone
from django.conf import settings


class Group(models.Model):
    name = models.CharField(max_length=50, unique=True, db_index=True)
    faculty = models.CharField(max_length=150, default="Axborot texnologiyalari va kompyuter injiniringi")
    course = models.PositiveSmallIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email kiritilishi shart.")
        email = self.normalize_email(email).lower()
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('role', 'admin')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('student', 'Talaba'),
        ('admin', 'Administrator'),
    )

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True, db_index=True)
    group = models.ForeignKey(
        Group,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='students'
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student', db_index=True)
    is_blocked = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        ordering = ['-created_at']

    @property
    def password_hash(self):
        return self.password

    @property
    def full_name(self):
        return f"{self.last_name} {self.first_name}".strip()

    @property
    def group_name(self):
        return self.group.name if self.group else "—"

    def __str__(self):
        return f"{self.full_name} ({self.email})"


class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    rules_accepted = models.BooleanField(default=False)
    rules_accepted_at = models.DateTimeField(null=True, blank=True)
    global_timer_started_at = models.DateTimeField(null=True, blank=True)
    global_time_budget_seconds = models.PositiveIntegerField(
        default=getattr(settings, 'GLOBAL_TIME_BUDGET_SECONDS', 3000)
    )
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def get_elapsed_global_seconds(self) -> int:
        if not self.global_timer_started_at:
            return 0
        end_ref = self.completed_at if (self.is_completed and self.completed_at) else timezone.now()
        elapsed = int((end_ref - self.global_timer_started_at).total_seconds())
        return max(0, min(self.global_time_budget_seconds, elapsed))

    def get_remaining_global_seconds(self) -> int:
        if not self.global_timer_started_at:
            return self.global_time_budget_seconds
        elapsed = int((timezone.now() - self.global_timer_started_at).total_seconds())
        return max(0, self.global_time_budget_seconds - elapsed)

    def is_global_time_expired(self) -> bool:
        if not self.global_timer_started_at:
            return False
        if self.is_completed:
            return False
        return self.get_remaining_global_seconds() <= 0

    def __str__(self):
        return f"Profile: {self.user.email}"


class RuleAcceptance(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='rule_acceptances')
    accepted_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-accepted_at']

    def __str__(self):
        return f"{self.user.email} accepted rules at {self.accepted_at}"
