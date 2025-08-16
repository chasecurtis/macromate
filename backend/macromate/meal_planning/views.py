from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status as s
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from .models import MacroGoal
from .serializers import MacroGoalSerializer


class AuthenticatedAPIView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]


class MacroGoalView(AuthenticatedAPIView):

    def get(self, request):
        try:
            macro_goal = MacroGoal.objects.get(account=request.user)
            serialized_goal = MacroGoalSerializer(macro_goal)
            return Response(serialized_goal.data)
        except MacroGoal.DoesNotExist:
            return Response(
                {"error": "No macro goals found"}, status=s.HTTP_404_NOT_FOUND
            )

    def post(self, request):
        serialized_goal = MacroGoalSerializer(data=request.data)
        if serialized_goal.is_valid():
            serialized_goal.save(account=request.user)
            return Response(serialized_goal.data, status=s.HTTP_201_CREATED)
        return Response(serialized_goal.errors, status=s.HTTP_400_BAD_REQUEST)

    def put(self, request):
        try:
            macro_goal = MacroGoal.objects.get(account=request.user)
            serialized_goal = MacroGoalSerializer(macro_goal, data=request.data)
            if serialized_goal.is_valid():
                serialized_goal.save()
                return Response(serialized_goal.data)
            return Response(serialized_goal.errors, status=s.HTTP_400_BAD_REQUEST)
        except MacroGoal.DoesNotExist:
            return Response(
                {"error": "No macro goals found to update!"},
                status=s.HTTP_404_NOT_FOUND,
            )
