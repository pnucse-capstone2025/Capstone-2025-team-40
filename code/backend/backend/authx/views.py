from django.db.models import Q
from django.contrib.auth import logout, get_user_model

from rest_framework.views import APIView
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django_rest_passwordreset.models import ResetPasswordToken



from rest_framework.parsers import MultiPartParser, FormParser, JSONParser


from .utils import get_user_from_token, NoPagination
from .serializers import (
    CustomTokenObtainPairSerializer,
    RegisterSerializer,
    ProfileSerializer,
    ChangePasswordSerializer,
    PasswordResetConfirmSerializer,
    CustomUserSerializer,
    ProfileUpdateSerializer,
)
from .models import CustomUser, Profile


User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = []
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        csrf_token = request.META.get("CSRF_COOKIE")
        response.data["csrf_token"] = csrf_token
        return response


class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()                      # <- create the user
        refresh = RefreshToken.for_user(user)         # <- build tokens

        data = serializer.data.copy()
        data.update({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        })

        headers = self.get_success_headers(serializer.data)
        return Response(data, status=status.HTTP_201_CREATED, headers=headers)


class ProfileView(generics.RetrieveUpdateAPIView):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_object(self):
        profile, _ = Profile.objects.get_or_create(user=self.request.user)
        return profile

    def get_serializer_class(self):
        return ProfileUpdateSerializer if self.request.method in ("PUT", "PATCH") else ProfileSerializer
    
    def get_serializer(self, *args, **kwargs):
        kwargs.setdefault("context", {})["request"] = self.request  #lets ImageField render full URL
        return super().get_serializer(*args, **kwargs)

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        profile_data = response.data
        return Response(
            {
                "success": True,
                "message": "Profile has been updated successfully",
                "result": profile_data,
            }
        )

    def partial_update(self, request, *args, **kwargs):
        response = super().partial_update(request, *args, **kwargs)
        profile_data = response.data
        return Response(
            {
                "success": True,
                "message": "Profile has been updated successfully",
                "result": profile_data,
            }
        )


class LogoutAPIView(APIView):
    def post(self, request):
        logout(request)
        return Response(
            {"success": True, "message": "Logout successful"}, status=status.HTTP_200_OK
        )


class ChangePasswordView(generics.UpdateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = ChangePasswordSerializer

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Your password has been changed."})

    def perform_update(self, serializer):
        serializer.save()


class DeactivateAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        user.is_active = False
        user.save()

        return Response(
            {"message": "Account deactivated successfully."}, status=status.HTTP_200_OK
        )


class PasswordResetConfirmAPIView(APIView):
    permission_classes = [AllowAny]   # <-- override global IsAuthenticated

    def post(self, request, *args, **kwargs):
        token = request.data.get("token")
        password = request.data.get("password")

        if not token or not password:
            return Response({"detail": "token and password are required."},
                            status=status.HTTP_400_BAD_REQUEST)

        # find token
        try:
            token_obj = ResetPasswordToken.objects.get(key=token)
        except ResetPasswordToken.DoesNotExist:
            return Response({"detail": "Invalid or expired token."},
                            status=status.HTTP_400_BAD_REQUEST)

        user = token_obj.user

        # validate password with Django's validators (length, common, numeric, etc.)
        try:
            validate_password(password, user=user)
        except ValidationError as e:
            return Response({"password": e.messages}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(password)
        user.save()

        # invalidate this token (and optionally other tokens for the user)
        token_obj.delete()
        ResetPasswordToken.objects.filter(user=user).delete()

        return Response({"detail": "Password has been reset."}, status=status.HTTP_200_OK)
    
class UserListView(generics.ListAPIView):
    serializer_class = CustomUserSerializer
    pagination_class = NoPagination

    def get_queryset(self):
        queryset = CustomUser.objects.all().order_by("first_name", "last_name")
        query_param = self.request.query_params.get("query")

        if query_param:
            queryset = queryset.filter(
                Q(first_name__icontains=query_param)
                | Q(last_name__icontains=query_param)
            )

        return queryset

class WhoAmIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_authenticated": user.is_authenticated,
})