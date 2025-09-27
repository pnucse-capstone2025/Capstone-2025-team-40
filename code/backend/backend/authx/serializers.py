from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import CustomUser, Profile


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        token["username"] = user.username
        token["email"] = user.email

        return token


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    password_confirm = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(
        required=True, validators=[UniqueValidator(queryset=CustomUser.objects.all())]
    )

    class Meta:
        model = CustomUser
        fields = ("username", "email", "password", "password_confirm")

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password": "Passwords don't match."})

        return attrs

    def create(self, validated_data):
        user = CustomUser.objects.create(
            username=validated_data["username"],
            email=validated_data["email"],
        )

        user.set_password(validated_data["password"])
        user.save()

        return user


class ChangePasswordSerializer(serializers.ModelSerializer):
    old_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    new_password_confirm = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = CustomUser
        fields = ["old_password", "new_password", "new_password_confirm"]

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError(
                {"new_password": "Passwords do not match."}
            )
        return attrs

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError(
                {"old_password": "Old password is not correct."}
            )
        return value

    def update(self, instance, validated_data):
        instance.set_password(validated_data["new_password"])
        instance.save()
        return instance

    def save(self, **kwargs):
        user = self.context["request"].user
        new_password = self.validated_data["new_password"]
        user.set_password(new_password)
        user.save()
        return user


class PasswordResetConfirmSerializer(serializers.Serializer):
    new_password = serializers.CharField()
    confirm_new_password = serializers.CharField()
    token = serializers.CharField()

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_new_password"]:
            raise serializers.ValidationError(
                "The new password and the confirmed password do not match."
            )
        try:
            validate_password(attrs["new_password"])
        except ValidationError as e:
            raise serializers.ValidationError(str(e))

        return attrs


class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["id", "username", "first_name", "last_name"]


class ProfileSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer(read_only=True)
    photo = serializers.ImageField(required=False, allow_null=True)


    class Meta:
        model = Profile
        fields = ("bio", "photo", "birthdate", "user")
        read_only_fields = ("user",)


class ProfileUpdateSerializer(serializers.ModelSerializer):
    bio = serializers.CharField(required=False, allow_blank=True)
    photo = serializers.ImageField(required=False, allow_null=True, use_url=True)
    birthdate = serializers.DateField(required=False, allow_null=True)

    first_name = serializers.CharField(
        source="user.first_name", required=False, allow_blank=True
    )
    last_name = serializers.CharField(
        source="user.last_name", required=False, allow_blank=True
    )

    # flag only in serializer to request deletion of existing photo
    remove_photo = serializers.BooleanField(write_only=True, required=False)

    class Meta:
        model = Profile
        fields = ("bio", "photo", "birthdate", "first_name", "last_name", "remove_photo")

    def update(self, instance, validated_data):
        # nested user fields
        user_data = validated_data.pop("user", {})

        # delete photo first if requested
        if validated_data.get("remove_photo"):
            instance.photo.delete(save=False)
            instance.photo = None

        # apply profile fields when present (bio/photo/birthdate)
        for k in ("bio", "photo", "birthdate"):
            if k in validated_data:
                setattr(instance, k, validated_data[k])
        instance.save()

        # apply user fields (allow blank strings)
        if user_data:
            for attr, value in user_data.items():
                setattr(instance.user, attr, value)
            instance.user.save()

        return instance

