from django.urls import path

from .views import (
    ArchiveProjectView,
    ProjectDetailView,
    ProjectListCreateView,
    ProjectMemberView,
    RemoveProjectMemberView,
    RestoreProjectView,
)


urlpatterns = [
    path("", ProjectListCreateView.as_view(), name="project-list-create"),
    path("<int:pk>/", ProjectDetailView.as_view(), name="project-detail"),
    path("<int:pk>/archive/", ArchiveProjectView.as_view(), name="project-archive"),
    path("<int:pk>/restore/", RestoreProjectView.as_view(), name="project-restore"),

    path("<int:pk>/members/", ProjectMemberView.as_view(), name="project-add-member"),
    path("<int:pk>/members/<int:user_id>/", RemoveProjectMemberView.as_view(), name="project-remove-member"),
]