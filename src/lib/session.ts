export function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem("recall5_session_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("recall5_session_id", id);
  }
  return id;
}