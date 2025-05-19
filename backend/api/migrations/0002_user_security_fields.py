"""
Database migration to add security fields to the User model.
This migration adds:
1. password_last_changed field to track when passwords were last changed
2. is_temporary_password flag to indicate if a password is temporary
3. last_login_ip field to track the IP used for login
"""
from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),  # Update this to match your last migration
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='password_last_changed',
            field=models.DateTimeField(
                default=django.utils.timezone.now,
                help_text='When the password was last changed',
                verbose_name='password last changed'
            ),
        ),
        migrations.AddField(
            model_name='user',
            name='is_temporary_password',
            field=models.BooleanField(
                default=False,
                help_text='Whether the current password is temporary and should be changed',
                verbose_name='temporary password'
            ),
        ),
        migrations.AddField(
            model_name='user',
            name='last_login_ip',
            field=models.GenericIPAddressField(
                blank=True,
                null=True,
                help_text='IP address of the last login',
                verbose_name='last login IP'
            ),
        ),
    ]
