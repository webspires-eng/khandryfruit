type LogFields = Record<string, string | number | boolean | null | undefined>;
const sensitiveValue =
  /(?:\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis(?:s)?):\/\/|\b(?:sk|pk)_(?:live|test)_[A-Za-z0-9]+|\bwhsec_[A-Za-z0-9]+|\b(?:AKIA|ASIA)[A-Z0-9]{16}\b|\bBearer\s+\S+|\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|(?:^|;\s*)(?:better-auth\.session_token|session|sid|auth)=)/i;
function write(
  level: "info" | "warn" | "error",
  event: string,
  fields: LogFields = {},
) {
  const safe = Object.fromEntries(
    Object.entries(fields)
      .filter(
        ([key]) =>
          !/password|secret|token|credential|cookie|authorization|recovery|mfa|address/i.test(
            key,
          ),
      )
      .map(([key, value]) => [
        key,
        typeof value === "string" && sensitiveValue.test(value)
          ? "[REDACTED]"
          : value,
      ]),
  );
  console[level](
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      event,
      ...safe,
    }),
  );
}
export const logger = {
  info: (event: string, fields?: LogFields) => write("info", event, fields),
  warn: (event: string, fields?: LogFields) => write("warn", event, fields),
  error: (event: string, fields?: LogFields) => write("error", event, fields),
};
