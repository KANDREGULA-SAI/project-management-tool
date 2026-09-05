const API_URL = "https://project-management-api-nn35.onrender.com/api";

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
) {
  const token = localStorage.getItem("access_token");

  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: "Request failed",
    }));

    throw new Error(
      error.detail || "Request failed"
    );
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}