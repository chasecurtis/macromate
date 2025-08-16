from rest_framework import serializers
from .models import MacroGoal


class MacroGoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = MacroGoal
        fields = ["id", "calories", "carbohydrates", "proteins", "fats", "account"]
        read_only_fields = ["id", "account"]
