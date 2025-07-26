from django.db import models
from django.utils.translation import gettext_lazy as _
from .base import BaseModel


class UserRole(models.Model):
    """
    Defines roles for users with different permission levels.
    
    Note: This model doesn't inherit from BaseModel as it uses name as primary key.
    """
    OWNER = 'Владелец'      # System owner/superuser with full access
    ADMIN = 'Администратор'      # Admin with elevated permissions
    MANAGER = 'Менеджер'  # Manager with some advanced permissions
    USER = 'Пользователь'        # Standard user with basic access
    
    ROLE_CHOICES = [
        (OWNER, _('Владелец')),
        (ADMIN, _('Администратор')),
        (MANAGER, _('Менеджер')),
        (USER, _('Пользователь')),
    ]
    
    name = models.CharField(max_length=20, choices=ROLE_CHOICES, primary_key=True)
    description = models.CharField(max_length=255)
    priority = models.IntegerField(unique=True, help_text="Меньшие числа имеют более высокий приоритет.")
    
    # Permissions
    can_manage_users = models.BooleanField(default=False)
    can_manage_system = models.BooleanField(default=False)
    can_manage_network = models.BooleanField(default=False)
    can_view_all_data = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['приоритет']
    
    def __str__(self):
        return self.get_name_display()
    
    @classmethod
    def create_default_roles(cls):
        """Создайте роли по умолчанию, если их нет."""
        defaults = [
            {
                'name': cls.OWNER,
                'description': 'Владелец системы с полными правами администратора',
                'priority': 1, 
                'can_manage_users': True,
                'can_manage_system': True,
                'can_manage_network': True,
                'can_view_all_data': True,
            },
            {
                'name': cls.ADMIN,
                'description': 'Администратор — администратор с повышенными правами доступа к системе.',
                'priority': 2,
                'can_manage_users': True,
                'can_manage_system': True,
                'can_manage_network': True,
                'can_view_all_data': True,
            },
            {
                'name': cls.MANAGER,
                'description': 'Менеджер с ограниченными административными привилегиями',
                'priority': 3,
                'can_manage_users': False,
                'can_manage_system': True,
                'can_manage_network': True,
                'can_view_all_data': True,
            },
            {
                'name': cls.USER,
                'description': 'Стандартный пользователь с базовым доступом',
                'priority': 4,
                'can_manage_users': False,
                'can_manage_system': False,
                'can_manage_network': False,
                'can_view_all_data': False,
            },
        ]
        
        for role_data in defaults:
            cls.objects.get_or_create(name=role_data['name'], defaults=role_data)
