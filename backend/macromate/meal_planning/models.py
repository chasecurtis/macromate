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
