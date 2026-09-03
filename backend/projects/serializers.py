from rest_framework import serializers

from .models import Project


class ProjectSerializer(serializers.ModelSerializer):
    owner_email = serializers.EmailField(
        source="owner.email",
        read_only=True
    )

    class Meta:
        model = Project
        fields = [
            "id",
            "key",
            "name",
            "description",
            "owner",
            "owner_email",
            "members",
            "is_archived",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]