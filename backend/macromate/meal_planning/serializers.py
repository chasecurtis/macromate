from rest_framework import serializers
from .models import MacroGoal, ShoppingList


class MacroGoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = MacroGoal
        fields = ["id", "calories", "carbohydrates", "proteins", "fats", "account"]
        read_only_fields = ["id", "account"]


class ShoppingListSerializer(serializers.ModelSerializer):
    items = serializers.JSONField(source="items_data", read_only=True)
    aisles = serializers.JSONField(source="aisles_data", read_only=True)
    meal_breakdown = serializers.JSONField(source="meal_breakdown_data", read_only=True)
    meal_type_summary = serializers.JSONField(
        source="meal_type_summary_data", read_only=True
    )

    class Meta:
        model = ShoppingList
        fields = [
            "id",
            "start_date",
            "end_date",
            "items",
            "aisles",
            "total_estimated_cost",
            "total_items",
            "is_completed",
            "completed_at",
            "created_at",
            "updated_at",
            "meal_breakdown",
            "meal_type_summary",
        ]
        read_only_fields = [
            "id",
            "total_estimated_cost",
            "total_items",
            "completed_at",
            "created_at",
            "updated_at",
        ]

    def get_meal_breakdown(self, obj):
        return getattr(obj, "_meal_breakdown", {})

    def get_meal_type_summary(self, obj):
        return getattr(obj, "_meal_type_summary", {})
