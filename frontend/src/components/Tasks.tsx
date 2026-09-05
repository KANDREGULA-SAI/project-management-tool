import { useEffect, useState } from "react";
import { apiRequest } from "../api";
import type { Task } from "../types";
import TaskDetails from "./TaskDetails";

function getNextStatuses(task: Task) {
  const transitions: Record<
    Task["status"],
    Task["status"][]
  > = {
    BACKLOG: ["IN_PROGRESS"],
    IN_PROGRESS: ["IN_REVIEW", "BLOCKED"],
    IN_REVIEW: ["DONE", "BLOCKED"],
    BLOCKED: [],
    DONE: ["BACKLOG"],
  };

  if (task.status === "BLOCKED" && task.previous_status) {
    return [task.previous_status as Task["status"]];
  }

  return transitions[task.status];
}

export default function Tasks() {  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [overdue, setOverdue] = useState(false);
  const [sort, setSort] = useState("-updated_at");
  const [showCreate, setShowCreate] =useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] =useState("");
  const [project, setProject] = useState("");
 
  const [dueDate, setDueDate] = useState("");
  const [selectedTask, setSelectedTask] = useState<number | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkAssignee, setBulkAssignee] = useState("");
  const [bulkDueDate, setBulkDueDate] = useState("");
  const [bulkMessage, setBulkMessage] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  

  async function loadTasks() {
    setLoading(true);
    setError("");
  
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("page_size", "10");
      

      if (search) {
        params.set("search", search);
      }

      if (status) {
        params.set("status", status);
      }

      if (priority) {
        params.set("priority", priority);
      }

      if (overdue) {
        params.set("overdue", "true");
      }
      const data = await apiRequest(
        `/tasks/search/?${params.toString()}`
      );

      setTasks(data.results);
      setTotal(data.count);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load tasks"
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadProjects() {
    try {
        const data = await apiRequest("/projects/");
        setProjects(data);
    } catch (err) {
        setError(
        err instanceof Error
            ? err.message
            : "Failed to load projects"
        );
    }
  }

  function toggleTaskSelection(taskId: number) {
    setSelectedTasks((current) =>
        current.includes(taskId)
        ? current.filter((id) => id !== taskId)
        : [...current, taskId]
    );
  }

  function toggleSelectAll() {
    if (selectedTasks.length === tasks.length) {
        setSelectedTasks([]);
    } else {
        setSelectedTasks(tasks.map((task) => task.id));
    }
  }

  async function applyBulkAction() {
    if (selectedTasks.length === 0) {
        setBulkMessage("Select at least one task.");
        return;
    }

    if (!bulkStatus && !bulkAssignee && !bulkDueDate) {
        setBulkMessage("Choose one bulk action.");
        return;
    }

    const selectedCount = [
        bulkStatus,
        bulkAssignee,
        bulkDueDate,
    ].filter(Boolean).length;

    if (selectedCount > 1) {
        setBulkMessage("Choose only one bulk action at a time.");
        return;
    }

    try {
        setBulkLoading(true);
        setBulkMessage("");

        const body: Record<string, unknown> = {
        task_ids: selectedTasks,
        };

        if (bulkStatus) {
        body.status = bulkStatus;
        } else if (bulkAssignee) {
        body.assignee = Number(bulkAssignee);
        } else if (bulkDueDate) {
        body.due_date = bulkDueDate;
        }

        const result = await apiRequest("/tasks/bulk/", {
        method: "POST",
        body: JSON.stringify(body),
        });

        const successCount = result.results.filter(
        (item: { success: boolean }) => item.success
        ).length;

        const failedCount = result.results.length - successCount;

        setBulkMessage(
        `${successCount} succeeded, ${failedCount} rejected.`
        );

        setSelectedTasks([]);
        setBulkStatus("");
        setBulkAssignee("");
        setBulkDueDate("");

        await loadTasks();
    } catch (err) {
        setBulkMessage(
        err instanceof Error ? err.message : "Bulk action failed"
        );
    } finally {
        setBulkLoading(false);
    }
  }

  async function exportCsv() {
    const token = localStorage.getItem("access_token");

    const params = new URLSearchParams();

    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    if (overdue) params.set("overdue", "true");
    if (sort) params.set("sort", sort);

    const response = await fetch(
        `http://127.0.0.1:8000/api/tasks/export/?${params.toString()}`,
        {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        }
    );

    if (!response.ok) {
        setBulkMessage("CSV export failed.");
        return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "tasks.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
    }

  async function createTask(
    event: React.FormEvent
    ) {
    event.preventDefault();

    try {
        await apiRequest("/tasks/", {
        method: "POST",
        body: JSON.stringify({
            project: Number(project),
            title,
            description,
            priority,
            due_date: dueDate || null,
        }),
        });

        setTitle("");
        setDescription("");
        setProject("");
        setPriority("MEDIUM");
        setDueDate("");
        setShowCreate(false);

        await loadTasks();
    } catch (err) {
        setError(
        err instanceof Error
            ? err.message
            : "Failed to create task"
        );
    }
  }

  async function transitionTask(
    taskId: number,
    status: Task["status"]
    ) {
    try {
        await apiRequest(
        `/tasks/${taskId}/transition/`,
        {
            method: "POST",
            body: JSON.stringify({
            status,
            }),
        }
        );

        await loadTasks();
    } catch (err) {
        setError(
        err instanceof Error
            ? err.message
            : "Transition failed"
        );
    }
  }


  useEffect(() => {
    loadTasks();
    
  }, [page, status, priority, overdue, sort]);

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>Tasks</h1>

        <button
            onClick={() =>
            setShowCreate((value) => !value)
            }
        >
            {showCreate ? "Cancel" : "New Task"}
        </button>
        </div>

        {showCreate && (
        <form
            className="form-card"
            onSubmit={createTask}
        >
            <h3>Create Task</h3>

            <select
            value={project}
            onChange={(e) =>
                setProject(e.target.value)
            }
            required
            >
            <option value="">
                Select project
            </option>

            {projects.map((item) => (
                <option
                key={item.id}
                value={item.id}
                >
                {item.key} — {item.name}
                </option>
            ))}
            </select>

            <input
            placeholder="Task title"
            value={title}
            onChange={(e) =>
                setTitle(e.target.value)
            }
            required
            />

            <textarea
            placeholder="Description"
            value={description}
            onChange={(e) =>
                setDescription(e.target.value)
            }
            />

            <select
            value={priority}
            onChange={(e) =>
                setPriority(e.target.value)
            }
            >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            </select>

            <select
                value={sort}
                onChange={(event) => {
                    setSort(event.target.value);
                    setPage(1);
                }}
                >
                <option value="-updated_at">Recently updated</option>
                <option value="updated_at">Least recently updated</option>
                <option value="due_date">Due date</option>
                <option value="-due_date">Latest due date</option>
                <option value="priority">Priority</option>
                <option value="-priority">Priority descending</option>
                </select>
            <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) =>
                setDueDate(e.target.value)
            }
            />

            <button type="submit">
            Create Task
            </button>
        </form>
        )}

      <input
        placeholder="Search tasks..."
        value={search}
        onChange={(event) =>
          setSearch(event.target.value)
        }
      />

      <select
        value={status}
        onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
        }}
        >
        <option value="">All statuses</option>
        <option value="BACKLOG">Backlog</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="IN_REVIEW">In Review</option>
        <option value="BLOCKED">Blocked</option>
        <option value="DONE">Done</option>
        </select>

        <select
        value={priority}
        onChange={(event) => {
            setPriority(event.target.value);
            setPage(1);
        }}
        >
        <option value="">All priorities</option>
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
        </select>

        <label>
        <input
            type="checkbox"
            checked={overdue}
            onChange={(event) => {
            setOverdue(event.target.checked);
            setPage(1);
            }}
        />
        Overdue
        </label>

        <button type="button" onClick={exportCsv}>
            Export CSV
        </button>

      <div className="bulk-actions">
        <div>
            <label>
            <input
                type="checkbox"
                checked={tasks.length > 0 && selectedTasks.length === tasks.length}
                onChange={toggleSelectAll}
            />
            Select all
            </label>

            <span>
            {selectedTasks.length} selected
            </span>
        </div>

        <select
            value={bulkStatus}
            onChange={(e) => {
            setBulkStatus(e.target.value);
            setBulkAssignee("");
            setBulkDueDate("");
            }}
        >
            <option value="">Change status...</option>
            <option value="BACKLOG">Backlog</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="BLOCKED">Blocked</option>
            <option value="DONE">Done</option>
        </select>

        <input
            type="number"
            placeholder="Assignee user ID"
            value={bulkAssignee}
            onChange={(e) => {
            setBulkAssignee(e.target.value);
            setBulkStatus("");
            setBulkDueDate("");
            }}
        />

        <input
            type="datetime-local"
            value={bulkDueDate}
            onChange={(e) => {
            setBulkDueDate(e.target.value);
            setBulkStatus("");
            setBulkAssignee("");
            }}
        />

        <button
            type="button"
            onClick={applyBulkAction}
            disabled={bulkLoading || selectedTasks.length === 0}
        >
            {bulkLoading ? "Applying..." : "Apply"}
        </button>

        {bulkMessage && <span>{bulkMessage}</span>}
        </div>
        
        {error && (
            <p className="error">{error}</p>
        )}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          {tasks.map((task) => (
            <div
              key={task.id}
              className="task-card"
            >
              <input
                type="checkbox"
                checked={selectedTasks.includes(task.id)}
                onChange={() => toggleTaskSelection(task.id)}
                />
              <h3>{task.title}</h3>

              <p>{task.description}</p>

              <span>
                {task.status}
              </span>

              {" · "}

              <span>
                {task.priority}
              </span>

              <button
                onClick={() =>
                    setSelectedTask(task.id)
                }
                >
                View Details
              </button>
              <div className="task-actions">
                {getNextStatuses(task).map(
                    (nextStatus) => (
                    <button
                        key={nextStatus}
                        onClick={() =>
                        transitionTask(
                            task.id,
                            nextStatus
                        )
                        }
                    >
                        → {nextStatus === "IN_PROGRESS"
                            ? "Unblock → In Progress"
                            : nextStatus === "IN_REVIEW"
                            ? "Unblock → In Review"
                            : nextStatus}
                    </button>
                    )
                )}
                </div>
            </div>
          ))}
        </div>
      )}
      <div className="pagination">
        <button
            disabled={page === 1}
            onClick={() =>
            setPage((current) => current - 1)
            }
        >
            Previous
        </button>

        <span>
            Page {page}
        </span>

        <button
            disabled={page * 10 >= total}
            onClick={() =>
            setPage((current) => current + 1)
            }
        >
            Next
        </button>
        </div>
        {selectedTask !== null && (
            <TaskDetails
                taskId={selectedTask}
                onClose={() =>
                setSelectedTask(null)
                }
                onUpdated={loadTasks}
            />
        )}
    </div>
  );
}