import express from "express";
import {
  getAcademicWritingTests,
  getGeneralTrainingWritingTests
} from "../../controllers/takeTest/writingTestController.js";

const router = express.Router();

router.get("/academic-writing-test", getAcademicWritingTests);
router.get("/general-training-writing-test", getGeneralTrainingWritingTests);


export default router;