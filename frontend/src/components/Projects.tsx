import { useEffect, useState } from "react";
import { apiRequest } from "../api";
import type { Project } from "../types";

type Props = {
  userRole: string;
};

export default function Projects({ userRole }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function loadProjects() {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/projects/");
      setProjects(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load projects"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  async function createProject(
    event: React.FormEvent
  ) {
    event.preventDefault();

    try {
      await apiRequest("/projects/", {
        method: "POST",
        body: JSON.stringify({
          key,
          name,
          description,
        }),
      });

      setKey("");
      setName("");
      setDescription("");

      await loadProjects();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create project"
      );
    }
  }

  async function archiveProject(id: number) {
    try {
      await apiRequest(`/projects/${id}/archive/`, {
        method: "POST",
      });

      await loadProjects();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to archive project"
      );
    }
  }

  async function restoreProject(id: number) {
    try {
      await apiRequest(`/projects/${id}/restore/`, {
        method: "POST",
      });

      await loadProjects();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to restore project"
      );
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Projects</h1>
      </div>

      {error && (
        <p className="error">{error}</p>
      )}

      {userRole === "MANAGER" && (
        <form
          className="form-card"
          onSubmit={createProject}
        >
          <h3>Create Project</h3>

          <input
            placeholder="Project key"
            value={key}
            onChange={(e) =>
              setKey(e.target.value)
            }
            required
          />

          <input
            placeholder="Project name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
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

          <button type="submit">
            Create Project
          </button>
        </form>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          {projects.map((project) => (
            <div
              key={project.id}
              className="project-card"
            >
              <div>
                <h3>
                  {project.key} — {project.name}
                </h3>

                <p>{project.description}</p>

                <small>
                  Owner: {project.owner_email}
                </small>
              </div>

              {userRole === "MANAGER" && (
                <div>
                  {project.is_archived ? (
                    <button
                      onClick={() =>
                        restoreProject(project.id)
                      }
                    >
                      Restore
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        archiveProject(project.id)
                      }
                    >
                      Archive
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}