import { useEffect, useState } from "react";
import { apiRequest } from "../api";
import type { Project, Task } from "../types";


function getNextStatuses(
  status: Task["status"]
) {
  const transitions: Record<
    Task["status"],
    Task["status"][]
  > = {
    BACKLOG: ["IN_PROGRESS"],
    IN_PROGRESS: [
      "IN_REVIEW",
      "BLOCKED",
    ],
    IN_REVIEW: [
      "DONE",
      "BLOCKED",
    ],
    BLOCKED: [],
    DONE: ["BACKLOG"],
  };

  return transitions[status];
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
  const [showCreate, setShowCreate] =useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] =useState("");
  const [project, setProject] = useState("");
  const [taskPriority, setTaskPriority] = useState("MEDIUM");
  const [dueDate, setDueDate] = useState("");
 

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
    
  }, [page, status, priority, overdue]);

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
              <h3>{task.title}</h3>

              <p>{task.description}</p>

              <span>
                {task.status}
              </span>

              {" · "}

              <span>
                {task.priority}
              </span>
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
    </div>
  );
}