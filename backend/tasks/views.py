from collections import Counter
from datetime import timedelta

import csv
from django.http import HttpResponse
from django.tasks import task
from .filters import get_task_queryset
from django.db.models import Q, Count
from django.utils import timezone

from rest_framework import generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from .models import Task, TaskHistory, TaskAlert
from .serializers import TaskAlertSerializer, TaskHistorySerializer, TaskSerializer
from .pagination import TaskPagination


class TaskListCreateView(generics.ListCreateAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user

        if user.role == "MANAGER":
            return Task.objects.all()

        return Task.objects.filter(
            project__members=user
        ).distinct()

    def perform_create(self, serializer):
        user = self.request.user
        project = serializer.validated_data["project"]

        if user.role == "MANAGER":
            task = serializer.save(created_by=user)

            TaskHistory.objects.create(
                task=task,
                actor=user,
                action=TaskHistory.Action.CREATED,
            )
            return

        if not project.members.filter(id=user.id).exists():
            raise PermissionDenied(
                "You can only create tasks in projects you belong to."
            )

        task = serializer.save(created_by=user)

        TaskHistory.objects.create(
            task=task,
            actor=user,
            action=TaskHistory.Action.CREATED,
        )


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == "MANAGER":
            return Task.objects.all()

        return Task.objects.filter(
            project__members=user
        ).distinct()

    def perform_update(self, serializer):
        task = self.get_object()

        old_values = {
            "project": task.project_id,
            "title": task.title,
            "description": task.description,
            "priority": task.priority,
            "due_date": task.due_date,
            "assignees": set(
                task.assignees.values_list("id", flat=True)
            ),
        }

        updated_task = serializer.save()
        if "due_date" in self.request.data:
            TaskAlert.objects.filter(
                task=updated_task
            ).update(
                dismissed=False,
                dismissed_at=None,
            )

        fields_to_check = [
            "project",
            "title",
            "description",
            "priority",
            "due_date",
        ]

        for field in fields_to_check:
            old_value = old_values[field]
            new_value = getattr(updated_task, field)

            if old_value != new_value:
                TaskHistory.objects.create(
                    task=updated_task,
                    actor=self.request.user,
                    action=TaskHistory.Action.UPDATED,
                    field=field,
                    old_value=str(old_value),
                    new_value=str(new_value),
                )

        old_assignees = old_values["assignees"]
        new_assignees = set(
            updated_task.assignees.values_list("id", flat=True)
        )

        for user_id in new_assignees - old_assignees:
            TaskHistory.objects.create(
                task=updated_task,
                actor=self.request.user,
                action=TaskHistory.Action.ASSIGNED,
                field="assignees",
                new_value=str(user_id),
            )

        for user_id in old_assignees - new_assignees:
            TaskHistory.objects.create(
                task=updated_task,
                actor=self.request.user,
                action=TaskHistory.Action.UNASSIGNED,
                field="assignees",
                old_value=str(user_id),
            )

    def perform_destroy(self, instance):
        if self.request.user.role != "MANAGER":
            raise PermissionDenied(
                "Only managers can delete tasks."
            )

        instance.delete()

class TaskTransitionView(generics.GenericAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == "MANAGER":
            return Task.objects.all()

        return Task.objects.filter(
            project__members=user
        ).distinct()

    def post(self, request, pk):
        task = self.get_object()

        new_status = request.data.get("status")

        if not new_status:
            return Response(
                {"detail": "status is required."},
                status=400,
            )

        valid_statuses = {
            Task.Status.BACKLOG,
            Task.Status.IN_PROGRESS,
            Task.Status.IN_REVIEW,
            Task.Status.BLOCKED,
            Task.Status.DONE,
        }

        if new_status not in valid_statuses:
            return Response(
                {"detail": "Invalid status."},
                status=400,
            )

        old_status = task.status

        # Same status
        if new_status == old_status:
            return Response(
                {"detail": "Task is already in this status."},
                status=400,
            )

        # Going to BLOCKED
        if new_status == Task.Status.BLOCKED:
            if old_status not in [
                Task.Status.IN_PROGRESS,
                Task.Status.IN_REVIEW,
            ]:
                return Response(
                    {
                        "detail": (
                            "A task can only be blocked from "
                            "In Progress or In Review."
                        )
                    },
                    status=400,
                )

            task.previous_status = old_status
            task.status = Task.Status.BLOCKED
            task.save()

            return Response(TaskSerializer(task).data)

        # Leaving BLOCKED
        if old_status == Task.Status.BLOCKED:
            if task.previous_status not in [
                Task.Status.IN_PROGRESS,
                Task.Status.IN_REVIEW,
            ]:
                return Response(
                    {
                        "detail": (
                            "Blocked task does not have a valid "
                            "previous status."
                        )
                    },
                    status=400,
                )

            if new_status != task.previous_status:
                return Response(
                    {
                        "detail": (
                            "A blocked task can only return to "
                            "its previous status."
                        )
                    },
                    status=400,
                )

            task.status = new_status
            task.previous_status = None
            task.save()

            return Response(TaskSerializer(task).data)

        # A task cannot be marked DONE
        # while any blocking task is unfinished.
        if new_status == Task.Status.DONE:
            unfinished_blockers = task.blocking_tasks.exclude(
                status=Task.Status.DONE
            )

            if unfinished_blockers.exists():
                return Response(
                    {
                        "detail": (
                            "Task cannot be marked as Done because "
                            "one or more blocking tasks are unfinished."
                        )
                    },
                    status=400,
                )

        # Normal lifecycle transitions
        allowed_transitions = {
            Task.Status.BACKLOG: [
                Task.Status.IN_PROGRESS,
            ],
            Task.Status.IN_PROGRESS: [
                Task.Status.IN_REVIEW,
                Task.Status.BLOCKED,
            ],
            Task.Status.IN_REVIEW: [
                Task.Status.DONE,
                Task.Status.BLOCKED,
            ],
            Task.Status.DONE: [
                Task.Status.BACKLOG,
            ],
        }

        if new_status not in allowed_transitions.get(old_status, []):
            return Response(
                {
                    "detail": (
                        f"Cannot move task from "
                        f"{old_status} to {new_status}."
                    )
                },
                status=400,
            )

        task.status = new_status
        task.save()

        return Response(TaskSerializer(task).data)

class MyAssignedTasksView(generics.ListAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(
            assignees=self.request.user,
            project__members=self.request.user,
            project__is_archived=False,
        ).distinct()

class TaskSearchView(generics.ListAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = TaskPagination

    def get_queryset(self):
        return get_task_queryset(
            self.request.user,
            self.request.query_params,
        )

class TaskBulkActionView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        task_ids = request.data.get("task_ids", [])

        if not task_ids:
            return Response(
                {"detail": "task_ids is required."},
                status=400,
            )

        fields = [
            field
            for field in ["status", "assignee", "due_date"]
            if field in request.data
        ]

        if len(fields) != 1:
            return Response(
                {
                    "detail": (
                        "Provide exactly one of: "
                        "status, assignee, due_date."
                    )
                },
                status=400,
            )

        field = fields[0]
        value = request.data.get(field)

        results = []

        for task_id in task_ids:
            try:
                task = Task.objects.get(pk=task_id)
            except Task.DoesNotExist:
                results.append({
                    "task_id": task_id,
                    "success": False,
                    "reason": "Task not found.",
                })
                continue

            # Access check
            if request.user.role != "MANAGER":
                if not task.project.members.filter(
                    id=request.user.id
                ).exists():
                    results.append({
                        "task_id": task_id,
                        "success": False,
                        "reason": "You do not have access to this task.",
                    })
                    continue

            if task.project.is_archived:
                results.append({
                    "task_id": task_id,
                    "success": False,
                    "reason": "Task belongs to an archived project.",
                })
                continue

            # -------------------------
            # STATUS
            # -------------------------
            if field == "status":
                if value not in {
                    Task.Status.BACKLOG,
                    Task.Status.IN_PROGRESS,
                    Task.Status.IN_REVIEW,
                    Task.Status.BLOCKED,
                    Task.Status.DONE,
                }:
                    results.append({
                        "task_id": task_id,
                        "success": False,
                        "reason": "Invalid status.",
                    })
                    continue

                old_status = task.status

                if value == old_status:
                    results.append({
                        "task_id": task_id,
                        "success": False,
                        "reason": "Task is already in this status.",
                    })
                    continue

                if value == Task.Status.BLOCKED:
                    if old_status not in [
                        Task.Status.IN_PROGRESS,
                        Task.Status.IN_REVIEW,
                    ]:
                        results.append({
                            "task_id": task_id,
                            "success": False,
                            "reason": (
                                "A task can only be blocked from "
                                "In Progress or In Review."
                            ),
                        })
                        continue

                    task.previous_status = old_status
                    task.status = Task.Status.BLOCKED
                    task.save()

                elif old_status == Task.Status.BLOCKED:
                    if value != task.previous_status:
                        results.append({
                            "task_id": task_id,
                            "success": False,
                            "reason": (
                                "A blocked task can only return "
                                "to its previous status."
                            ),
                        })
                        continue

                    task.status = value
                    task.previous_status = None
                    task.save()

                else:
                    if value == Task.Status.DONE:
                        unfinished_blockers = (
                            task.blocking_tasks.exclude(
                                status=Task.Status.DONE
                            )
                        )

                        if unfinished_blockers.exists():
                            results.append({
                                "task_id": task_id,
                                "success": False,
                                "reason": (
                                    "Task cannot be marked as Done "
                                    "because one or more blocking "
                                    "tasks are unfinished."
                                ),
                            })
                            continue

                    allowed_transitions = {
                        Task.Status.BACKLOG: [
                            Task.Status.IN_PROGRESS,
                        ],
                        Task.Status.IN_PROGRESS: [
                            Task.Status.IN_REVIEW,
                            Task.Status.BLOCKED,
                        ],
                        Task.Status.IN_REVIEW: [
                            Task.Status.DONE,
                            Task.Status.BLOCKED,
                        ],
                        Task.Status.DONE: [
                            Task.Status.BACKLOG,
                        ],
                    }

                    if value not in allowed_transitions.get(
                        old_status, []
                    ):
                        results.append({
                            "task_id": task_id,
                            "success": False,
                            "reason": (
                                f"Cannot move task from "
                                f"{old_status} to {value}."
                            ),
                        })
                        continue

                    task.status = value
                    task.save()

            # -------------------------
            # ASSIGNEE
            # -------------------------
            elif field == "assignee":
                try:
                    user = task.project.members.get(pk=value)
                except Exception:
                    results.append({
                        "task_id": task_id,
                        "success": False,
                        "reason": (
                            "Assignee must be a member "
                            "of the project."
                        ),
                    })
                    continue

                task.assignees.add(user)

            # -------------------------
            # DUE DATE
            # -------------------------
            elif field == "due_date":
                task.due_date = value
                task.save()

            results.append({
                "task_id": task_id,
                "success": True,
            })

        return Response({"results": results})

class TaskExportView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = get_task_queryset(
            request.user,
            request.query_params,
        )

        response = HttpResponse(
            content_type="text/csv"
        )
        response["Content-Disposition"] = (
            'attachment; filename="tasks.csv"'
        )

        writer = csv.writer(response)

        writer.writerow([
            "id",
            "project",
            "title",
            "description",
            "priority",
            "status",
            "due_date",
        ])

        for task in queryset:
            writer.writerow([
                task.id,
                task.project_id,
                task.title,
                task.description,
                task.priority,
                task.status,
                task.due_date,
            ])

        return response

class TaskCommentView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == "MANAGER":
            return Task.objects.all()

        return Task.objects.filter(
            project__members=user
        ).distinct()

    def post(self, request, pk):
        task = self.get_queryset().filter(pk=pk).first()

        if task is None:
            return Response(
                {"detail": "Task not found."},
                status=404,
            )

        comment = request.data.get("comment")

        if not comment:
            return Response(
                {"detail": "comment is required."},
                status=400,
            )

        history = TaskHistory.objects.create(
            task=task,
            actor=request.user,
            action=TaskHistory.Action.COMMENTED,
            comment=comment,
        )

        return Response(
            TaskHistorySerializer(history).data,
            status=201,
        )

class TaskHistoryView(generics.ListAPIView):
    serializer_class = TaskHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == "MANAGER":
            return TaskHistory.objects.filter(
                task__project__is_archived=False
            ).select_related(
                "actor",
                "task",
            )

        return TaskHistory.objects.filter(
            task__project__members=user,
            task__project__is_archived=False,
        ).select_related(
            "actor",
            "task",
        ).distinct()

    def get(self, request, pk):
        queryset = self.get_queryset().filter(task_id=pk)

        if not queryset.exists():
            # Check whether task exists but user has no access.
            if not Task.objects.filter(pk=pk).exists():
                return Response(
                    {"detail": "Task not found."},
                    status=404,
                )

            return Response(
                {"detail": "Task not found."},
                status=404,
            )

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class TaskAlertView(generics.ListAPIView):
    serializer_class = TaskAlertSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        now = timezone.now()

        overdue_tasks = Task.objects.filter(
            assignees=user,
            project__members=user,
            project__is_archived=False,
            due_date__lt=now,
        ).exclude(
            status=Task.Status.DONE
        )

        for task in overdue_tasks:
            TaskAlert.objects.get_or_create(
                task=task,
                user=user,
            )

        return TaskAlert.objects.filter(
            user=user,
            dismissed=False,
            task__project__is_archived=False,
            task__due_date__lt=now,
        ).exclude(
            task__status=Task.Status.DONE
        ).select_related("task")

class TaskAlertDismissView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        alert = TaskAlert.objects.filter(
            pk=pk,
            user=request.user,
        ).first()

        if alert is None:
            return Response(
                {"detail": "Alert not found."},
                status=404,
            )

        alert.dismissed = True
        alert.dismissed_at = timezone.now()
        alert.save()

        return Response(
            {"detail": "Alert dismissed."}
        )

class TaskDashboardView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.role == "MANAGER":
            queryset = Task.objects.filter(
                project__is_archived=False
            )
        else:
            queryset = Task.objects.filter(
                project__members=user,
                project__is_archived=False,
            ).distinct()

        now = timezone.now()

        # Start of current week (Monday)
        week_start = now - timedelta(days=now.weekday())
        week_start = week_start.replace(
            hour=0,
            minute=0,
            second=0,
            microsecond=0,
        )

        week_end = week_start + timedelta(days=7)

        # Basic counts
        open_count = queryset.exclude(
            status=Task.Status.DONE
        ).count()

        overdue_count = queryset.filter(
            due_date__lt=now
        ).exclude(
            status=Task.Status.DONE
        ).count()

        due_this_week_count = queryset.filter(
            due_date__gte=now,
            due_date__lt=week_end,
        ).exclude(
            status=Task.Status.DONE
        ).count()

        completed_this_week_count = TaskHistory.objects.filter(
            task__in=queryset,
            action=TaskHistory.Action.UPDATED,
            field="status",
            new_value=Task.Status.DONE,
            created_at__gte=week_start,
            created_at__lt=week_end,
        ).count()

        # Status breakdown
        status_data = queryset.values(
            "status"
        ).annotate(
            count=Count("id")
        )

        status_breakdown = {
            item["status"]: item["count"]
            for item in status_data
        }

        # Assignee breakdown
        assignee_data = (
            queryset
            .values(
                "assignees__id",
                "assignees__email",
            )
            .annotate(
                count=Count("id", distinct=True)
            )
        )

        assignee_breakdown = [
            {
                "user_id": item["assignees__id"],
                "email": item["assignees__email"],
                "count": item["count"],
            }
            for item in assignee_data
            if item["assignees__id"] is not None
        ]

        # Completions over last 8 weeks
        completions_last_8_weeks = []

        for weeks_ago in range(7, -1, -1):
            start = week_start - timedelta(
                weeks=weeks_ago
            )
            end = start + timedelta(days=7)

            count = TaskHistory.objects.filter(
                task__in=queryset,
                action=TaskHistory.Action.UPDATED,
                field="status",
                new_value=Task.Status.DONE,
                created_at__gte=start,
                created_at__lt=end,
            ).count()

            completions_last_8_weeks.append({
                "week_start": start.date().isoformat(),
                "count": count,
            })

        return Response({
            "open": open_count,
            "overdue": overdue_count,
            "due_this_week": due_this_week_count,
            "completed_this_week": completed_this_week_count,
            "status_breakdown": status_breakdown,
            "assignee_breakdown": assignee_breakdown,
            "completions_last_8_weeks": completions_last_8_weeks,
        })
