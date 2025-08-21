from django.db import models
from accounts.models import Account


# Create your models here.
class MacroGoal(models.Model):
    calories = models.PositiveIntegerField()
    carbohydrates = models.PositiveIntegerField()
    proteins = models.PositiveIntegerField()
    fats = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    account = models.ForeignKey(
        Account, related_name="macrogoals", on_delete=models.CASCADE
    )

    def __str__(self):
        return (
            f"{self.account.email} - C:{self.calories} P:{self.proteins} F:{self.fats}"
        )


class ShoppingList(models.Model):
    """Generated shopping list for a user's meal plans"""

    account = models.ForeignKey(
        Account, on_delete=models.CASCADE, related_name="shopping_lists"
    )
    start_date = models.DateField()
    end_date = models.DateField()

    # Shopping list data
    items_data = models.JSONField(default=list)  # List of shopping items
    aisles_data = models.JSONField(default=dict)  # Items grouped by aisle
    meal_breakdown_data = models.JSONField(default=dict, blank=True)
    meal_type_summary_data = models.JSONField(default=dict, blank=True)
    total_estimated_cost = models.FloatField(default=0)
    total_items = models.PositiveIntegerField(default=0)

    # Status
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"{self.account.email} shopping list {self.start_date} to {self.end_date}"
        )

    def mark_completed(self):
        """Mark shopping list as completed"""
        from django.utils import timezone

        self.is_completed = True
        self.completed_at = timezone.now()
        self.save()
