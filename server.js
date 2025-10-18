import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./src/routes/userRoutes.js";
import testRoutes from "./src/routes/testRoutes.js";

dotenv.config();
BigInt.prototype.toJSON = function () {
  return Number(this);
};
const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/tests", testRoutes);

// Health check
app.get("/", (req, res) => {
  console.log("✅ Received GET / request");
  res.json({ message: "API is running 🚀" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
