from django.urls import path
from .views import (
    MacroGoalView,
    ShoppingListView,
    ShoppingListDetailView,
    FavoriteRecipeView,
    FavoriteRecipeDetailView,
    WeeklyShoppingListView,
)

urlpatterns = [
    # Macro Goals endpoint
    path("macro-goals/", MacroGoalView.as_view(), name="macro-goals"),
    # Shopping List endpoints
    path(
        "shopping-list/", ShoppingListView.as_view(), name="shopping-list"
    ),  # Removed 's'
    path(
        "shopping-list/generate/",
        ShoppingListView.as_view(),
        name="shopping-list-generate",
    ),  # Added generate endpoint
    path(
        "shopping-list/<int:shopping_list_id>/",
        ShoppingListDetailView.as_view(),
        name="shopping-list-detail",
    ),
    path(
        "shopping-list/<int:shopping_list_id>/complete/",
        ShoppingListDetailView.as_view(),
        name="shopping-list-complete",
    ),
    path(
        "shopping-list/weekly/",
        WeeklyShoppingListView.as_view(),
        name="weekly-shopping-list",
    ),
    # Favorite Recipe endpoints
    path("favorites/", FavoriteRecipeView.as_view(), name="favorite-recipes"),
    path(
        "favorites/<int:favorite_id>/",
        FavoriteRecipeDetailView.as_view(),
        name="favorite-recipe-detail",
    ),
]
