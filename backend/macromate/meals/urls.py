from django.urls import path
from .views import MealSuggestionsView, MealPlanView, RecipeDetailView

urlpatterns = [
    path("suggestions/", MealSuggestionsView.as_view(), name="meal-suggestions"),
    path("plan/", MealPlanView.as_view(), name="meal-plan"),
    path("recipe/<int:recipe_id>/", RecipeDetailView.as_view(), name="recipe-detail"),
]
