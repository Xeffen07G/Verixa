require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const verifyRoutes = require("./routes/verify");
const urlRoutes = require("./routes/url");
const healthRoutes = require("./routes/health");
const connectDB = require("./config/db");
const { requireApiKey, requestLogger } = require("./middleware/validate");

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
if (process.env.MONGO_URI) {
  connectDB();
} else {
  console.log("⚠️ MONGO_URI not found in .env. Skipping database connection.");
}

// Security & middleware
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: "Too many requests. Please wait before trying again." },
});
app.use("/api/", limiter);

// Custom middleware
app.use(requestLogger);

// Routes
app.use("/api/verify", requireApiKey, verifyRoutes);
app.use("/api/url", requireApiKey, urlRoutes);
app.use("/api/pdf", requireApiKey, require("./routes/pdf"));
app.use("/api/image", requireApiKey, require("./routes/image"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/health", healthRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`\n🔍 VeriXa Backend running on http://localhost:${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || "development"}\n`);
});

module.exports = app;