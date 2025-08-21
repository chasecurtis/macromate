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


class FavoriteRecipe(models.Model):
    """User's saved/favorite recipes"""

    account = models.ForeignKey(
        Account, on_delete=models.CASCADE, related_name="favorite_recipes"
    )

    # Store recipe data (matching your Recipe model from meals app)
    spoonacular_id = models.IntegerField()
    title = models.CharField(max_length=255)
    image_url = models.URLField(blank=True, null=True)
    ready_in_minutes = models.PositiveIntegerField(default=0)
    servings = models.PositiveIntegerField(default=1)

    # Basic nutrition (using same field names as your Recipe model)
    calories = models.FloatField(default=0)
    protein = models.FloatField(default=0)  # Note: singular to match typical naming
    carbohydrates = models.FloatField(default=0)
    fat = models.FloatField(default=0)  # Note: singular to match typical naming

    # User's personal data
    notes = models.TextField(blank=True)  # User's personal notes
    rating = models.PositiveIntegerField(null=True, blank=True)  # 1-5 star rating
    times_used = models.PositiveIntegerField(default=0)  # Track usage

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["account", "spoonacular_id"]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.account.email} favorited {self.title}"

    def increment_usage(self):
        """Increment usage counter when recipe is used in meal plan"""
        self.times_used += 1
        self.save()
