from django.urls import path
from .views import MacroGoalView

urlpatterns = [
    path("macro-goals/", MacroGoalView.as_view(), name="macro-goals"),
]
