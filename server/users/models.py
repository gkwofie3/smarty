from django.db import models

# Create your models here.
from django.db import models
from django.contrib.auth.models import AbstractUser
from helper.enums import USER_TYPE_CHOICES


class User(AbstractUser):
    
    # Using a single field for the full name as requested.
    full_name = models.CharField(
        max_length=250,
        blank=True,
        help_text='The full name of the user.'
    )
    bms_id = models.CharField(
        max_length=20,
        unique=True,
        null=True,
        blank=True,
        help_text='Unique ID for the BMS user.'
    )
    phone = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        help_text='Phone number for SMS notifications and contact.'
    )
    
    # Use a ChoiceField to define the user's administrative role.
    # This helps enforce strict user roles within the system.
    admin_type = models.CharField( max_length=20,blank=False,choices=USER_TYPE_CHOICES, default='admin', help_text='The administrative level of the user.')
    

    # Automatically track which user created a new account.
    # This is a self-referential foreign key.
    created_by = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_users',
        help_text='The user who created this account.'
    )

    is_verified = models.BooleanField(
        default=False,
        help_text='Designates whether the user\'s account is verified.'
    )

    # A

    def __str__(self):
        """
        A string representation of the user, useful for admin displays.
        """
        return self.username

class Token(models.Model):
   
    user = models.ForeignKey(User,on_delete=models.CASCADE,related_name='tokens')
    key = models.CharField(
        max_length=220,
        unique=True,
        help_text='The authentication token key.'
    )
    created = models.DateTimeField(
        auto_now_add=True,
        help_text='The date and time when the token was created.'
    )
    used = models.BooleanField(default=False)
    expired = models.BooleanField(default=False)