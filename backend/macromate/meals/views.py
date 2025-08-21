from rest_framework import status as s
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from django.shortcuts import get_object_or_404
from datetime import date
import json

from .models import MealPlan, Recipe
from meal_planning.models import MacroGoal
from .services import MealPlannerService
from .serializers import MealPlanSerializer


class AuthenticatedAPIView(APIView):
    """
    Base class for views that require user authentication
    """

    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]


class MealSuggestionsView(AuthenticatedAPIView):
    """
    API endpoint to get meal suggestions based on user's macro goals
    """

    def get(self, request):
        """Handle GET requests to fetch meal suggestions"""
        try:
            macro_goals = (
                MacroGoal.objects.filter(account=request.user).order_by("-id").first()
            )

            if not macro_goals:
                return Response(
                    {
                        "error": "Please set your macro goals first before getting meal suggestions."
                    },
                    status=s.HTTP_400_BAD_REQUEST,
                )

            # Create our meal planning service with the user's goals
            planner = MealPlannerService(macro_goals)

            # Check if they want suggestions for a specific meal or all meals
            meal_type = request.query_params.get("meal_type")

            if meal_type and meal_type in ["breakfast", "lunch", "dinner"]:
                suggestions = {meal_type: planner.fetch_meal_options(meal_type)}
            else:
                suggestions = planner.get_all_meal_options()

            # Return the suggestions along with the user's daily goals
            return Response(
                {
                    "suggestions": suggestions,
                    "daily_goals": {
                        "calories": macro_goals.calories,
                        "proteins": macro_goals.proteins,
                        "fats": macro_goals.fats,
                        "carbohydrates": macro_goals.carbohydrates,
                    },
                }
            )

        except Exception as e:
            return Response(
                {"error": f"Error fetching meal suggestions: {str(e)}"},
                status=s.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class MealPlanView(AuthenticatedAPIView):
    """
    API endpoint to manage meal plans
    """

    def get(self, request):
        """Get user's meal plan for a specific date"""
        target_date = request.query_params.get("date", str(date.today()))

        try:
            meal_plan = MealPlan.objects.get(account=request.user, date=target_date)

            # FIXED: Get most recent macro goal instead of using .get()
            macro_goals = (
                MacroGoal.objects.filter(account=request.user).order_by("-id").first()
            )

            if not macro_goals:
                return Response(
                    {"error": "Please set your macro goals first."},
                    status=s.HTTP_400_BAD_REQUEST,
                )

            planner = MealPlannerService(macro_goals)

            # Calculate total nutrition for all selected meals
            meal_totals = planner.calculate_meal_totals(
                breakfast_id=meal_plan.breakfast.id if meal_plan.breakfast else None,
                lunch_id=meal_plan.lunch.id if meal_plan.lunch else None,
                dinner_id=meal_plan.dinner.id if meal_plan.dinner else None,
            )

            # Convert meal plan object to JSON format for API response
            serializer = MealPlanSerializer(meal_plan)
            response_data = serializer.data

            # Add the calculated nutrition totals to the response
            response_data["totals"] = meal_totals

            return Response(response_data)

        except MealPlan.DoesNotExist:
            return Response(
                {"error": f"No meal plan found for {target_date}"},
                status=s.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            return Response(
                {"error": f"Error retrieving meal plan: {str(e)}"},
                status=s.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def post(self, request):
        """Create or update a meal plan with user's selected recipes"""
        target_date = request.data.get("date", str(date.today()))

        try:
            # Get existing meal plan OR create a new one for this date
            meal_plan, created = MealPlan.objects.get_or_create(
                account=request.user,
                date=target_date,
            )

            # Update selected meals based on what user sent in request
            if "breakfast_id" in request.data:
                meal_plan.breakfast = get_object_or_404(
                    Recipe, id=request.data["breakfast_id"]
                )

            if "lunch_id" in request.data:
                meal_plan.lunch = get_object_or_404(Recipe, id=request.data["lunch_id"])

            if "dinner_id" in request.data:
                meal_plan.dinner = get_object_or_404(
                    Recipe, id=request.data["dinner_id"]
                )

            # Save the updated meal plan to database
            meal_plan.save()

            # FIXED: Get most recent macro goal instead of using .get()
            macro_goals = (
                MacroGoal.objects.filter(account=request.user).order_by("-id").first()
            )

            if not macro_goals:
                return Response(
                    {"error": "Please set your macro goals first."},
                    status=s.HTTP_400_BAD_REQUEST,
                )

            planner = MealPlannerService(macro_goals)

            # Calculate totals from all selected meals
            meal_totals = planner.calculate_meal_totals(
                breakfast_id=meal_plan.breakfast.id if meal_plan.breakfast else None,
                lunch_id=meal_plan.lunch.id if meal_plan.lunch else None,
                dinner_id=meal_plan.dinner.id if meal_plan.dinner else None,
            )

            # Prepare response with meal plan data and nutrition totals
            serializer = MealPlanSerializer(meal_plan)
            response_data = serializer.data
            response_data["totals"] = meal_totals

            return Response(response_data, status=s.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": f"Error updating meal plan: {str(e)}"},
                status=s.HTTP_400_BAD_REQUEST,
            )


class RecipeDetailView(AuthenticatedAPIView):
    """
    API endpoint to get detailed information about a specific recipe
    """

    def get(self, request, recipe_id):
        """Get detailed information about a specific recipe"""
        try:
            recipe = Recipe.objects.get(id=recipe_id)

            recipe_data = {
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
                "instructions": recipe.instructions,
                "ingredients": recipe.ingredients,
                "meal_type": recipe.meal_type,
            }

            return Response(recipe_data)

        except Recipe.DoesNotExist:
            return Response({"error": "Recipe not found"}, status=s.HTTP_404_NOT_FOUND)
