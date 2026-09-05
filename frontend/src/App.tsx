import Projects from "./components/Projects";
import Tasks from "./components/Tasks";
import Alerts from "./components/Alerts";
import Dashboard from "./components/Dashboard";
import MyTasks from "./components/MyTasks";

import { useEffect, useState } from "react";
import { apiRequest } from "./api";
import "./App.css";

type User = {
  id: number;
  email: string;
  role: string;
};

type View =
  | "dashboard"
  | "projects"
  | "tasks"
  | "my-tasks"
  | "alerts";

function App() {
  const [view, setView] =useState<View>("dashboard");
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      return;
    }

    apiRequest("/auth/me/")
      .then(setUser)
      .catch(() => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      });
  }, []);

  useEffect(() => {
    if (user) {
      loadAlertCount();
    }
  }, [user]);

  async function loadAlertCount() {
    try {
      const data = await apiRequest("/tasks/alerts/");
      setAlertCount(data.length);
    } catch {
      setAlertCount(0);
    }
  }

  async function handleLogin(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const data = await apiRequest(
        "/auth/login/",
        {
          method: "POST",
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      localStorage.setItem(
        "access_token",
        data.access
      );

      localStorage.setItem(
        "refresh_token",
        data.refresh
      );

      const currentUser = await apiRequest(
        "/auth/me/"
      );

      setUser(currentUser);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Login failed"
      );
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  }

  if (!user) {
    return (
      <div className="login-page">
        <form
          className="login-card"
          onSubmit={handleLogin}
        >
          <h1>Project Manager</h1>

          <p>Sign in to continue</p>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            required
          />

          {error && (
            <p className="error">{error}</p>
          )}

          <button disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="navbar">
        <h2>Project Manager</h2>

        <div>
          <span>
            {user.email} ({user.role})
          </span>

          <button onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <button onClick={() => setView("dashboard")}>
            Dashboard
          </button>

          <button onClick={() => setView("projects")}>
            Projects
          </button>

          <button onClick={() => setView("tasks")}>
            Tasks
          </button>

          <button onClick={() => setView("my-tasks")}>
            My Tasks
          </button>

          <button onClick={() => setView("alerts")}>
            Alerts
            {alertCount > 0 && (
              <span className="alert-count">{alertCount}</span>
            )}
          </button>
        </aside>

        <main className="content">
          {view === "dashboard" && <Dashboard />}

          {view === "projects" && (
            <Projects userRole={user.role} />
          )}

          {view === "tasks" && <Tasks />}

          {view === "my-tasks" && <MyTasks />}

          {view === "alerts" && <Alerts />}
        </main>
      </div>
    </div>
  );
}

export default App;