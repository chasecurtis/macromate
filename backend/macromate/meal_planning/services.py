import requests
from django.core.cache import cache
from decouple import config
from typing import Dict, List
from .models import ShoppingList
from meals.models import Recipe, MealPlan
from datetime import date, timedelta
import logging

logger = logging.getLogger(__name__)


class ShoppingListService:
    def __init__(self):
        self.api_key = config("SPOONACULAR_API_KEY")
        self.usda_api_key = config("USDA_API_KEY")
        self.base_url = "https://api.spoonacular.com"
        self.usda_base_url = "https://api.nal.usda.gov/fdc/v1"

    def _fetch_full_recipe_info(self, recipe_id):
        """Fetch detailed recipe information including ingredients with pricing"""
        url = f"{self.base_url}/recipes/{recipe_id}/information"
        params = {
            "apiKey": self.api_key,
            "includeNutrition": False,  # We don't need nutrition for shopping lists
            "addWinePairing": False,
            "addTasteData": False,
        }

        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            logger.error(f"Error fetching recipe {recipe_id}: {e}")
            return None

    def generate_shopping_list_for_meal_plans(self, account, start_date, end_date=None):
        """
        Generate shopping list from user's meal plans for a date range
        """
        if end_date is None:
            end_date = start_date

        # Get all meal plans for the date range from your meals app
        # Your MealPlan has breakfast, lunch, dinner fields instead of a single recipe field
        meal_plans = MealPlan.objects.filter(
            account=account, date__gte=start_date, date__lte=end_date
        )

        if not meal_plans.exists():
            return None

        # Collect all recipes from breakfast, lunch, dinner fields
        recipe_details = {}
        recipes_to_fetch = []

        for meal_plan in meal_plans:
            # Check each meal type and collect recipes
            meal_recipes = []
            if meal_plan.breakfast:
                meal_recipes.append(("breakfast", meal_plan.breakfast))
            if meal_plan.lunch:
                meal_recipes.append(("lunch", meal_plan.lunch))
            if meal_plan.dinner:
                meal_recipes.append(("dinner", meal_plan.dinner))

            # Add to our collection
            for meal_type, recipe in meal_recipes:
                recipe_id = recipe.spoonacular_id
                if recipe_id not in recipe_details:
                    full_recipe = self._fetch_full_recipe_info(recipe_id)
                    if full_recipe:
                        recipe_details[recipe_id] = {
                            "recipe_data": full_recipe,
                            "meal_plans": [],
                        }

                if recipe_id in recipe_details:
                    # Store the meal plan info with meal type and servings
                    recipe_details[recipe_id]["meal_plans"].append(
                        {
                            "meal_plan": meal_plan,
                            "meal_type": meal_type,
                            "recipe": recipe,
                            "servings": 1.0,  # Default to 1 serving, adjust if you track servings
                        }
                    )

        if not recipe_details:
            return None

        # Generate consolidated shopping list
        shopping_data = self._create_shopping_list(recipe_details)

        # Create or update ShoppingList object
        shopping_list, created = ShoppingList.objects.get_or_create(
            account=account,
            start_date=start_date,
            end_date=end_date,
            defaults={
                "items_data": shopping_data["items"],
                "aisles_data": shopping_data["aisles"],
                "total_estimated_cost": shopping_data["total_cost"],
                "total_items": shopping_data["total_items"],
                "meal_breakdown_data": shopping_data["meal_breakdown"],
                "meal_type_summary_data": shopping_data["meal_type_summary"],
            },
        )

        if not created:
            # Update existing shopping list
            shopping_list.items_data = shopping_data["items"]
            shopping_list.aisles_data = shopping_data["aisles"]
            shopping_list.total_estimated_cost = shopping_data["total_cost"]
            shopping_list.total_items = shopping_data["total_items"]
            shopping_list.meal_breakdown_data = shopping_data["meal_breakdown"]
            shopping_list.meal_type_summary_data = shopping_data["meal_type_summary"]
            shopping_list.save()

        shopping_list._meal_breakdown = shopping_data.get("meal_breakdown", {})
        shopping_list._meal_type_summary = shopping_data.get("meal_type_summary", {})

        return shopping_list

    def _create_shopping_list(self, recipe_details):
        """
        Create consolidated shopping list from multiple recipes with detailed cost breakdowns
        """
        consolidated_ingredients = {}
        total_cost = 0
        meal_breakdown = {}

        # First pass: collect all ingredients and calculate costs
        for recipe_id, data in recipe_details.items():
            recipe_data = data["recipe_data"]
            meal_plan_entries = data["meal_plans"]

            ingredients = recipe_data.get("extendedIngredients", [])
            recipe_servings = recipe_data.get("servings", 1)

            # Get recipe info from first meal entry (they should all be the same recipe)
            first_meal_entry = meal_plan_entries[0] if meal_plan_entries else None
            if not first_meal_entry:
                continue

            recipe_title = first_meal_entry["recipe"].title
            recipe_ingredients_cost = []
            recipe_total_cost = 0

            for ingredient in ingredients:
                ingredient_key = self._create_ingredient_key(ingredient)

                # Use FULL recipe amounts for shopping
                full_amount = ingredient.get("amount", 0)

                # Calculate cost for full amount
                ingredient_data = {
                    "name": ingredient.get("name", ""),
                    "amount": full_amount,
                    "unit": ingredient.get("unit", ""),
                    "aisle": ingredient.get("aisle", "Other"),
                    "image": ingredient.get("image", ""),
                    "original": ingredient.get("original", ""),
                }

                estimated_cost = self._estimate_ingredient_cost(
                    ingredient_data, full_amount, ingredient.get("unit", "")
                )

                # Per-serving calculations
                per_serving_amount = (
                    full_amount / recipe_servings
                    if recipe_servings > 0
                    else full_amount
                )
                cost_per_serving = (
                    estimated_cost / recipe_servings
                    if recipe_servings > 0
                    else estimated_cost
                )

                # Add to recipe breakdown
                recipe_ingredients_cost.append(
                    {
                        "name": ingredient.get("name", ""),
                        "cost_per_serving": round(cost_per_serving, 2),
                        "amount_per_serving": f"{round(per_serving_amount, 2)} {ingredient.get('unit', '')}",
                        "total_ingredient_cost": round(estimated_cost, 2),
                        "total_amount": f"{full_amount} {ingredient.get('unit', '')}",
                    }
                )

                recipe_total_cost += estimated_cost

                # Add to consolidated shopping list
                if ingredient_key in consolidated_ingredients:
                    # Check if this exact recipe already contributed to this ingredient
                    if (
                        recipe_title
                        not in consolidated_ingredients[ingredient_key]["used_in"]
                    ):
                        consolidated_ingredients[ingredient_key][
                            "amount"
                        ] += full_amount
                        consolidated_ingredients[ingredient_key][
                            "estimated_cost"
                        ] += estimated_cost
                        consolidated_ingredients[ingredient_key]["used_in"].append(
                            recipe_title
                        )
                else:
                    consolidated_ingredients[ingredient_key] = {
                        "name": ingredient.get("name", ""),
                        "amount": full_amount,
                        "unit": ingredient.get("unit", ""),
                        "aisle": ingredient.get("aisle", "Other"),
                        "image": ingredient.get("image", ""),
                        "original": ingredient.get("original", ""),
                        "used_in": [recipe_title],
                        "estimated_cost": estimated_cost,
                        "per_serving_amount": round(per_serving_amount, 2),
                        "recipe_servings": recipe_servings,
                        "serving_info": f"{round(per_serving_amount, 2)} {ingredient.get('unit', '')} per serving",
                    }

            # Add to meal breakdown ONCE per recipe
            meal_breakdown[recipe_title] = {
                "cost_per_serving": (
                    round(recipe_total_cost / recipe_servings, 2)
                    if recipe_servings > 0
                    else round(recipe_total_cost, 2)
                ),
                "total_servings": recipe_servings,
                "total_recipe_cost": round(recipe_total_cost, 2),
                "meal_type": first_meal_entry["meal_type"],
                "ingredients": recipe_ingredients_cost,
            }

        # Convert consolidated ingredients to list and group by aisle
        items = []
        aisles = {}

        for ingredient_data in consolidated_ingredients.values():
            # Round amounts for display
            ingredient_data["amount"] = round(ingredient_data["amount"], 2)
            ingredient_data["estimated_cost"] = round(
                ingredient_data["estimated_cost"], 2
            )

            items.append(ingredient_data)
            total_cost += ingredient_data["estimated_cost"]

            # Group by aisle
            aisle = ingredient_data["aisle"]
            if aisle not in aisles:
                aisles[aisle] = []
            aisles[aisle].append(ingredient_data)

        # Calculate summary by meal type
        meal_type_summary = {}
        for recipe_name, breakdown in meal_breakdown.items():
            meal_type = breakdown["meal_type"]
            if meal_type not in meal_type_summary:
                meal_type_summary[meal_type] = {"total_cost": 0, "recipes": []}
            meal_type_summary[meal_type]["total_cost"] += breakdown["total_recipe_cost"]
            meal_type_summary[meal_type]["recipes"].append(recipe_name)

        # Round meal type totals
        for meal_type in meal_type_summary:
            meal_type_summary[meal_type]["total_cost"] = round(
                meal_type_summary[meal_type]["total_cost"], 2
            )

        return {
            "items": items,
            "aisles": aisles,
            "total_cost": round(total_cost, 2),
            "total_items": len(items),
            "meal_breakdown": meal_breakdown,
            "meal_type_summary": meal_type_summary,
        }

    def _create_ingredient_key(self, ingredient):
        """Create a unique key for ingredient consolidation"""
        name = ingredient.get("name", "").lower().strip()
        unit = ingredient.get("unit", "").lower().strip()
        return f"{name}_{unit}"

    def _estimate_ingredient_cost(self, ingredient_data, amount, unit):
        """
        Estimate ingredient cost using multiple data sources in order of preference:
        1. Spoonacular pricing data
        2. USDA Food Data API
        3. Manual estimation fallback
        """
        ingredient_name = (
            ingredient_data.get("name", "").lower()
            if isinstance(ingredient_data, dict)
            else str(ingredient_data).lower()
        )

        # Skip cost calculation for items that should be free/very cheap
        free_items = ["water", "ice", "air"]
        if any(free_item in ingredient_name for free_item in free_items):
            return 0.0

        # Make salt and basic seasonings very cheap but not free
        cheap_items = ["salt", "pepper", "black pepper"]
        if any(cheap_item in ingredient_name for cheap_item in cheap_items):
            return 0.05 * amount  # 5 cents per unit

        # 1. First try Spoonacular's price data
        if isinstance(ingredient_data, dict):
            estimated_cost = ingredient_data.get("estimatedCost", {})
            if estimated_cost and estimated_cost.get("value", 0) > 0:
                spoonacular_price = (
                    estimated_cost["value"] / 100
                )  # Convert cents to dollars
                logger.info(
                    f"Using Spoonacular price for {ingredient_name}: ${spoonacular_price}"
                )
                return spoonacular_price * amount

            price_per_serving = ingredient_data.get("pricePerServing", 0)
            if price_per_serving > 0:
                spoonacular_price = (price_per_serving / 100) * amount
                logger.info(
                    f"Using Spoonacular per-serving price for {ingredient_name}: ${spoonacular_price}"
                )
                return spoonacular_price

        # 2. Try USDA Food Data API
        usda_price = self._get_usda_food_price(ingredient_name, amount, unit)
        if usda_price is not None and usda_price > 0:
            logger.info(f"Using USDA price for {ingredient_name}: ${usda_price}")
            return usda_price

        # 3. Fallback to manual estimation
        manual_price = self._improved_cost_estimation(ingredient_name, amount, unit)
        logger.info(f"Using manual estimation for {ingredient_name}: ${manual_price}")
        return manual_price

    def get_shopping_list_for_week(self, account, start_date=None):
        """Generate shopping list for a full week"""
        if start_date is None:
            start_date = date.today()

        end_date = start_date + timedelta(days=6)
        return self.generate_shopping_list_for_meal_plans(account, start_date, end_date)

    def _improved_cost_estimation(self, name, amount, unit):
        """
        Improved ingredient cost estimation with better logic
        """
        # More realistic cost database (prices per common unit)
        cost_per_unit = {
            # Proteins (per pound unless specified)
            "chicken breast": 7.99,
            "chicken thigh": 5.99,
            "ground beef": 6.99,
            "ground turkey": 5.99,
            "salmon": 15.99,
            "tuna": 12.99,
            "shrimp": 13.99,
            "eggs": 0.30,  # per egg
            "egg": 0.30,
            # Dairy (per container/typical size)
            "milk": 4.29,  # per gallon
            "heavy cream": 3.99,  # per pint
            "sour cream": 2.99,  # per container
            "yogurt": 1.29,  # per cup
            "butter": 4.99,  # per pound
            "cheese": 5.99,  # per pound
            "cream cheese": 2.99,  # per 8oz
            # Vegetables (per pound unless specified)
            "onion": 1.49,
            "garlic": 4.99,  # per pound (but used in small amounts)
            "tomato": 2.99,
            "bell pepper": 3.99,
            "carrot": 1.29,
            "celery": 1.99,
            "potato": 1.99,
            "broccoli": 2.99,
            "spinach": 3.99,
            "lettuce": 2.49,  # per head
            # Pantry staples
            "rice": 2.99,  # per 2lb bag
            "pasta": 1.29,  # per box
            "bread": 2.99,  # per loaf
            "flour": 3.99,  # per 5lb bag
            "sugar": 3.49,  # per 4lb bag
            "olive oil": 7.99,  # per bottle
            "vegetable oil": 3.99,  # per bottle
            "vinegar": 2.99,  # per bottle
            "soy sauce": 2.99,  # per bottle
            # Spices and seasonings (these are expensive per weight but used in tiny amounts)
            "oregano": 2.99,
            "basil": 2.99,
            "thyme": 2.99,
            "paprika": 3.49,
            "cumin": 3.49,
            "black pepper": 4.99,
        }

        # Default cost for unknown items
        default_cost_per_unit = 2.99

        # Find matching ingredient
        base_cost = default_cost_per_unit
        name_lower = name.lower()

        for ingredient_name, cost in cost_per_unit.items():
            if ingredient_name in name_lower:
                base_cost = cost
                break

        # Smart unit conversion and pricing
        if not amount or amount == 0:
            return 0.0

        # Convert units to estimated portions of the base cost
        unit_lower = unit.lower() if unit else ""

        # Liquid measurements
        if unit_lower in ["cup", "cups"]:
            # 1 cup = 1/16 of a gallon for liquids, 1/4 pound for solids
            if "milk" in name_lower or "cream" in name_lower:
                return base_cost * (amount / 16)  # 16 cups per gallon
            else:
                return base_cost * (amount / 4)  # Rough estimate for solids

        elif unit_lower in ["tablespoon", "tablespoons", "tbsp"]:
            if "oil" in name_lower or "vinegar" in name_lower:
                return base_cost * (amount / 32)  # ~32 tbsp per bottle
            else:
                return base_cost * (amount / 16)  # General estimate

        elif unit_lower in ["teaspoon", "teaspoons", "tsp"]:
            # Spices and seasonings
            return base_cost * (amount / 48)  # ~48 tsp per small spice container

        elif unit_lower in ["quart", "quarts", "qt"]:
            return base_cost * (amount / 4)  # 4 quarts per gallon

        elif unit_lower in ["pint", "pints"]:
            return base_cost * (amount / 8)  # 8 pints per gallon

        elif unit_lower in ["ounce", "ounces", "oz"]:
            return base_cost * (amount / 16)  # 16 oz per pound

        elif unit_lower in ["pound", "pounds", "lb", "lbs"]:
            return base_cost * amount

        elif unit_lower in ["piece", "pieces", "whole", "head", "heads"]:
            # Individual items
            if "egg" in name_lower:
                return base_cost * amount
            elif "onion" in name_lower or "pepper" in name_lower:
                return 0.75 * amount  # Individual vegetables
            else:
                return base_cost * 0.5 * amount  # General estimate

        elif unit_lower in ["clove", "cloves"]:
            # Garlic cloves
            return base_cost * (amount / 12)  # ~12 cloves per head

        elif unit_lower in ["package", "packages", "bag", "bags", "container"]:
            return base_cost * amount

        else:
            # Default: assume it's a fraction of the base unit
            return base_cost * 0.1 * amount

    def _get_usda_food_price(self, ingredient_name, amount, unit):
        """
        Get pricing from USDA Food Data API - direct search
        """
        # Clean ingredient name for search
        ingredient_name_clean = ingredient_name.lower().strip()

        # Check cache first
        cache_key = f"usda_price_{ingredient_name_clean.replace(' ', '_')}"
        cached_price = cache.get(cache_key)
        if cached_price is not None:
            return self._calculate_usda_cost(
                cached_price, amount, unit, ingredient_name_clean
            )

        # Search USDA API directly with the ingredient name
        try:
            search_url = f"{self.usda_base_url}/foods/search"
            params = {
                "query": ingredient_name_clean,
                "pageSize": 3,
                "api_key": self.usda_api_key,
            }

            response = requests.get(search_url, params=params)
            response.raise_for_status()
            data = response.json()

            if not data.get("foods"):
                return None  # No results found, fall back to manual estimation

            # Use our estimated prices based on successful search
            estimated_price = self._get_usda_estimated_price(
                ingredient_name_clean, ingredient_name_clean
            )

            # Cache the price for 24 hours
            cache.set(cache_key, estimated_price, 86400)

            return self._calculate_usda_cost(
                estimated_price, amount, unit, ingredient_name_clean
            )

        except Exception as e:
            logger.warning(f"USDA API error for {ingredient_name}: {e}")
            return None

    def _get_usda_estimated_price(self, usda_food_name, ingredient_name):
        """
        Get estimated retail price based on USDA food cost data
        These are based on USDA's Cost of Food at Home reports (updated periodically)
        """
        # Prices per pound (as of 2024 USDA estimates)
        usda_price_estimates = {
            # Proteins (per pound)
            "chicken": 4.32,
            "beef": 7.14,
            "turkey": 5.89,
            "salmon": 13.45,
            "fish": 10.20,
            "egg": 2.88,  # per dozen
            # Dairy
            "milk": 3.59,  # per gallon
            "cream": 8.50,
            "butter": 5.12,
            "cheese": 5.98,
            "yogurt": 5.45,
            # Vegetables (per pound)
            "onion": 1.28,
            "garlic": 3.45,
            "tomato": 2.87,
            "pepper": 3.21,
            "carrot": 1.15,
            "celery": 1.67,
            "potato": 1.33,
            "broccoli": 2.45,
            "spinach": 4.12,
            # Grains & Pantry (per pound)
            "rice": 1.89,
            "pasta": 1.34,
            "bread": 1.89,
            "flour": 0.89,
            "sugar": 0.95,
            "oil": 3.45,
        }

        # Find matching price category
        for category, price in usda_price_estimates.items():
            if category in ingredient_name.lower():
                return price

        # Default price if no match found
        return 2.50

    def _calculate_usda_cost(self, price_per_unit, amount, unit, ingredient_name):
        """
        Calculate cost based on actual grocery packages you'd buy
        """
        if not amount or amount == 0:
            return 0.0

        unit_lower = unit.lower() if unit else ""

        # Calculate based on actual grocery packages

        # Canned goods - always buy whole cans
        if any(
            word in ingredient_name for word in ["corn", "beans", "tomatoes", "sauce"]
        ):
            if unit_lower in ["cup", "cups", "ounce", "ounces", "oz"]:
                # Need at least 1 can, round up if recipe needs more
                cans_needed = max(1, int((amount / 1) + 0.9))  # Round up
                return price_per_unit * cans_needed

        # Dairy products
        if "milk" in ingredient_name or "cream" in ingredient_name:
            if unit_lower in ["cup", "cups"]:
                if amount <= 16:  # Up to 1 gallon worth
                    return price_per_unit  # Buy 1 gallon
                else:
                    gallons_needed = int((amount / 16) + 0.9)  # Round up
                    return price_per_unit * gallons_needed
            elif unit_lower in ["quart", "quarts"]:
                if amount <= 4:
                    return price_per_unit  # Buy 1 gallon
                else:
                    gallons_needed = int((amount / 4) + 0.9)
                    return price_per_unit * gallons_needed

        # Cheese - typically sold in 8oz blocks
        if "cheese" in ingredient_name:
            if unit_lower in ["cup", "cups", "ounce", "ounces", "oz"]:
                blocks_needed = max(
                    1, int((amount / 8) + 0.9)
                )  # 8oz per block, round up
                return price_per_unit * blocks_needed

        # Eggs - sold by dozen
        if "egg" in ingredient_name:
            if unit_lower in ["piece", "pieces", "whole", ""]:
                dozens_needed = max(
                    1, int((amount / 12) + 0.9)
                )  # Round up to whole dozen
                return price_per_unit * dozens_needed

        # Bread - sold by loaf
        if "bread" in ingredient_name:
            if unit_lower in ["slice", "slices"]:
                loaves_needed = max(1, int((amount / 20) + 0.9))  # ~20 slices per loaf
                return price_per_unit * loaves_needed

        # Meat - sold by pound, round up to nearest half pound
        if any(
            word in ingredient_name
            for word in ["chicken", "beef", "pork", "turkey", "fish", "salmon"]
        ):
            if unit_lower in ["pound", "pounds", "lb", "lbs"]:
                # Round up to nearest 0.5 lb
                pounds_needed = int((amount / 0.5) + 0.9) * 0.5
                return price_per_unit * pounds_needed
            elif unit_lower in ["ounce", "ounces", "oz"]:
                pounds_needed = int(((amount / 16) / 0.5) + 0.9) * 0.5
                return price_per_unit * pounds_needed

        # Vegetables - often sold individually or by bag
        if any(word in ingredient_name for word in ["onion", "pepper", "tomato"]):
            if unit_lower in ["piece", "pieces", "whole"]:
                # Buy individual pieces, round up
                pieces_needed = max(1, int(amount + 0.9))
                return (price_per_unit / 4) * pieces_needed  # Assume 4 pieces per pound
            elif unit_lower in ["cup", "cups"]:
                # Usually need to buy whole vegetables
                return price_per_unit * 0.5  # Assume need about half pound

        # Carrots, potatoes - often sold in bags
        if any(word in ingredient_name for word in ["carrot", "potato"]):
            if unit_lower in ["piece", "pieces", "cup", "cups"]:
                # Buy a bag (usually 2-3 lbs)
                return price_per_unit * 2.5

        # Pantry staples - sold in standard packages
        if "rice" in ingredient_name:
            if unit_lower in ["cup", "cups"]:
                if amount <= 8:  # Up to 2lb bag worth
                    return price_per_unit  # Buy 2lb bag
                else:
                    bags_needed = int((amount / 8) + 0.9)
                    return price_per_unit * bags_needed

        if "pasta" in ingredient_name:
            if unit_lower in ["cup", "cups", "ounce", "ounces", "oz"]:
                if amount <= 16:  # Up to 1 box (1 lb)
                    return price_per_unit
                else:
                    boxes_needed = int((amount / 16) + 0.9)
                    return price_per_unit * boxes_needed

        # Oils - sold in bottles
        if "oil" in ingredient_name:
            if unit_lower in ["tablespoon", "tablespoons", "tbsp", "cup", "cups"]:
                # One bottle should last for most recipes
                return price_per_unit

        # Spices and seasonings - sold in small containers
        if any(
            word in ingredient_name
            for word in ["salt", "pepper", "garlic powder", "onion powder"]
        ):
            if unit_lower in [
                "teaspoon",
                "teaspoons",
                "tsp",
                "tablespoon",
                "tablespoons",
                "tbsp",
            ]:
                # One container should last for many recipes
                return price_per_unit * 0.1  # Small fraction of container price

        # Default fallback - buy at least one standard unit
        unit_conversions = {
            "pound": 1.0,
            "pounds": 1.0,
            "lb": 1.0,
            "lbs": 1.0,
            "ounce": max(1, int((amount / 16) + 0.9)),  # Round up to whole pounds
            "ounces": max(1, int((amount / 16) + 0.9)),
            "oz": max(1, int((amount / 16) + 0.9)),
            "cup": max(1, int((amount / 4) + 0.9))
            * 0.25,  # Assume 4 cups per standard package
            "cups": max(1, int((amount / 4) + 0.9)) * 0.25,
            "piece": max(1, int(amount + 0.9)) * 0.25,
            "pieces": max(1, int(amount + 0.9)) * 0.25,
            "whole": max(1, int(amount + 0.9)) * 0.5,
        }

        conversion_factor = unit_conversions.get(unit_lower, 1.0)

        return price_per_unit * conversion_factor
