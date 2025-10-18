import express from "express";
import {
  getTests,
  getTestById,
  createTest,
  updateTest,
  deleteTest,
} from "../controllers/testController.js";

const router = express.Router();

router.get("/", getTests);
router.get("/:id", getTestById);
router.post("/", createTest);
router.put("/:id", updateTest);
router.delete("/:id", deleteTest);

export default router;
