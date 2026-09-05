import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import activityLogRoutes from "./routes/activityLogRoutes.js";

import errorMiddleware from "./middleware/errorMiddleware.js";

dotenv.config();

const app = express();

// ===============================
// RENDER / PROXY CONFIG
// ===============================

// Render sits behind a reverse proxy.
// Trust the first proxy so express-rate-limit
// can correctly read the client's forwarded IP.
app.set("trust proxy", 1);

// ===============================
// BASIC SECURITY CONFIG
// ===============================

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://thoptv.in",
  "https://www.thoptv.in",
];

// ===============================
// SECURITY HEADERS
// ===============================

app.use(helmet());

// ===============================
// CORS
// ===============================

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without an Origin header
      // such as Postman/server-to-server requests.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },

    credentials: true,
  })
);

// ===============================
// JSON BODY PARSER
// Limit request body size
// ===============================

app.use(
  express.json({
    limit: "1mb",
  })
);

// ===============================
// COOKIE PARSER
// ===============================

app.use(cookieParser());

// ===============================
// MONGODB CONNECTION
// ===============================

connectDB();

// ===============================
// ROUTES
// ===============================

// Auth Routes
app.use("/api/auth", authRoutes);

// Customer Routes
app.use("/api/customers", customerRoutes);

// Ticket Routes
app.use("/api/tickets", ticketRoutes);

// Employee Routes
app.use("/api/employees", employeeRoutes);

// Dashboard Routes
app.use("/api/dashboard", dashboardRoutes);

// Notification Routes
app.use("/api/notifications", notificationRoutes);

// Activity Log Routes
app.use("/api/activity-logs", activityLogRoutes);

// ===============================
// HOME ROUTE
// ===============================

app.get("/", (req, res) => {
  res.status(200).json({
    message: "CRM API is running",
  });
});

// ===============================
// 404 API ROUTE
// ===============================

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// ===============================
// GLOBAL ERROR HANDLER
// ===============================

app.use(errorMiddleware);

// ===============================
// SERVER
// ===============================

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});