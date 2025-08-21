from rest_framework import serializers
from .models import Recipe, MealPlan


class RecipeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recipe
        fields = [
            "id",
            "spoonacular_id",
            "title",
            "image",
            "ready_in_minutes",
            "servings",
            "calories",
            "proteins",
            "fats",
            "carbohydrates",
            "summary",
            "instructions",
            "ingredients",
            "meal_type",
        ]


class MealPlanSerializer(serializers.ModelSerializer):
    breakfast = RecipeSerializer(read_only=True)
    lunch = RecipeSerializer(read_only=True)
    dinner = RecipeSerializer(read_only=True)

    class Meta:
        model = MealPlan
        fields = [
            "id",
            "date",
            "breakfast",
            "lunch",
            "dinner",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
