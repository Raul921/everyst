from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()

class Command(BaseCommand):
    help = 'Set password for a user'

    def handle(self, *args, **options):
        user = User.objects.get(email='admin@example.com')
        user.set_password('everest2025')
        user.save()
        self.stdout.write(self.style.SUCCESS(f'Successfully set password for {user.email}'))
