import { prisma } from "../../config/prismaClient.js";
import { success, error } from "../../utils/response.js";
import { evaluateWritingTest, calculateAverageBand } from "../../services/openaiService.js";
import { logError, logInfo, logDebug } from "../../utils/logger.js";

// 🧾 Get all active academic writing tests
export const getAcademicWritingTests = async (req, res) => {
  try {
    // Check if user is authenticated
    const userId = req.user?.id;
    logDebug('Fetching academic writing tests', { userId });
    const tests = await prisma.tests.findMany({
      where: {
        status: 1,
        category: 1,
        writing_questions: {
          some: {} // Only get tests that have at least one writing question
        }
      },
      select: {
        id: true,
        name: true,
        category: true,
        type: true,
        created_at: true,
        updated_at: true,
        // Include user's submission if authenticated
        ...(userId && {
          writing_submissions: {
            where: {
              user_id: BigInt(userId)
            },
            select: {
              id: true,
              overall_band_score: true,
              ai_evaluation: true,
              created_at: true
            }
          }
        })
      },
      orderBy: {
        name: "asc"
      }
    });

    // Return empty array if no tests found
    if (!tests || tests.length === 0) {
      return success(res, [], "No active tests available");
    }

    // Format the response - convert BigInt to string and extract scores from ai_evaluation
    const formattedTests = tests.map(test => {
      let submission = null;

      if (userId && test.writing_submissions && test.writing_submissions.length > 0) {
        const sub = test.writing_submissions[0];
        const aiEval = sub.ai_evaluation ? JSON.parse(sub.ai_evaluation) : null;

        // Get task scores from AI evaluation
        let task1Score = 0, task2Score = 0;

        if (aiEval) {
          if (aiEval.task1) {
            task1Score = aiEval.task1.overall_band || 0;
          }
          if (aiEval.task2) {
            task2Score = aiEval.task2.overall_band || 0;
          }
        }

        submission = {
          id: sub.id.toString(),
          overall_band_score: sub.overall_band_score || 0,
          task1_score: task1Score,
          task2_score: task2Score,
          task1_completed: aiEval?.task1 && aiEval.task1.overall_band > 0,
          task2_completed: aiEval?.task2 && aiEval.task2.overall_band > 0,
          submitted_at: sub.created_at
        };
      }

      return {
        id: test.id.toString(),
        name: test.name,
        title: test.name, // Alias for frontend compatibility
        category: test.category,
        type: test.type,
        created_at: test.created_at,
        updated_at: test.updated_at,
        ...(submission && { submission })
      };
    });

    logInfo('Academic writing tests fetched successfully', { count: formattedTests.length, userId });
    success(res, formattedTests, "Active tests fetched successfully");
  } catch (err) {
    logError("Failed to fetch academic writing tests", err, {
      userId: req.user?.id,
      method: req.method,
      url: req.originalUrl
    });
    error(res, "Failed to fetch tests", 500);
  }
};

// 🧾 Get all active general training writing tests
export const getGeneralTrainingWritingTests = async (req, res) => {
  try {
    // Check if user is authenticated
    const userId = req.user?.id;

    const tests = await prisma.tests.findMany({
      where: {
        status: 1,
        category: 2,
        writing_questions: {
          some: {} // Only get tests that have at least one writing question
        }
      },
      select: {
        id: true,
        name: true,
        category: true,
        type: true,
        created_at: true,
        updated_at: true,
        // Include user's submission if authenticated
        ...(userId && {
          writing_submissions: {
            where: {
              user_id: BigInt(userId)
            },
            select: {
              id: true,
              overall_band_score: true,
              ai_evaluation: true,
              created_at: true
            }
          }
        })
      },
      orderBy: {
        id: "desc"
      }
    });

    // Return empty array if no tests found
    if (!tests || tests.length === 0) {
      return success(res, [], "No active tests available");
    }

    // Format the response - convert BigInt to string and extract scores from ai_evaluation
    const formattedTests = tests.map(test => {
      let submission = null;

      if (userId && test.writing_submissions && test.writing_submissions.length > 0) {
        const sub = test.writing_submissions[0];
        const aiEval = sub.ai_evaluation ? JSON.parse(sub.ai_evaluation) : null;

        // Get task scores from AI evaluation
        let task1Score = 0, task2Score = 0;

        if (aiEval) {
          if (aiEval.task1) {
            task1Score = aiEval.task1.overall_band || 0;
          }
          if (aiEval.task2) {
            task2Score = aiEval.task2.overall_band || 0;
          }
        }

        submission = {
          id: sub.id.toString(),
          overall_band_score: sub.overall_band_score || 0,
          task1_score: task1Score,
          task2_score: task2Score,
          task1_completed: aiEval?.task1 && aiEval.task1.overall_band > 0,
          task2_completed: aiEval?.task2 && aiEval.task2.overall_band > 0,
          submitted_at: sub.created_at
        };
      }

      return {
        id: test.id.toString(),
        name: test.name,
        title: test.name, // Alias for frontend compatibility
        category: test.category,
        type: test.type,
        created_at: test.created_at,
        updated_at: test.updated_at,
        ...(submission && { submission })
      };
    });

    logInfo('General training writing tests fetched successfully', { count: formattedTests.length, userId });
    success(res, formattedTests, "Active tests fetched successfully");
  } catch (err) {
    logError("Failed to fetch general training writing tests", err, {
      userId: req.user?.id,
      method: req.method,
      url: req.originalUrl
    });
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

    logInfo('Test details fetched successfully', { testId });
    success(res, testDetails, "Test details fetched successfully");
  } catch (err) {
    logError("Failed to fetch test details", err, {
      testId: req.params.testId,
      method: req.method,
      url: req.originalUrl
    });
    error(res, "Failed to fetch test details", 500);
  }
};

