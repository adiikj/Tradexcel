
const allowedOrigins = (
  process.env.CORS_ORIGIN || "http://localhost:3000"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Shared between the Express app and the price-streaming socket server.
export const corsOptions = {
  origin: (
    requestOrigin: string | undefined,
    callback: (error: Error | null, allow?: boolean) => void
  ) => {
    // Allow requests without an Origin header (e.g. server-to-server).
    if (!requestOrigin || allowedOrigins.includes(requestOrigin)) {
      callback(null, true);
    } else {
      callback(new Error("Origin not allowed by CORS"));
    }
  },
  credentials: true,
};
