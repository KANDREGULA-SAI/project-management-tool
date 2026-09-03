from django.conf import settings
from django.db import models


class Task(models.Model):

    class Status(models.TextChoices):
        BACKLOG = "BACKLOG", "Backlog"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        IN_REVIEW = "IN_REVIEW", "In Review"
        BLOCKED = "BLOCKED", "Blocked"
        DONE = "DONE", "Done"

    class Priority(models.TextChoices):
        LOW = "LOW", "Low"
        MEDIUM = "MEDIUM", "Medium"
        HIGH = "HIGH", "High"

    project = models.ForeignKey(
        "projects.Project",
        on_delete=models.CASCADE,
        related_name="tasks",
    )

    title = models.CharField(max_length=255)

    description = models.TextField(blank=True)

    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.MEDIUM,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.BACKLOG,
    )

    previous_status = models.CharField(
    max_length=20,
    choices=Status.choices,
    null=True,
    blank=True,
    )

    due_date = models.DateTimeField(
        null=True,
        blank=True,
    )

    blocking_tasks = models.ManyToManyField(
        "self",
        symmetrical=False,
        blank=True,
        related_name="blocked_tasks",
    )

    assignees = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="assigned_tasks",
        blank=True,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="created_tasks",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title