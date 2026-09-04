from django.urls import path
from .views import (
    TaskListCreateView,
    TaskSearchView,
    MyAssignedTasksView,
    TaskBulkActionView,
    TaskExportView,
    TaskDetailView,
    TaskTransitionView,
    TaskCommentView,
    TaskHistoryView,
    
)


urlpatterns = [
    path("", TaskListCreateView.as_view(), name="task-list-create"),
    path("search/", TaskSearchView.as_view(), name="task-search"),
    path(
        "assigned/",
        MyAssignedTasksView.as_view(),
        name="my-assigned-tasks",
    ),
    path("bulk/", TaskBulkActionView.as_view(), name="task-bulk"),
    path("export/", TaskExportView.as_view(), name="task-export"),
    path(
        "<int:pk>/history/",
        TaskHistoryView.as_view(),
        name="task-history",
    ),
    path(
        "<int:pk>/comments/",
        TaskCommentView.as_view(),
        name="task-comment",
    ),
    path("<int:pk>/", TaskDetailView.as_view(), name="task-detail"),
    path(
        "<int:pk>/transition/",
        TaskTransitionView.as_view(),
        name="task-transition",
    ),
    
]