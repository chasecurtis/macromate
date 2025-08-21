from django.db import models
from accounts.models import Account
from meal_planning.models import MacroGoal


class Recipe(models.Model):
    """
    Model to store recipe information from Spoonacular API
    We cache recipes in our database to avoid repeated API calls and improve performance
    """

    # Basic recipe identification
    spoonacular_id = models.IntegerField(
        unique=True
    )  # Spoonacular's ID (must be unique)
    title = models.CharField(max_length=255)  # Recipe name like "Blueberry Pancakes"
    image = models.URLField(blank=True, null=True)  # URL to recipe photo (optional)

    # Cooking information
    ready_in_minutes = models.IntegerField()  # How long it takes to make
    servings = models.IntegerField(default=1)  # How many people it serves

    # Nutrition information (per serving) - using same naming as MacroGoal model
    calories = models.FloatField()  # Calories per serving
    proteins = (
        models.FloatField()
    )  # Protein grams per serving (plural to match MacroGoal)
    fats = models.FloatField()  # Fat grams per serving (plural to match MacroGoal)
    carbohydrates = (
        models.FloatField()
    )  # Carbohydrate grams per serving (full name to match MacroGoal)

    # Recipe content
    summary = models.TextField(blank=True)  # Description of the recipe
    instructions = models.TextField(blank=True)  # Step-by-step cooking instructions
    ingredients = models.JSONField(default=list)  # List of ingredients stored as JSON

    # Classification - what type of meal this is
    MEAL_TYPES = [
        ("breakfast", "Breakfast"),  # Morning meals
        ("lunch", "Lunch"),  # Midday meals
        ("dinner", "Dinner"),  # Evening meals
    ]
    meal_type = models.CharField(max_length=20, choices=MEAL_TYPES, blank=True)

    # Tracking when recipe was added to our database
    created_at = models.DateTimeField(auto_now_add=True)  # Set once when created

    def __str__(self):
        """What to display when printing this recipe object"""
        return self.title


class MealPlan(models.Model):
    """
    Model representing a complete meal plan for one day
    Links a user to their selected breakfast, lunch, and dinner recipes for a specific date
    """

    # Who this meal plan belongs to
    account = models.ForeignKey(
        Account, on_delete=models.CASCADE, related_name="meal_plans"
    )

    # What date this meal plan is for
    date = models.DateField()  # Just the date, not time (e.g., 2025-01-20)

    # Selected recipes for each meal (all optional - user might not select all meals)
    breakfast = models.ForeignKey(
        Recipe,
        on_delete=models.SET_NULL,  # If recipe is deleted, don't delete meal plan
        null=True,  # Can be empty (no breakfast selected)
        blank=True,  # Not required in forms
        related_name="breakfast_plans",  # Access via recipe.breakfast_plans.all()
    )
    lunch = models.ForeignKey(
        Recipe,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="lunch_plans",
    )
    dinner = models.ForeignKey(
        Recipe,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="dinner_plans",
    )

    # Tracking when meal plan was created/updated
    created_at = models.DateTimeField(auto_now_add=True)  # Set once when created
    updated_at = models.DateTimeField(auto_now=True)  # Updated every time saved

    class Meta:
        """Database constraints and settings"""

        # Prevent duplicate meal plans - each user can only have one plan per date
        unique_together = ["account", "date"]

    def __str__(self):
        """What to display when printing this meal plan object"""
        return f"{self.account.email} - {self.date}"

    # Properties that calculate nutrition totals automatically
    # These act like attributes but calculate their values each time accessed

    @property
    def total_calories(self):
        """Calculate total calories from all selected meals"""
        total = 0  # Start with zero
        # Loop through each meal (breakfast, lunch, dinner)
        for meal in [self.breakfast, self.lunch, self.dinner]:
            if meal:  # Only add if meal is selected (not None)
                total += meal.calories  # Add this meal's calories to total
        return total

    @property
    def total_protein(self):
        """Calculate total protein grams from all selected meals"""
        total = 0
        for meal in [self.breakfast, self.lunch, self.dinner]:
            if meal:  # Check if meal exists
                total += meal.proteins  # Updated to match field name
        return total

    @property
    def total_fat(self):
        """Calculate total fat grams from all selected meals"""
        total = 0
        for meal in [self.breakfast, self.lunch, self.dinner]:
            if meal:
                total += meal.fats  # Updated to match field name
        return total

    @property
    def total_carbs(self):
        """Calculate total carbohydrate grams from all selected meals"""
        total = 0
        for meal in [self.breakfast, self.lunch, self.dinner]:
            if meal:
                total += meal.carbohydrates  # Updated to match field name
        return total
