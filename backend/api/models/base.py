from django.db import models
import uuid


class BaseModel(models.Model):
    """
    Abstract base model that provides common fields for all models:
    - id: UUID primary key
    - created_at: timestamp when the record was created
    - updated_at: timestamp when the record was last updated
    
    This avoids duplication of these common fields across models
    and ensures consistent behavior.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
