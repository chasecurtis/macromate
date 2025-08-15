from django.shortcuts import render
from django.contrib.auth import authenticate
from .models import Account
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status as s
from rest_framework.authtoken.models import Token
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny


# Create your views here.
class AuthenticatedAPIView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]


class SignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        request.data["username"] = request.data["email"]
        account = Account.objects.create_user(**request.data)
        token = Token.objects.create(user=account)
        return Response(
            {"account": account.email, "token": token.key}, status=s.HTTP_201_CREATED
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")
        account = authenticate(username=email, password=password)
        if account:
            token, created = Token.objects.get_or_create(user=account)
            return Response({"token": token.key, "account": account.email})
        else:
            return Response(
                "No account matching credentials", status=s.HTTP_404_NOT_FOUND
            )


class InfoView(AuthenticatedAPIView):
    def get(self, request):
        return Response(
            {
                "email": request.user.email,
                "first_name": request.user.first_name,
                "last_name": request.user.last_name,
            }
        )


class LogoutView(AuthenticatedAPIView):
    def post(self, request):
        request.user.auth_token.delete()
        return Response("Account successfully logged out", status=s.HTTP_204_NO_CONTENT)


class MasterSignupView(APIView):
    def post(self, request):
        master_account = Account.objects.create_user(**request.data)
        master_account.is_staff = True
        master_account.is_superuser = True
        master_account.save()
        token = Token.objects.create(user=master_account)
        return Response(
            {"master_account": master_account.email, "token": token.key},
            status=s.HTTP_201_CREATED,
        )


class CorsTestView(APIView):
    """
    Test view to verify CORS is working properly
    """

    permission_classes = [AllowAny]

    def get(self, request):
        """Simple GET request to test CORS"""
        return Response(
            {
                "message": "CORS is working! GET request successful",
                "timestamp": str(request.META.get("HTTP_DATE", "No date header")),
                "origin": str(request.META.get("HTTP_ORIGIN", "No origin header")),
                "user_agent": str(request.META.get("HTTP_USER_AGENT", "No user agent")),
                "method": request.method,
                "status": "success",
            }
        )

    def post(self, request):
        """POST request to test CORS with data"""
        try:
            data = (
                request.data
                if hasattr(request, "data")
                else json.loads(request.body) if request.body else {}
            )
        except json.JSONDecodeError:
            data = {"error": "Invalid JSON in request body"}

        return Response(
            {
                "message": "CORS is working! POST request successful",
                "received_data": data,
                "origin": str(request.META.get("HTTP_ORIGIN", "No origin header")),
                "content_type": str(
                    request.META.get("CONTENT_TYPE", "No content type")
                ),
                "method": request.method,
                "status": "success",
            }
        )

    def options(self, request):
        """Handle preflight OPTIONS request"""
        return Response(
            {
                "message": "CORS preflight successful",
                "method": request.method,
                "status": "success",
            }
        )


class CorsAuthTestView(AuthenticatedAPIView):
    """
    Test view to verify CORS works with authentication
    """

    def get(self, request):
        """Test authenticated GET request with CORS"""
        return Response(
            {
                "message": "CORS with authentication is working!",
                "user": request.user.email,
                "is_authenticated": request.user.is_authenticated,
                "origin": str(request.META.get("HTTP_ORIGIN", "No origin header")),
                "method": request.method,
                "status": "success",
            }
        )

    def post(self, request):
        """Test authenticated POST request with CORS"""
        return Response(
            {
                "message": "CORS with authentication POST is working!",
                "user": request.user.email,
                "received_data": request.data,
                "origin": str(request.META.get("HTTP_ORIGIN", "No origin header")),
                "method": request.method,
                "status": "success",
            }
        )
