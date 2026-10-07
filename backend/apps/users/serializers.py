from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, Group, StudentProfile, RuleAcceptance


class GroupSerializer(serializers.ModelSerializer):
    student_count = serializers.IntegerField(source='students.count', read_only=True)

    class Meta:
        model = Group
        fields = ['id', 'name', 'faculty', 'course', 'student_count', 'created_at']


class StudentProfileSerializer(serializers.ModelSerializer):
    remaining_global_seconds = serializers.SerializerMethodField()
    elapsed_global_seconds = serializers.SerializerMethodField()
    is_global_expired = serializers.SerializerMethodField()

    class Meta:
        model = StudentProfile
        fields = [
            'rules_accepted',
            'rules_accepted_at',
            'global_timer_started_at',
            'global_time_budget_seconds',
            'remaining_global_seconds',
            'elapsed_global_seconds',
            'is_global_expired',
            'is_completed',
            'completed_at',
        ]

    def get_remaining_global_seconds(self, obj):
        return obj.get_remaining_global_seconds()

    def get_elapsed_global_seconds(self, obj):
        return obj.get_elapsed_global_seconds()

    def get_is_global_expired(self, obj):
        return obj.is_global_time_expired()


class UserSerializer(serializers.ModelSerializer):
    group_name = serializers.CharField(read_only=True)
    full_name = serializers.CharField(read_only=True)
    profile = StudentProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'first_name',
            'last_name',
            'full_name',
            'email',
            'group',
            'group_name',
            'role',
            'is_blocked',
            'profile',
            'created_at',
        ]


class RegisterSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=100, required=True)
    last_name = serializers.CharField(max_length=100, required=True)
    group = serializers.CharField(max_length=50, required=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(min_length=6, write_only=True, required=True)

    def validate_first_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Ism bo‘sh bo‘lishi mumkin emas.")
        return value

    def validate_last_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Familiya bo‘sh bo‘lishi mumkin emas.")
        return value

    def validate_group(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Guruh kiritilishi shart.")
        return value

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("Ushbu email orqali avval ro‘yxatdan o‘tilgan.")
        return email

    def validate_password(self, value):
        if len(value) < 6:
            raise serializers.ValidationError("Parol kamida 6 ta belgidan iborat bo‘lishi kerak.")
        return value

    def create(self, validated_data):
        group_name = validated_data.pop('group')
        group_obj, _ = Group.objects.get_or_create(name=group_name)
        password = validated_data.pop('password')
        user = User.objects.create_user(
            email=validated_data['email'],
            password=password,
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            group=group_obj,
            role='student',
        )
        StudentProfile.objects.get_or_create(user=user)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        email = attrs.get('email', '').strip().lower()
        password = attrs.get('password', '')
        user = authenticate(username=email, password=password)
        if not user:
            raise serializers.ValidationError("Email yoki parol noto‘g‘ri.")
        if user.is_blocked:
            raise serializers.ValidationError("Sizning profilingiz administrator tomonidan bloklangan.")
        attrs['user'] = user
        return attrs
