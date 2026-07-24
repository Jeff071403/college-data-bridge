from django.db import models

class Permission(models.Model):
    name = models.CharField(max_length=150)
    codename = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.codename})"
