// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import passport from "./src/config/passport.js";
import userRoutes from "./src/routes/userRoutes.js";
import testRoutes from "./src/routes/testRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";
import takeWritingTestRoutes from "./src/routes/takeTest/takeWritingTestRoutes.js";
import expertReviewRoutes from "./src/routes/takeTest/expertReviewRoutes.js";
import dashboardRoutes from "./src/routes/dashboardRoutes.js";
import paymentRoutes from "./src/routes/paymentRoutes.js";
import emailRoutes from "./src/routes/emailRoutes.js";

dotenv.config();

// BigInt serialization fix
BigInt.prototype.toJSON = function () {
  return this.toString();
};

const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger middleware
app.use((req, res, next) => {
  console.log(`\n📨 ${req.method} ${req.path}`);
  console.log('📨 Headers:', {
    authorization: req.headers.authorization ? `${req.headers.authorization.substring(0, 30)}...` : 'none',
    origin: req.headers.origin,
    'content-type': req.headers['content-type']
  });
  next();
});

// Session configurationx
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// ==========================================
// ROUTES
// ==========================================

// Authentication routes (Google OAuth)
app.use("/api/auth", authRoutes);

// User routes (with role protection)
app.use("/api/user", userRoutes);

// Test routes (with role protection)
app.use("/api/tests", testRoutes);

// Writing Test routes
app.use("/api/take-test/writing", takeWritingTestRoutes);

// Expert Review routes
app.use("/api/expert-review", expertReviewRoutes);

// Dashboard routes
app.use("/api/dashboard", dashboardRoutes);

// Payment routes
app.use("/api/payment", paymentRoutes);

// Email service routes (standalone — also usable by third parties via API key)
app.use("/api/email", emailRoutes);

// Health check
app.get("/", (req, res) => {
  console.log("✅ Received GET / request");
  res.json({ 
    message: "API is running 🚀",
    timestamp: new Date().toISOString()
  });
});

// API info endpoint
app.get("/api", (req, res) => {
  res.json({
    message: "IELTS Test API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      users: "/api/user",
      tests: "/api/tests",
    },
  });
});

// ==========================================
// ERROR HANDLING
// ==========================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Global Error:", err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ==========================================
// START SERVER
// ==========================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
});