from rest_framework import generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from .models import Task
from .serializers import TaskSerializer


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
            serializer.save(created_by=user)
            return

        if not project.members.filter(id=user.id).exists():
            raise PermissionDenied(
                "You can only create tasks in projects you belong to."
            )

        serializer.save(created_by=user)


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