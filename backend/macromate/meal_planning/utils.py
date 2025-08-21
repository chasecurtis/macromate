from .models import FavoriteRecipe


def increment_favorite_usage(account, spoonacular_id):
    """
    Increment usage counter when a favorite recipe is used in meal plan
    Call this from your meals app when a user selects a recipe
    """
    try:
        favorite = FavoriteRecipe.objects.get(
            account=account, spoonacular_id=spoonacular_id
        )
        favorite.increment_usage()
        return True
    except FavoriteRecipe.DoesNotExist:

        return False


def is_recipe_favorited(account, spoonacular_id):
    """
    Check if a recipe is already in user's favorites
    """
    return FavoriteRecipe.objects.filter(
        account=account, spoonacular_id=spoonacular_id
    ).exists()


def get_user_favorite_ids(account):
    """
    Get list of spoonacular_ids that are in user's favorites
    Useful for marking recipes as favorited in your frontend
    """
    return list(
        FavoriteRecipe.objects.filter(account=account).values_list(
            "spoonacular_id", flat=True
        )
    )
