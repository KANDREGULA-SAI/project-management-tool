import { useEffect, useState } from "react";
import { apiRequest } from "../api";
import type { Task } from "../types";

export default function MyTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadTasks() {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest("/tasks/assigned/");
      setTasks(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load assigned tasks"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My Tasks ({tasks.length})</h1>
          <p>Tasks assigned to you across your projects.</p>
        </div>

        <button type="button" onClick={loadTasks}>
          Refresh
        </button>
      </div>

      {error && (
        <p className="error">{error}</p>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <h3>No assigned tasks</h3>
          <p>You currently have no tasks assigned to you.</p>
        </div>
      ) : (
        <div className="my-task-list">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="my-task-card"
            >
              <div>
                <h3>{task.title}</h3>

                <p>{task.description}</p>

                <div className="my-task-meta">
                  <span>
                    Project #{task.project}
                  </span>

                  <span>
                    {task.status}
                  </span>

                  <span>
                    {task.priority}
                  </span>

                  {task.due_date && (
                    <span>
                      Due:{" "}
                      {new Date(
                        task.due_date
                      ).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}