from django.db import models
from django.contrib.auth.models import AbstractUser


# Create your models here.
class Account(AbstractUser):
    email = models.EmailField(verbose_name="email_address", max_length=255, unique=True)
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]
