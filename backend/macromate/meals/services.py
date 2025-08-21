import requests
import math
from decouple import config
from .models import Recipe
from meal_planning.models import MacroGoal


class MealPlannerService:
    """
    This class handles all the meal planning logic:
    1. Takes user's daily macro goals
    2. Splits them into breakfast/lunch/dinner portions
    3. Calls Spoonacular API to find matching recipes
    4. Saves recipes to our database
    """

    def __init__(self, macro_goal):
        """
        Constructor - runs when we create a new MealPlannerService
        macro_goal: A MacroGoal object from the database containing user's daily targets
        """
        # Convert the MacroGoal object into a dict
        self.daily_goals = {
            "calories": macro_goal.calories,
            "proteins": macro_goal.proteins,
            "fats": macro_goal.fats,
            "carbohydrates": macro_goal.carbohydrates,
        }

        # This defines what percentage of daily macros each meal should have
        # For example: breakfast gets 25% of daily calories, lunch gets 35%, dinner gets 40%
        # These percentages are based on typical eating patterns
        self.meal_distribution = {
            "breakfast": {
                "calories": 0.25,
                "proteins": 0.27,
                "fats": 0.20,
                "carbohydrates": 0.35,
            },
            "lunch": {
                "calories": 0.35,
                "proteins": 0.33,
                "fats": 0.30,
                "carbohydrates": 0.35,
            },
            "dinner": {
                "calories": 0.40,
                "proteins": 0.40,
                "fats": 0.50,
                "carbohydrates": 0.30,
            },
        }

        self.api_key = config("SPOONACULAR_API_KEY")
        self.base_url = "https://api.spoonacular.com/recipes/complexSearch"

    def get_meal_targets(self, meal_type):
        """
        Calculate the min/max macro ranges for a specific meal (breakfast/lunch/dinner)

        Example: If user wants 2000 calories/day and this is breakfast (25% of daily calories):
        - Target: 2000 * 0.25 = 500 calories for breakfast
        - With 20% tolerance: 400-600 calories range

        meal_type: string like 'breakfast', 'lunch', or 'dinner'
        Returns: dictionary with min/max values for each macro
        """
        # Check if the meal_type is valid (safety check)
        if meal_type not in self.meal_distribution:
            raise ValueError(f"Invalid meal type: {meal_type}")

        # Get the percentage breakdown for this specific meal
        distribution = self.meal_distribution[meal_type]

        tolerance = 0.5  # +/- 50%

        # This will store our calculated min/max values
        targets = {}

        # Calculate ranges for each nutrient (calories, protein, fat, carbs)
        for nutrient in ["calories", "proteins", "fats", "carbohydrates"]:

            # Step 1: Calculate base amount for this meal
            # Example: 2000 calories * 0.25 (breakfast %) = 500 calories
            base_amount = self.daily_goals[nutrient] * distribution[nutrient]

            # Step 2: Calculate minimum (base amount minus 20%)
            # Example: 500 * 0.8 = 400, then floor() to get whole number
            targets[f"min_{nutrient}"] = math.floor(base_amount * (1 - tolerance))

            # Step 3: Calculate maximum (base amount plus 20%)
            # Example: 500 * 1.2 = 600, then ceil() to get whole number
            targets[f"max_{nutrient}"] = math.ceil(base_amount * (1 + tolerance))

        # Return dictionary like: {'min_calories': 400, 'max_calories': 600, ...}
        return targets

    def fetch_meal_options(self, meal_type, number=24):
        """
        Call Spoonacular API to get recipe suggestions for a specific meal

        meal_type: 'breakfast', 'lunch', or 'dinner'
        number: how many recipes to get (default 12)
        Returns: list of processed recipe dictionaries
        """
        # calculate what macro ranges we need for this meal
        targets = self.get_meal_targets(meal_type)

        params = {
            "apiKey": self.api_key,
            "type": meal_type,
            "minCalories": targets["min_calories"],
            "maxCalories": targets["max_calories"],
            "minProtein": targets["min_proteins"],
            "maxProtein": targets["max_proteins"],
            "minFat": targets["min_fats"],
            "maxFat": targets["max_fats"],
            "minCarbs": targets["min_carbohydrates"],
            "maxCarbs": targets["max_carbohydrates"],
            "addRecipeInformation": True,
            "addRecipeNutrition": True,
            "number": number,
        }

        try:
            response = requests.get(self.base_url, params=params)
            response.raise_for_status()
            data = response.json()
            results = data.get("results", [])

            # Process the recipes and save them to our database
            processed_recipes = self._process_and_cache_recipes(results, meal_type)

            return processed_recipes

        except requests.RequestException as e:
            print(f"ERROR: API request failed for {meal_type}: {str(e)}")
            if hasattr(e, "response") and e.response is not None:
                print(f"ERROR: Response content: {e.response.text}")
            raise Exception(f"Error fetching recipes from Spoonacular: {str(e)}")
        except Exception as e:
            print(f"ERROR: Unexpected error for {meal_type}: {str(e)}")
            raise Exception(f"Error processing recipes for {meal_type}: {str(e)}")

    def _process_and_cache_recipes(self, recipes_data, meal_type):
        """
        Take the raw recipe data from Spoonacular API and:
        1. Extract the nutrition information
        2. Save recipes to our database (cache them)
        3. Return clean, processed recipe data

        recipes_data: list of recipe dictionaries from Spoonacular
        meal_type: 'breakfast', 'lunch', or 'dinner'
        Returns: list of cleaned recipe dictionaries
        """
        processed_recipes = []

        # Loop through each recipe from the API response
        for recipe_data in recipes_data:
            try:
                # Extract nutrition data from the complex API structure
                nutrition = recipe_data.get("nutrition", {})

                # Convert the nested nutrition list into a simple dictionary
                # This transforms: [{"name": "Calories", "amount": 350}]
                # Into: {"calories": 350}
                nutrients = {}
                for nutrient in nutrition.get("nutrients", []):
                    nutrient_name = nutrient.get("name", "").lower()
                    nutrient_amount = nutrient.get("amount", 0)
                    nutrients[nutrient_name] = nutrient_amount

                # Safely extract nutrition values with fallbacks
                # Spoonacular API returns: "Protein", "Fat", "Carbohydrates", etc.
                # We need to map these to our internal field names
                calories = (
                    nutrients.get("calories")
                    or nutrients.get("energy")
                    or nutrients.get("energy (kcal)")
                    or 0
                )

                protein = nutrients.get("protein") or nutrients.get("proteins") or 0

                fat = (
                    nutrients.get("fat")
                    or nutrients.get("total fat")
                    or nutrients.get("fats")
                    or 0
                )

                carbs = (
                    nutrients.get("carbohydrates")
                    or nutrients.get("carbs")
                    or nutrients.get("total carbohydrates")
                    or 0
                )

                # Prepare all the recipe information for our database
                recipe_info = {
                    "spoonacular_id": recipe_data["id"],
                    "title": recipe_data["title"],
                    "image": recipe_data.get("image", ""),
                    "ready_in_minutes": recipe_data.get("readyInMinutes", 0),
                    "servings": recipe_data.get("servings", 1),
                    "calories": calories,
                    "proteins": protein,
                    "fats": fat,
                    "carbohydrates": carbs,
                    "summary": recipe_data.get("summary", ""),
                    "meal_type": meal_type,
                    "ingredients": self._extract_ingredients(recipe_data),
                }

                # Save to database (or update if it already exists)
                # This prevents duplicate recipes in our database
                recipe, created = Recipe.objects.update_or_create(
                    spoonacular_id=recipe_info[
                        "spoonacular_id"
                    ],  # Find by Spoonacular ID
                    defaults=recipe_info,  # Update with new info
                )

                # Create a clean dictionary to return to the frontend
                processed_recipes.append(
                    {
                        "id": recipe.id,
                        "spoonacular_id": recipe.spoonacular_id,
                        "title": recipe.title,
                        "image": recipe.image,
                        "ready_in_minutes": recipe.ready_in_minutes,
                        "servings": recipe.servings,
                        "calories": recipe.calories,
                        "proteins": recipe.proteins,
                        "fats": recipe.fats,
                        "carbohydrates": recipe.carbohydrates,
                        "summary": recipe.summary,
                    }
                )

            except Exception as e:
                # If processing this recipe fails, skip it and continue with others
                print(
                    f"ERROR processing recipe {recipe_data.get('title', 'Unknown')}: {str(e)}"
                )
                continue

        return processed_recipes

    def _extract_ingredients(self, recipe_data):
        """Extract ingredients from recipe data"""
        ingredients = []

        # Handle different possible ingredient formats from API
        if "extendedIngredients" in recipe_data:
            for ing in recipe_data["extendedIngredients"]:
                ingredients.append(
                    {
                        "id": ing.get("id"),
                        "name": ing.get("name", ""),
                        "amount": ing.get("amount", 0),
                        "unit": ing.get("unit", ""),
                        "original": ing.get("original", ""),
                    }
                )
        elif "ingredients" in recipe_data:
            # Fallback if extendedIngredients not available
            for ing in recipe_data["ingredients"]:
                if isinstance(ing, str):
                    # Simple string ingredient
                    ingredients.append(
                        {
                            "id": None,
                            "name": ing,
                            "amount": 0,
                            "unit": "",
                            "original": ing,
                        }
                    )
                elif isinstance(ing, dict):
                    # Dictionary ingredient
                    ingredients.append(
                        {
                            "id": ing.get("id"),
                            "name": ing.get("name", ""),
                            "amount": ing.get("amount", 0),
                            "unit": ing.get("unit", ""),
                            "original": ing.get("original", ing.get("name", "")),
                        }
                    )

        return ingredients

    def get_all_meal_options(self):
        """Get options for all three meals"""
        meal_options = {}

        for meal_type in ["breakfast", "lunch", "dinner"]:
            try:
                meal_options[meal_type] = self.fetch_meal_options(meal_type)
            except Exception as e:
                print(f"Error fetching {meal_type} options: {str(e)}")
                meal_options[meal_type] = []

        return meal_options

    def calculate_meal_totals(self, breakfast_id=None, lunch_id=None, dinner_id=None):
        """Calculate total macros for selected meals"""
        total_macros = {"calories": 0, "proteins": 0, "fats": 0, "carbohydrates": 0}

        meal_ids = [breakfast_id, lunch_id, dinner_id]

        for meal_id in meal_ids:
            if meal_id:
                try:
                    recipe = Recipe.objects.get(id=meal_id)
                    total_macros["calories"] += recipe.calories
                    total_macros["proteins"] += recipe.proteins
                    total_macros["fats"] += recipe.fats
                    total_macros["carbohydrates"] += recipe.carbohydrates
                except Recipe.DoesNotExist:
                    continue

        # Calculate how close we are to daily goals
        goal_percentages = {}
        for nutrient in total_macros:
            daily_goal = self.daily_goals[nutrient]

            if daily_goal > 0:
                percentage = (total_macros[nutrient] / daily_goal) * 100
                goal_percentages[f"{nutrient}_percentage"] = round(percentage, 1)
            else:
                goal_percentages[f"{nutrient}_percentage"] = 0

        return {
            "totals": total_macros,
            "daily_goals": self.daily_goals,
            "goal_percentages": goal_percentages,
        }
