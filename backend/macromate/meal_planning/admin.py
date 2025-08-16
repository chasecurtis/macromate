from django.contrib import admin
from .models import MacroGoal
from accounts.models import Account


@admin.register(MacroGoal)
class MacroGoalAdmin(admin.ModelAdmin):
    list_display = ["account", "calories", "proteins", "carbohydrates", "fats"]
    list_filter = ["account"]
    search_fields = ["account__email", "account__first_name", "account__last_name"]
    ordering = ["-id"]  # Show newest first

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("account")
