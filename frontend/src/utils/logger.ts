type LogLevel = "debug" | "info" | "warn" | "error";

const isProd = import.meta.env.MODE === "production";

const emit = (level: LogLevel, message: string, meta?: Record<string, unknown>) => {
  if (isProd) return;
  const payload = meta ? { message, meta } : message;
  if (level === "error") {
    console.error(payload);
    return;
  }
  if (level === "warn") {
    console.warn(payload);
    return;
  }
  console.log(payload);
};

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => emit("debug", message, meta),
  info: (message: string, meta?: Record<string, unknown>) => emit("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => emit("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => emit("error", message, meta),
};
