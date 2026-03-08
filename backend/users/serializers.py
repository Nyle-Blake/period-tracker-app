from datetime import timedelta
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from cycles.models import CycleEntry

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    cycle_length = serializers.IntegerField(required=True, min_value=15, max_value=60)
    period_length = serializers.IntegerField(required=True, min_value=1, max_value=15)
    last_period_start = serializers.DateField(required=True, write_only=True)

    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'password', 'cycle_length', 'period_length', 'last_period_start')

    def create(self, validated_data):
        last_period_start = validated_data.pop('last_period_start')
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password'],
            cycle_length=validated_data['cycle_length'],
            period_length=validated_data['period_length'],
        )
        CycleEntry.objects.create(
            user=user,
            start_date=last_period_start,
            end_date=last_period_start + timedelta(days=validated_data['period_length'] - 1),
        )
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'cycle_length', 'period_length')
        read_only_fields = ('id', 'email')


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data['email'], password=data['password'])

        if not user:
            raise serializers.ValidationError("Invalid credentials")

        refresh = RefreshToken.for_user(user)

        return {
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
            },
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }