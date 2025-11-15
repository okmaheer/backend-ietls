import { prisma } from "../../config/prismaClient.js";
import { success, error } from "../../utils/response.js";

// 🧾 Get all active academic writing tests
export const getAcademicWritingTests = async (req, res) => {
  try {
    const tests = await prisma.tests.findMany({ 
      where: {
        status: 1,
        category: 1  
      },
      select: {
        id: true,
        name: true,
        category: true,
        type: true,
        created_at: true,
        updated_at: true
      },
      orderBy: { 
        name: "asc" 
      } 
    });

    // Return empty array if no tests found
    if (!tests || tests.length === 0) {
      return success(res, [], "No active tests available");
    }

    success(res, tests, "Active tests fetched successfully");
  } catch (err) {
    console.error("❌ Error fetching tests:", err);
    error(res, "Failed to fetch tests", 500);
  }
};

// 🧾 Get all active general training writing tests
export const getGeneralTrainingWritingTests = async (req, res) => {
  try {
    const tests = await prisma.tests.findMany({ 
      where: {
        status: 1,
        category: 2  
      },
      select: {
        id: true,
        name: true,
        category: true,
        type: true,
        created_at: true,
        updated_at: true
      },
      orderBy: { 
        id: "desc" 
      } 
    });

    // Return empty array if no tests found
    if (!tests || tests.length === 0) {
      return success(res, [], "No active tests available");
    }

    success(res, tests, "Active tests fetched successfully");
  } catch (err) {
    console.error("❌ Error fetching tests:", err);
    error(res, "Failed to fetch tests", 500);
  }
};

// 🧾 Get writing test details with questions
export const getWritingTestDetails = async (req, res) => {
  try {
    const { testId } = req.params;

    // Validate testId
    if (!testId || isNaN(testId)) {
      return error(res, "Invalid test ID", 400);
    }

    const testIdNumber = parseInt(testId);

    // Fetch test details with questions
    const test = await prisma.tests.findUnique({
      where: {
        id: testIdNumber
      },
      select: {
        id: true,
        name: true,
        category: true,
        type: true,
        created_at: true,
        updated_at: true
      }
    });

    // Check if test exists
    if (!test) {
      return error(res, "Test not found", 404);
    }

    // Fetch questions for this test
    const questions = await prisma.writing_questions.findMany({
      where: {
        test_id: testIdNumber
      },
      select: {
        id: true,
        test_id: true,
        task_number: true,
        question_text: true,
        image_url: true,
        word_limit: true,
        created_at: true,
        updated_at: true
      },
      orderBy: {
        task_number: "asc"
      }
    });

    // Check if questions exist
    if (!questions || questions.length === 0) {
      return error(res, "No questions found for this test", 404);
    }

    // Combine test and questions
    const testDetails = {
      test,
      questions
    };

    success(res, testDetails, "Test details fetched successfully");
  } catch (err) {
    console.error("❌ Error fetching test details:", err);
    error(res, "Failed to fetch test details", 500);
  }
};

// 📝 Submit writing test answers
export const submitWritingTest = async (req, res) => {
  try {
    const { test_id, answers, time_taken } = req.body;
    const userId = req.user?.id; // Assuming user is attached via auth middleware

    // Validation
    if (!test_id || !answers || !Array.isArray(answers)) {
      return error(res, "Invalid submission data", 400);
    }

    if (!userId) {
      return error(res, "User not authenticated", 401);
    }

    // Verify test exists
    const test = await prisma.tests.findUnique({
      where: { id: test_id }
    });

    if (!test) {
      return error(res, "Test not found", 404);
    }

    // Create submission record
    const submission = await prisma.writing_submissions.create({
      data: {
        user_id: userId,
        test_id: test_id,
        time_taken: time_taken || 0,
        status: 1, // 1 = submitted, 2 = graded
        submitted_at: new Date()
      }
    });

    // Create answer records
    const answerRecords = answers.map(answer => ({
      submission_id: submission.id,
      task_number: answer.task_number,
      answer_text: answer.answer_text,
      word_count: answer.word_count
    }));

    await prisma.writing_answers.createMany({
      data: answerRecords
    });

    success(res, {
      submission_id: submission.id,
      message: "Test submitted successfully"
    }, "Test submitted successfully");

  } catch (err) {
    console.error("❌ Error submitting test:", err);
    error(res, "Failed to submit test", 500);
  }
};

// 📊 Get user's test submissions
export const getUserSubmissions = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return error(res, "User not authenticated", 401);
    }

    const submissions = await prisma.writing_submissions.findMany({
      where: {
        user_id: userId
      },
      include: {
        tests: {
          select: {
            id: true,
            name: true,
            category: true,
            type: true
          }
        },
        writing_answers: {
          select: {
            task_number: true,
            answer_text: true,
            word_count: true,
            score: true,
            feedback: true
          }
        }
      },
      orderBy: {
        submitted_at: "desc"
      }
    });

    success(res, submissions, "Submissions fetched successfully");
  } catch (err) {
    console.error("❌ Error fetching submissions:", err);
    error(res, "Failed to fetch submissions", 500);
  }
};

// 📄 Get single submission details
export const getSubmissionDetails = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return error(res, "User not authenticated", 401);
    }

    const submission = await prisma.writing_submissions.findUnique({
      where: {
        id: parseInt(submissionId)
      },
      include: {
        tests: {
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            type: true,
            duration: true,
            total_marks: true
          }
        },
        writing_answers: {
          select: {
            id: true,
            task_number: true,
            answer_text: true,
            word_count: true,
            score: true,
            feedback: true,
            created_at: true
          },
          orderBy: {
            task_number: "asc"
          }
        }
      }
    });

    if (!submission) {
      return error(res, "Submission not found", 404);
    }

    // Check if submission belongs to user
    if (submission.user_id !== userId) {
      return error(res, "Unauthorized access", 403);
    }

    success(res, submission, "Submission details fetched successfully");
  } catch (err) {
    console.error("❌ Error fetching submission details:", err);
    error(res, "Failed to fetch submission details", 500);
  }
};