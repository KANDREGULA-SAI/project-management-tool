from django.db.models import Q
from django.utils import timezone

from .models import Task


def get_task_queryset(user, params):
    if user.role == "MANAGER":
        queryset = Task.objects.filter(
            project__is_archived=False
        )
    else:
        queryset = Task.objects.filter(
            project__members=user,
            project__is_archived=False,
        ).distinct()

    search = params.get("search")
    if search:
        queryset = queryset.filter(
            Q(title__icontains=search)
            | Q(description__icontains=search)
        )

    project = params.get("project")
    if project:
        queryset = queryset.filter(project_id=project)

    status = params.get("status")
    if status:
        queryset = queryset.filter(status=status)

    assignee = params.get("assignee")
    if assignee:
        queryset = queryset.filter(assignees__id=assignee)

    priority = params.get("priority")
    if priority:
        queryset = queryset.filter(priority=priority)

    overdue = params.get("overdue")
    if overdue == "true":
        queryset = queryset.filter(
            due_date__lt=timezone.now()
        ).exclude(
            status=Task.Status.DONE
        )

    sort = params.get("sort", "-updated_at")

    allowed_sorts = {
        "due_date": "due_date",
        "-due_date": "-due_date",
        "priority": "priority",
        "-priority": "-priority",
        "updated_at": "updated_at",
        "-updated_at": "-updated_at",
    }

    queryset = queryset.order_by(
        allowed_sorts.get(sort, "-updated_at")
    )

    return queryset