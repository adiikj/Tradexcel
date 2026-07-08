// Shared between the Express app and the price-streaming socket server so
// both enforce the same allowed origin.
export const corsOptions = {
  origin: process.env.CORS_ORIGIN || "http://localhost:3000", // Next.js dev server
  credentials: true, // Allow credentials (cookies, authentication headers, etc.)
};
