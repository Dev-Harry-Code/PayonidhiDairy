type LogValue = unknown;
type LogContext = Record<string, LogValue>;

const REDACTED_KEYS = new Set(["pin", "pinhash", "token", "password"]);

export const logger = {
  info(message: string, context?: LogContext) {
    write("info", message, context);
  },
  warn(message: string, context?: LogContext) {
    write("warn", message, context);
  },
  error(message: string, context?: LogContext) {
    write("error", message, context);
  },
};

function write(level: "info" | "warn" | "error", message: string, context?: LogContext) {
  const safeContext = context ? redact(context) : undefined;
  const payload =
    safeContext && typeof safeContext === "object" && !Array.isArray(safeContext)
      ? { ...safeContext, message }
      : { message, context: safeContext };
  console[level](JSON.stringify(payload));
}

function redact(value: LogValue): LogValue {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [
        key,
        REDACTED_KEYS.has(key.toLowerCase()) ? "[REDACTED]" : redact(nested),
      ]),
    );
  }
  return value;
}
