import { useEffect, useState } from "react";
import { apiRequest } from "../api";

type DashboardData = {
  open: number;
  overdue: number;
  due_this_week: number;
  completed_this_week: number;
  status_breakdown: Record<string, number>;
  assignee_breakdown: {
    user_id: number;
    email: string;
    count: number;
    }[];
  completions_last_8_weeks: {
    week: string;
    count: number;
  }[];
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const result = await apiRequest("/tasks/dashboard/");
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load dashboard"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  if (error) {
    return <p className="error">{error}</p>;
  }

  if (!data) {
    return <p>No dashboard data available.</p>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of your current task activity.</p>
        </div>

        <button type="button" onClick={loadDashboard}>
          Refresh
        </button>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <h3>Open</h3>
          <strong>{data.open}</strong>
        </div>

        <div className="dashboard-card">
          <h3>Overdue</h3>
          <strong>{data.overdue}</strong>
        </div>

        <div className="dashboard-card">
          <h3>Due This Week</h3>
          <strong>{data.due_this_week}</strong>
        </div>

        <div className="dashboard-card">
          <h3>Completed This Week</h3>
          <strong>{data.completed_this_week}</strong>
        </div>
      </div>

      <div className="dashboard-sections">
        <section className="dashboard-section">
          <h2>Status Breakdown</h2>

          {Object.entries(data.status_breakdown).map(
            ([status, count]) => (
              <div
                key={status}
                className="breakdown-row"
              >
                <span>{status}</span>
                <strong>{count}</strong>
              </div>
            )
          )}
        </section>

        <section className="dashboard-section">
            <h2>Assignee Breakdown</h2>

            {data.assignee_breakdown.map((item) => (
                <div
                key={item.user_id}
                className="breakdown-row"
                >
                <span>{item.email}</span>
                <strong>{item.count}</strong>
                </div>
            ))}
            </section>
      </div>

      <section className="dashboard-section">
        <h2>Completions — Last 8 Weeks</h2>

        {data.completions_last_8_weeks.map(
          (item) => (
            <div
              key={item.week}
              className="breakdown-row"
            >
              <span>{item.week}</span>
              <strong>{item.count}</strong>
            </div>
          )
        )}
      </section>
    </div>
  );
}