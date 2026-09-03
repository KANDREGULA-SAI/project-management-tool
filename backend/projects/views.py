from django.tasks import task

from accounts.models import User

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Project
from .permissions import IsManager
from .serializers import ProjectSerializer


class ProjectListCreateView(generics.ListCreateAPIView):
    serializer_class = ProjectSerializer

    def get_queryset(self):
        user = self.request.user

        archived = self.request.query_params.get("archived")
        include_archived = self.request.query_params.get("include_archived")

        if user.role == "MANAGER":
            queryset = Project.objects.all()
        else:
            queryset = Project.objects.filter(members=user)

        if include_archived == "true":
            return queryset

        if archived == "true":
            return queryset.filter(is_archived=True)

        return queryset.filter(is_archived=False)


    def get_permissions(self):
        if self.request.method == "POST":
            return [IsManager()]

        return [IsAuthenticated()]
    def perform_create(self, serializer):
        project = serializer.save()
        project.members.add(project.owner)


class ProjectDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = ProjectSerializer

    def get_queryset(self):
        user = self.request.user

        if user.role == "MANAGER":
            return Project.objects.all()

        return Project.objects.filter(members=user)

    def get_permissions(self):
        if self.request.method in ["PUT", "PATCH"]:
            return [IsManager()]

        return [IsAuthenticated()]

class ArchiveProjectView(APIView):
    permission_classes = [IsManager]

    def patch(self, request, pk):
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            return Response(
                {"detail": "Project not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        project.is_archived = True
        project.save()

        return Response(
            {
                "message": "Project archived successfully.",
                "project": ProjectSerializer(project).data
            }
        )

class RestoreProjectView(APIView):
    permission_classes = [IsManager]

    def patch(self, request, pk):
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            return Response(
                {"detail": "Project not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        project.is_archived = False
        project.save()

        return Response(
            {
                "message": "Project restored successfully.",
                "project": ProjectSerializer(project).data
            }
        )

class ProjectMemberView(APIView):
    permission_classes = [IsManager]

    def post(self, request, pk):
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            return Response(
                {"detail": "Project not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        user_id = request.data.get("user_id")

        if not user_id:
            return Response(
                {"detail": "user_id is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        project.members.add(user)

        return Response(
            {
                "message": "Member added successfully.",
                "project": ProjectSerializer(project).data
            },
            status=status.HTTP_200_OK
        )

class RemoveProjectMemberView(APIView):
    permission_classes = [IsManager]

    def delete(self, request, pk, user_id):
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            return Response(
                {"detail": "Project not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if project.owner == user:
            return Response(
                {"detail": "Project owner cannot be removed from the project."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not project.members.filter(pk=user_id).exists():
            return Response(
                {"detail": "User is not a member of this project."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        for task in project.tasks.all():
            task.assignees.remove(user)

        project.members.remove(user)

        return Response(
            {
                "message": "Member removed successfully.",
                "project": ProjectSerializer(project).data
            }
        )