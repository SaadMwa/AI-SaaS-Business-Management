const getEnvValue = (key: "VITE_API_URL") => {
  const value = (import.meta.env as Record<string, string | undefined>)[key];
  return typeof value === "string" ? value.trim() : "";
};

export const resolveApiBaseUrl = () => {
  const explicit = getEnvValue("VITE_API_URL");
  if (explicit) return explicit.replace(/\/$/, "");
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api`;
  }
  return "/api";
};