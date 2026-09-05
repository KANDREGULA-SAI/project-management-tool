import Tasks from "./components/Tasks";

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
  | "alerts";

function App() {
  const [view, setView] =useState<View>("dashboard");
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

          <button onClick={() => setView("alerts")}>
            Alerts
          </button>
        </aside>

        <main className="content">
          {view === "dashboard" && (
            <h1>Dashboard</h1>
          )}

          {view === "projects" && (
            <h1>Projects</h1>
          )}

          {view === "tasks" && <Tasks />}

          {view === "alerts" && (
            <h1>Alerts</h1>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;