// 📝 Submit writing test answers with AI evaluation
export const submitWritingTest = async (req, res) => {
  try {
    const { test_id, answers, time_taken } = req.body;
    const userId = req.user?.id;

    // Validation
    if (!test_id || !answers || !Array.isArray(answers)) {
      return error(res, "Invalid submission data", 400);
    }

    if (!userId) {
      return error(res, "User not authenticated", 401);
    }

    // Check if user already has a submission for this test
    const existingSubmission = await prisma.writing_submissions.findFirst({
      where: {
        user_id: BigInt(userId),
        test_id: BigInt(test_id)
      }
    });

    // Fetch test with questions
    const test = await prisma.tests.findUnique({
      where: { id: BigInt(test_id) },
      include: {
        writing_questions: {
          orderBy: { task_number: 'asc' }
        }
      }
    });

    if (!test) {
      return error(res, "Test not found", 404);
    }

    // Organize answers by task number
    const task1Answer = answers.find(a => a.task_number === 1);
    const task2Answer = answers.find(a => a.task_number === 2);

    // Check if at least one task has NEW content
    const hasTask1Content = task1Answer && task1Answer.word_count > 0;
    const hasTask2Content = task2Answer && task2Answer.word_count > 0;

    // If updating existing submission, merge with existing data
    let existingTask1 = null;
    let existingTask2 = null;
    let existingAiEval = null;

    if (existingSubmission) {
      // Parse existing AI evaluation
      existingAiEval = existingSubmission.ai_evaluation ? JSON.parse(existingSubmission.ai_evaluation) : null;

      // Get existing tasks that won't be overwritten
      if (existingSubmission.task1_answer && !hasTask1Content) {
        existingTask1 = {
          answer_text: existingSubmission.task1_answer,
          word_count: existingSubmission.task1_word_count
        };
      }

      if (existingSubmission.task2_answer && !hasTask2Content) {
        existingTask2 = {
          answer_text: existingSubmission.task2_answer,
          word_count: existingSubmission.task2_word_count
        };
      }
    }

    // Check if at least one task has content (new or existing)
    const hasFinalTask1 = hasTask1Content || existingTask1;
    const hasFinalTask2 = hasTask2Content || existingTask2;

    if (!hasFinalTask1 && !hasFinalTask2) {
      return error(res, "At least one task must be completed. Both tasks cannot be empty.", 400);
    }

    // Validate word count for tasks that have content (not completely empty)
    // If task has content but doesn't meet minimum (50%), reject it
    if (task1Answer && task1Answer.word_count > 0) {
      const task1Question = test.writing_questions.find(q => q.task_number === 1);
      if (task1Question) {
        const minWords = Math.ceil(task1Question.word_limit * 0.5);
        if (task1Answer.word_count < minWords) {
          return error(res, `Task 1 has ${task1Answer.word_count} words, but needs at least ${minWords} words (50% of ${task1Question.word_limit}). Either complete the task or leave it completely empty.`, 400);
        }
      }
    }

    if (task2Answer && task2Answer.word_count > 0) {
      const task2Question = test.writing_questions.find(q => q.task_number === 2);
      if (task2Question) {
        const minWords = Math.ceil(task2Question.word_limit * 0.5);
        if (task2Answer.word_count < minWords) {
          return error(res, `Task 2 has ${task2Answer.word_count} words, but needs at least ${minWords} words (50% of ${task2Question.word_limit}). Either complete the task or leave it completely empty.`, 400);
        }
      }
    }

    // Prepare data for OpenAI evaluation (only evaluate NEW tasks)
    const submissionData = {};

    if (hasTask1Content && task1Answer.answer_text) {
      const task1Question = test.writing_questions.find(q => q.task_number === 1);
      submissionData.task1 = {
        question: task1Question?.question_text || '',
        answer: task1Answer.answer_text,
        wordCount: task1Answer.word_count
      };
    }

    if (hasTask2Content && task2Answer.answer_text) {
      const task2Question = test.writing_questions.find(q => q.task_number === 2);
      submissionData.task2 = {
        question: task2Question?.question_text || '',
        answer: task2Answer.answer_text,
        wordCount: task2Answer.word_count
      };
    }

    // Call OpenAI to evaluate ONLY if there are NEW tasks
    let newEvaluation = { task1: null, task2: null };
    if (Object.keys(submissionData).length > 0) {
      const aiEvaluation = await evaluateWritingTest(submissionData);

      if (!aiEvaluation.success) {
        return error(res, aiEvaluation.error || "Failed to evaluate test", 500);
      }

      newEvaluation = aiEvaluation.data;
    }

    // Merge evaluations: use new evaluation for new tasks, keep existing for unchanged tasks
    const finalEvaluation = {
      task1: hasTask1Content ? newEvaluation.task1 : (existingAiEval?.task1 || null),
      task2: hasTask2Content ? newEvaluation.task2 : (existingAiEval?.task2 || null)
    };

    // Calculate overall band score from merged evaluation
    const task1Band = finalEvaluation.task1?.overall_band || null;
    const task2Band = finalEvaluation.task2?.overall_band || null;
    const overallBand = calculateAverageBand(task1Band, task2Band);

    // Prepare final answers (use new or existing)
    const finalTask1Answer = hasTask1Content ? task1Answer.answer_text : (existingTask1?.answer_text || null);
    const finalTask1WordCount = hasTask1Content ? task1Answer.word_count : (existingTask1?.word_count || null);
    const finalTask2Answer = hasTask2Content ? task2Answer.answer_text : (existingTask2?.answer_text || null);
    const finalTask2WordCount = hasTask2Content ? task2Answer.word_count : (existingTask2?.word_count || null);

    // Save or update submission in database
    let submission;
    if (existingSubmission) {
      // Update existing submission
      submission = await prisma.writing_submissions.update({
        where: { id: existingSubmission.id },
        data: {
          task1_answer: finalTask1Answer,
          task1_word_count: finalTask1WordCount,
          task2_answer: finalTask2Answer,
          task2_word_count: finalTask2WordCount,
          time_taken: (existingSubmission.time_taken || 0) + (time_taken || 0),
          ai_evaluation: JSON.stringify(finalEvaluation),
          overall_band_score: overallBand,
          status: 'evaluated',
          updated_at: new Date()
        }
      });
    } else {
      // Create new submission
      submission = await prisma.writing_submissions.create({
        data: {
          user_id: BigInt(userId),
          test_id: BigInt(test_id),
          task1_answer: finalTask1Answer,
          task1_word_count: finalTask1WordCount,
          task2_answer: finalTask2Answer,
          task2_word_count: finalTask2WordCount,
          time_taken: time_taken || 0,
          ai_evaluation: JSON.stringify(finalEvaluation),
          overall_band_score: overallBand,
          status: 'evaluated',
          created_at: new Date(),
          updated_at: new Date()
        }
      });
    }

    // Return submission ID and results
    logInfo('Writing test submitted successfully', {
      userId,
      testId: test_id,
      submissionId: submission.id.toString(),
      overallBand,
      isUpdate: !!existingSubmission
    });
    success(res, {
      submission_id: submission.id.toString(),
      overall_band: overallBand,
      evaluation: finalEvaluation,
      is_update: !!existingSubmission,
      message: existingSubmission ? "Test updated and evaluated successfully" : "Test submitted and evaluated successfully"
    }, "Test submitted successfully");

  } catch (err) {
    logError("Failed to submit writing test", err, {
      userId: req.user?.id,
      testId: req.body.test_id,
      method: req.method,
      url: req.originalUrl
    });
    error(res, err.message || "Failed to submit test", 500);
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
        user_id: BigInt(userId)
      },
      orderBy: {
        created_at: "desc"
      }
    });

    // Format submissions for response
    const formattedSubmissions = submissions.map(submission => {
      // Parse AI evaluation from JSON string
      const aiEvaluation = submission.ai_evaluation
        ? JSON.parse(submission.ai_evaluation)
        : null;

      return {
        id: submission.id.toString(),
        user_id: submission.user_id.toString(),
        test_id: submission.test_id.toString(),
        task1_answer: submission.task1_answer,
        task1_word_count: submission.task1_word_count,
        task2_answer: submission.task2_answer,
        task2_word_count: submission.task2_word_count,
        time_taken: submission.time_taken,
        ai_evaluation: aiEvaluation,
        expert_score: submission.expert_score,
        expert_feedback: submission.expert_feedback,
        expert_feedback_sent: submission.expert_feedback_sent,
        overall_band_score: submission.overall_band_score,
        status: submission.status,
        created_at: submission.created_at,
        updated_at: submission.updated_at
      };
    });

    logInfo('User submissions fetched successfully', { userId, count: formattedSubmissions.length });
    success(res, formattedSubmissions, "Submissions fetched successfully");
  } catch (err) {
    logError("Failed to fetch user submissions", err, {
      userId: req.user?.id,
      method: req.method,
      url: req.originalUrl
    });
    error(res, err.message || "Failed to fetch submissions", 500);
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
        id: BigInt(submissionId)
      }
    });

    if (!submission) {
      return error(res, "Submission not found", 404);
    }

    // Check if submission belongs to user
    if (submission.user_id.toString() !== userId.toString()) {
      return error(res, "Unauthorized access", 403);
    }

    // Parse AI evaluation from JSON string
    const aiEvaluation = submission.ai_evaluation
      ? JSON.parse(submission.ai_evaluation)
      : null;

    // Format response
    const formattedSubmission = {
      id: submission.id.toString(),
      user_id: submission.user_id.toString(),
      test_id: submission.test_id.toString(),
      task1_answer: submission.task1_answer,
      task1_word_count: submission.task1_word_count,
      task2_answer: submission.task2_answer,
      task2_word_count: submission.task2_word_count,
      time_taken: submission.time_taken,
      ai_evaluation: aiEvaluation,
      expert_score: submission.expert_score,
      expert_feedback: submission.expert_feedback,
      expert_feedback_sent: submission.expert_feedback_sent,
      overall_band_score: submission.overall_band_score,
      status: submission.status,
      created_at: submission.created_at,
      updated_at: submission.updated_at
    };

    logInfo('Submission details fetched successfully', { userId, submissionId });
    success(res, formattedSubmission, "Submission details fetched successfully");
  } catch (err) {
    logError("Failed to fetch submission details", err, {
      userId: req.user?.id,
      submissionId: req.params.submissionId,
      method: req.method,
      url: req.originalUrl
    });
    error(res, err.message || "Failed to fetch submission details", 500);
  }
};