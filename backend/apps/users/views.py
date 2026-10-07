from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone

from .models import User, Group, StudentProfile, RuleAcceptance
from .serializers import (
    UserSerializer,
    GroupSerializer,
    RegisterSerializer,
    LoginSerializer,
)
from .permissions import IsActiveUnblockedUser


def get_tokens_for_user(user: User) -> dict:
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            tokens = get_tokens_for_user(user)
            return Response(
                {
                    'message': "Muvaffaqiyatli ro‘yxatdan o‘tdingiz!",
                    'user': UserSerializer(user).data,
                    'tokens': tokens,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            StudentProfile.objects.get_or_create(user=user)
            tokens = get_tokens_for_user(user)
            return Response(
                {
                    'message': "Tizimga muvaffaqiyatli kirdingiz!",
                    'user': UserSerializer(user).data,
                    'tokens': tokens,
                },
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CurrentUserView(APIView):
    permission_classes = [IsActiveUnblockedUser]

    def get(self, request):
        StudentProfile.objects.get_or_create(user=request.user)
        return Response(UserSerializer(request.user).data)


class AcceptRulesView(APIView):
    permission_classes = [IsActiveUnblockedUser]

    def post(self, request):
        accepted = request.data.get('accepted', False)
        if not accepted:
            return Response(
                {'detail': "Davom etish uchun qoidalarga rozilik bildirishingiz shart."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        profile, _ = StudentProfile.objects.get_or_create(user=request.user)
        if not profile.rules_accepted:
            profile.rules_accepted = True
            profile.rules_accepted_at = timezone.now()
            profile.save(update_fields=['rules_accepted', 'rules_accepted_at'])

        ip_addr = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', ''))
        if ',' in ip_addr:
            ip_addr = ip_addr.split(',')[0].strip()

        RuleAcceptance.objects.create(
            user=request.user,
            ip_address=ip_addr or None,
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
        )

        return Response(
            {
                'message': "Qoidalar muvaffaqiyatli qabul qilindi.",
                'user': UserSerializer(request.user).data,
            },
            status=status.HTTP_200_OK,
        )


class PublicGroupsListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    queryset = Group.objects.all().order_by('name')
    serializer_class = GroupSerializer
