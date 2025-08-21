from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status as s
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from datetime import date, datetime, timedelta
from .models import MacroGoal, ShoppingList, FavoriteRecipe
from meals.models import MealPlan
from .serializers import (
    MacroGoalSerializer,
    ShoppingListSerializer,
    FavoriteRecipeSerializer,
)
from .services import ShoppingListService


class AuthenticatedAPIView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]


class MacroGoalView(AuthenticatedAPIView):
    """Simple MacroGoal view - gets most recent goal"""

    def get(self, request):
        """Get user's most recent macro goal"""
        try:
            macro_goal = (
                MacroGoal.objects.filter(account=request.user).order_by("-id").first()
            )

            if not macro_goal:
                return Response(
                    {"error": "No macro goals found"}, status=s.HTTP_404_NOT_FOUND
                )

            serialized_goal = MacroGoalSerializer(macro_goal)
            return Response(serialized_goal.data)
        except Exception as e:
            return Response(
                {"error": f"Error retrieving macro goals: {str(e)}"},
                status=s.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def post(self, request):
        """Create a new macro goal"""
        serialized_goal = MacroGoalSerializer(data=request.data)
        if serialized_goal.is_valid():
            serialized_goal.save(account=request.user)
            return Response(serialized_goal.data, status=s.HTTP_201_CREATED)
        return Response(serialized_goal.errors, status=s.HTTP_400_BAD_REQUEST)

    def put(self, request):
        """Update most recent macro goal"""
        try:
            macro_goal = (
                MacroGoal.objects.filter(account=request.user).order_by("-id").first()
            )

            if not macro_goal:
                return Response(
                    {"error": "No macro goals found to update!"},
                    status=s.HTTP_404_NOT_FOUND,
                )

            serialized_goal = MacroGoalSerializer(macro_goal, data=request.data)
            if serialized_goal.is_valid():
                serialized_goal.save()
                return Response(serialized_goal.data)
            return Response(serialized_goal.errors, status=s.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"error": f"Error updating macro goals: {str(e)}"},
                status=s.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# Keep all the other views as they were in your original file
class ShoppingListView(AuthenticatedAPIView):

    def get(self, request):
        """Get shopping lists for the user"""
        # Get query parameters
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        if start_date:
            try:
                start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
            except ValueError:
                return Response(
                    {"error": "Invalid start_date format. Use YYYY-MM-DD"},
                    status=s.HTTP_400_BAD_REQUEST,
                )

        if end_date:
            try:
                end_date = datetime.strptime(end_date, "%Y-%m-%d").date()
            except ValueError:
                return Response(
                    {"error": "Invalid end_date format. Use YYYY-MM-DD"},
                    status=s.HTTP_400_BAD_REQUEST,
                )

        # Default to today if no dates provided
        if not start_date:
            start_date = date.today()
        if not end_date:
            end_date = start_date

        try:
            shopping_list = ShoppingList.objects.get(
                account=request.user, start_date=start_date, end_date=end_date
            )
            serializer = ShoppingListSerializer(shopping_list)
            return Response(serializer.data)
        except ShoppingList.DoesNotExist:
            return Response(
                {"error": "No shopping list found for the specified date range"},
                status=s.HTTP_404_NOT_FOUND,
            )

    def post(self, request):
        """Generate a new shopping list"""
        start_date = request.data.get("start_date")
        end_date = request.data.get("end_date", start_date)

        if not start_date:
            return Response(
                {"error": "start_date is required"}, status=s.HTTP_400_BAD_REQUEST
            )

        try:
            start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
            end_date = datetime.strptime(end_date, "%Y-%m-%d").date()
        except ValueError:
            return Response(
                {"error": "Invalid date format. Use YYYY-MM-DD"},
                status=s.HTTP_400_BAD_REQUEST,
            )

        try:
            service = ShoppingListService()
            shopping_list = service.generate_shopping_list_for_meal_plans(
                request.user, start_date, end_date
            )

            if shopping_list:
                serializer = ShoppingListSerializer(shopping_list)
                return Response(serializer.data, status=s.HTTP_201_CREATED)
            else:
                return Response(
                    {"error": "No meal plans found for the specified date range"},
                    status=s.HTTP_404_NOT_FOUND,
                )
        except Exception as e:
            return Response(
                {"error": f"Error generating shopping list: {str(e)}"},
                status=s.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ShoppingListDetailView(AuthenticatedAPIView):

    def patch(self, request, shopping_list_id):
        """Update shopping list (e.g., mark as completed)"""
        try:
            shopping_list = ShoppingList.objects.get(
                id=shopping_list_id, account=request.user
            )

            if "is_completed" in request.data:
                shopping_list.is_completed = request.data["is_completed"]
                if shopping_list.is_completed:
                    from django.utils import timezone

                    shopping_list.completed_at = timezone.now()
                else:
                    shopping_list.completed_at = None
                shopping_list.save()

            serializer = ShoppingListSerializer(shopping_list)
            return Response(serializer.data)

        except ShoppingList.DoesNotExist:
            return Response(
                {"error": "Shopping list not found"}, status=s.HTTP_404_NOT_FOUND
            )

    def delete(self, request, shopping_list_id):
        """Delete a shopping list"""
        try:
            shopping_list = ShoppingList.objects.get(
                id=shopping_list_id, account=request.user
            )
            shopping_list.delete()
            return Response({"message": "Shopping list deleted successfully"})

        except ShoppingList.DoesNotExist:
            return Response(
                {"error": "Shopping list not found"}, status=s.HTTP_404_NOT_FOUND
            )


class WeeklyShoppingListView(AuthenticatedAPIView):

    def post(self, request):
        """Generate a weekly shopping list"""
        week_start = request.data.get("week_start")

        if not week_start:
            # Default to current week
            today = date.today()
            week_start = today - timedelta(days=today.weekday())
        else:
            try:
                week_start = datetime.strptime(week_start, "%Y-%m-%d").date()
            except ValueError:
                return Response(
                    {"error": "Invalid date format. Use YYYY-MM-DD"},
                    status=s.HTTP_400_BAD_REQUEST,
                )

        week_end = week_start + timedelta(days=6)

        try:
            service = ShoppingListService()
            shopping_list = service.generate_shopping_list_for_meal_plans(
                request.user, week_start, week_end
            )

            if shopping_list:
                serializer = ShoppingListSerializer(shopping_list)
                return Response(serializer.data, status=s.HTTP_201_CREATED)
            else:
                return Response(
                    {"error": "No meal plans found for the specified week"},
                    status=s.HTTP_404_NOT_FOUND,
                )
        except Exception as e:
            return Response(
                {"error": f"Error generating weekly shopping list: {str(e)}"},
                status=s.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class FavoriteRecipeView(AuthenticatedAPIView):

    def get(self, request):
        """Get all favorite recipes for the user"""
        favorites = FavoriteRecipe.objects.filter(account=request.user)
        serializer = FavoriteRecipeSerializer(favorites, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Add a recipe to favorites"""
        serializer = FavoriteRecipeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(account=request.user)
            return Response(serializer.data, status=s.HTTP_201_CREATED)
        return Response(serializer.errors, status=s.HTTP_400_BAD_REQUEST)


class FavoriteRecipeDetailView(AuthenticatedAPIView):

    def patch(self, request, favorite_id):
        """Update a favorite recipe"""
        try:
            favorite = FavoriteRecipe.objects.get(id=favorite_id, account=request.user)
            serializer = FavoriteRecipeSerializer(
                favorite, data=request.data, partial=True
            )
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=s.HTTP_400_BAD_REQUEST)

        except FavoriteRecipe.DoesNotExist:
            return Response(
                {"error": "Favorite recipe not found"}, status=s.HTTP_404_NOT_FOUND
            )

    def delete(self, request, favorite_id):
        """Remove a recipe from favorites"""
        try:
            favorite = FavoriteRecipe.objects.get(id=favorite_id, account=request.user)
            favorite.delete()
            return Response({"message": "Recipe removed from favorites"})

        except FavoriteRecipe.DoesNotExist:
            return Response(
                {"error": "Favorite recipe not found"}, status=s.HTTP_404_NOT_FOUND
            )
