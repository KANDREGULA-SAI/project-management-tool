import { useEffect, useState } from "react";
import { apiRequest } from "../api";

type Alert = {
  id: number;
  task: number;
  task_title: string;
  dismissed: boolean;
  created_at: string;
  dismissed_at: string | null;
};

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAlerts() {
    try {
      setLoading(true);
      const data = await apiRequest("/tasks/alerts/");
      setAlerts(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load alerts"
      );
    } finally {
      setLoading(false);
    }
  }

  async function dismissAlert(alertId: number) {
    try {
      await apiRequest(`/tasks/alerts/${alertId}/dismiss/`, {
        method: "POST",
      });

      await loadAlerts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to dismiss alert"
      );
    }
  }

  useEffect(() => {
    loadAlerts();
  }, []);

  if (loading) {
    return <p>Loading alerts...</p>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Alerts</h1>
          <p>Overdue unfinished tasks assigned to you.</p>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {alerts.length === 0 ? (
        <div className="empty-state">
          <h3>No alerts</h3>
          <p>You don't have any overdue task alerts.</p>
        </div>
      ) : (
        <div className="alert-list">
          {alerts.map((alert) => (
            <div key={alert.id} className="alert-card">
              <div>
                <h3>{alert.task_title}</h3>
                <p>
                  Task #{alert.task} is overdue and not completed.
                </p>
              </div>

              <button
                type="button"
                onClick={() => dismissAlert(alert.id)}
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}