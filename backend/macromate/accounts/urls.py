from django.urls import path
from .views import (
    SignupView,
    LoginView,
    LogoutView,
    InfoView,
    MasterSignupView,
)

urlpatterns = [
    path("signup/", SignupView.as_view(), name="signup"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("info/", InfoView.as_view(), name="info"),
    path("master/", MasterSignupView.as_view(), name="master"),
]
