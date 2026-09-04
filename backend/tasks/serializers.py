from rest_framework import serializers
from .models import Task, TaskHistory, TaskAlert


class TaskSerializer(serializers.ModelSerializer):
    created_by_email = serializers.EmailField(
        source="created_by.email",
        read_only=True
    )

    class Meta:
        model = Task
        fields = [
            "id",
            "project",
            "title",
            "description",
            "priority",
            "status",
            "previous_status",
            "due_date",
            "blocking_tasks",
            "assignees",
            "created_by",
            "created_by_email",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_by",
            "created_by_email",
            "status",
            "previous_status",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        project = attrs.get("project")

        if project is None and self.instance:
            project = self.instance.project

        assignees = attrs.get("assignees")

        if assignees is not None:
            project_member_ids = set(
                project.members.values_list("id", flat=True)
            )

            invalid_users = [
                user.email
                for user in assignees
                if user.id not in project_member_ids
            ]

            if invalid_users:
                raise serializers.ValidationError(
                    {
                        "assignees": (
                            "All assignees must be members "
                            "of the task's project."
                        )
                    }
                )

        return attrs

class TaskHistorySerializer(serializers.ModelSerializer):
    actor_email = serializers.EmailField(
        source="actor.email",
        read_only=True,
    )

    class Meta:
        model = TaskHistory
        fields = [
            "id",
            "task",
            "actor",
            "actor_email",
            "action",
            "field",
            "old_value",
            "new_value",
            "comment",
            "created_at",
        ]
        read_only_fields = fields

class TaskAlertSerializer(serializers.ModelSerializer):
    task_title = serializers.CharField(
        source="task.title",
        read_only=True,
    )

    class Meta:
        model = TaskAlert
        fields = [
            "id",
            "task",
            "task_title",
            "user",
            "dismissed",
            "created_at",
            "dismissed_at",
        ]
        read_only_fields = fields