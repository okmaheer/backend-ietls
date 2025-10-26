import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import passport from "./src/config/passport.js";
import userRoutes from "./src/routes/userRoutes.js";
import testRoutes from "./src/routes/testRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";

dotenv.config();

BigInt.prototype.toJSON = function () {
  return Number(this);
};

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

// Session configuration
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

// Routes
app.use("/api/user", userRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/auth", authRoutes);

// Health check
app.get("/", (req, res) => {
  console.log("✅ Received GET / request");
  res.json({ message: "API is running 🚀" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
