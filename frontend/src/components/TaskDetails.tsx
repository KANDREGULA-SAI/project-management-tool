import { useEffect, useState } from "react";
import { apiRequest } from "../api";
import type { Task } from "../types";

type HistoryItem = {
  id: number;
  actor: number;
  actor_email: string;
  action: string;
  field: string;
  old_value: string;
  new_value: string;
  comment: string;
  created_at: string;
}; 

type Props = {
  taskId: number;
  onClose: () => void;
  onUpdated: () => void;
};

export default function TaskDetails({
  taskId,
  onClose,
  onUpdated,
}: Props) {
  const [task, setTask] = useState<Task | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");
  const [members, setMembers] =useState<number[]>([]);
  const [selectedMember, setSelectedMember] =useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  async function loadTask() {
    try {
      const data = await apiRequest(
        `/tasks/${taskId}/`
      );

      setTask(data);
      setTitle(data.title);
      setDescription(data.description);
      setPriority(data.priority);

      const project = await apiRequest(
        `/projects/${data.project}/`
      );

      setMembers(project.members);

      if (data.due_date) {
        setDueDate(
          data.due_date.slice(0, 16)
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load task"
      );
    }
  }

  async function loadHistory() {
    try {
        const data = await apiRequest(`/tasks/${taskId}/history/`);
        setHistory(data);
    } catch (err) {
        setError(
        err instanceof Error ? err.message : "Failed to load task history"
        );
    }
  }

  useEffect(() => {
    if (taskId) {
      loadTask();
      loadHistory();
    }
  }, [taskId]);

  async function addComment() {
    if (!comment.trim()) {
        setCommentError("Comment cannot be empty.");
        return;
    }

    setCommentLoading(true);
    setCommentError("");

    try {
        await apiRequest(`/tasks/${taskId}/comments/`, {
        method: "POST",
        body: JSON.stringify({
            comment: comment.trim(),
        }),
        });

        setComment("");
        await loadHistory();
    } catch (err) {
        setCommentError(
        err instanceof Error ? err.message : "Failed to add comment"
        );
    } finally {
        setCommentLoading(false);
    }
  }


  async function updateTask(
    event: React.FormEvent
  ) {
    event.preventDefault();

    try {
      await apiRequest(
        `/tasks/${taskId}/`,
        {
          method: "PATCH",
          body: JSON.stringify({
            title,
            description,
            priority,
            due_date: dueDate || null,
          }),
        }
      );

      onUpdated();
      await loadTask();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update task"
      );
    }
  }

  async function assignMember() {
    if (!selectedMember || !task) {
        return;
    }

    if (task.assignees.includes(
        Number(selectedMember)
    )) {
        setError("User is already assigned.");
        return;
    }

    try {
        await apiRequest(
        `/tasks/${taskId}/`,
        {
            method: "PATCH",
            body: JSON.stringify({
            assignees: [
                ...task.assignees,
                Number(selectedMember),
            ],
            }),
        }
        );

        setSelectedMember("");
        await loadTask();
        onUpdated();
    } catch (err) {
        setError(
        err instanceof Error
            ? err.message
            : "Failed to assign user"
        );
    }
  }

  if (!task) {
    return (
      <div className="form-card">
        {error || "Loading..."}
      </div>
    );
  }

  return (
    <div className="details-panel">
      <div className="page-header">
        <h2>{task.title}</h2>

        <button onClick={onClose}>
          Close
        </button>
      </div>

      {error && (
        <p className="error">{error}</p>
      )}

      <form onSubmit={updateTask}>
        <label>Title</label>

        <input
          value={title}
          onChange={(e) =>
            setTitle(e.target.value)
          }
        />

        <label>Description</label>

        <textarea
          value={description}
          onChange={(e) =>
            setDescription(e.target.value)
          }
        />

        <label>Priority</label>

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

        <label>Due date</label>

        <input
          type="datetime-local"
          value={dueDate}
          onChange={(e) =>
            setDueDate(e.target.value)
          }
        />

        <button type="submit">
          Save Changes
        </button>
        <select
            value={selectedMember}
            onChange={(e) =>
                setSelectedMember(e.target.value)
            }
            >
            <option value="">
                Select member
            </option>

            {members.map((memberId) => (
                <option
                key={memberId}
                value={memberId}
                >
                User {memberId}
                </option>
            ))}
        </select>
        <button
            type="button"
            onClick={async () => {
                if (!selectedMember) return;

                try {
                await apiRequest(
                    `/tasks/${taskId}/`,
                    {
                    method: "PATCH",
                    body: JSON.stringify({
                        assignees: [
                        ...task.assignees,
                        Number(selectedMember),
                        ],
                    }),
                    }
                );

                await loadTask();
                setSelectedMember("");
                } catch (err) {
                setError(
                    err instanceof Error
                    ? err.message
                    : "Failed to assign user"
                );
                }
            }}
            >
            Assign
            </button>
      </form>

      <div className="task-info">
        <p>
          <strong>Status:</strong>{" "}
          {task.status}
        </p>

        <p>
          <strong>Created by:</strong>{" "}
          {task.created_by_email}
        </p>
      </div>
      <div className="task-info">
        <h3>Assignees</h3>

        {task.assignees.length === 0 ? (
            <p>No assignees</p>
        ) : (
            task.assignees.map((userId) => (
            <div
                key={userId}
                className="assignee-row"
            >
                <span className="assignee">
                User {userId}
                </span>

                <button
                type="button"
                onClick={async () => {
                    const remaining =
                    task.assignees.filter(
                        (id) => id !== userId
                    );

                    try {
                    await apiRequest(
                        `/tasks/${taskId}/`,
                        {
                        method: "PATCH",
                        body: JSON.stringify({
                            assignees: remaining,
                        }),
                        }
                    );

                    await loadTask();
                    onUpdated();
                    } catch (err) {
                    setError(
                        err instanceof Error
                        ? err.message
                        : "Failed to remove assignee"
                    );
                    }
                }}
                >
                Remove
                </button>
            </div>
            ))
        )}

        <div className="assignment-controls">
            <select
            value={selectedMember}
            onChange={(e) =>
                setSelectedMember(e.target.value)
            }
            >
            <option value="">
                Select project member
            </option>

            {members.map((memberId) => (
                <option
                key={memberId}
                value={memberId}
                >
                User {memberId}
                </option>
            ))}
            </select>

            <button
            type="button"
            onClick={assignMember}
            disabled={!selectedMember}
            >
            Assign
            </button>
        </div>
        </div>
        <div className="task-history">
            <h3>Comments</h3>

            <div className="comment-form">
                <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                />

                <button
                type="button"
                onClick={addComment}
                disabled={commentLoading || !comment.trim()}
                >
                {commentLoading ? "Adding..." : "Add Comment"}
                </button>

                {commentError && (
                <p className="error">{commentError}</p>
                )}
            </div>

            <h3>History</h3>

            {history.length === 0 ? (
                <p>No history yet.</p>
            ) : (
                <div className="history-list">
                {history.map((item) => (
                    <div key={item.id} className="history-item">
                    <div className="history-header">
                        <strong>{item.actor_email}</strong>
                        <span>
                        {new Date(item.created_at).toLocaleString()}
                        </span>
                    </div>

                    <div className="history-action">
                        {item.action === "COMMENTED" ? (
                        <>
                            <strong>Commented:</strong> {item.comment}
                        </>
                        ) : item.action === "CREATED" ? (
                        "Created this task"
                        ) : item.action === "ASSIGNED" ? (
                        <>
                            Assigned user {item.new_value}
                        </>
                        ) : item.action === "UNASSIGNED" ? (
                        <>
                            Unassigned user {item.old_value}
                        </>
                        ) : (
                        <>
                            <strong>{item.field}</strong> changed
                            {item.old_value && (
                            <> from "{item.old_value}"</>
                            )}
                            {item.new_value && (
                            <> to "{item.new_value}"</>
                            )}
                        </>
                        )}
                    </div>
                    </div>
                ))}
                </div>
            )}
        </div>

    </div>
  );
}