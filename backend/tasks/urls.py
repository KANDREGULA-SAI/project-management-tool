from django.urls import path
from .views import (
    TaskListCreateView,
    MyAssignedTasksView,
    TaskDetailView,
    TaskTransitionView,
    
)


urlpatterns = [
    path("", TaskListCreateView.as_view(), name="task-list-create"),
    path(
        "assigned/",
        MyAssignedTasksView.as_view(),
        name="my-assigned-tasks",
    ),
    path("<int:pk>/", TaskDetailView.as_view(), name="task-detail"),
    path(
        "<int:pk>/transition/",
        TaskTransitionView.as_view(),
        name="task-transition",
    ),
    
]