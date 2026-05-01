require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const verifyRoutes = require("./routes/verify");
const urlRoutes = require("./routes/url");
const healthRoutes = require("./routes/health");
const trendingRoutes = require("./routes/trending");
const { requireApiKey, requestLogger } = require("./middleware/validate");
const connectDB = require("./config/db");

// Connect to Database
if (process.env.MONGO_URI) {
  console.log('MONGO_URI found. Initializing connection...');
  connectDB();
} else {
  console.error('CRITICAL: MONGO_URI is missing from environment variables!');
}

const app = express();
const PORT = process.env.PORT || 5000;


// Security & middleware
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(
  cors({
    origin: true, // Allow all origins for the enterprise demo to ensure connectivity
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
app.use("/api/health", healthRoutes);
app.use("/api/trending", trendingRoutes);
app.use('/api/organization', require('./routes/organization'));
app.use('/api/user', require('./routes/user'));
app.use("/api/auth", require("./routes/auth"));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || "Internal server error" });
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🔍 VeriXa Backend running on http://localhost:${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || "development"}\n`);
  });
}

module.exports = app;