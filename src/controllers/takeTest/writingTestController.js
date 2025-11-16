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
        description: true,
        duration: true,
        total_marks: true,
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

        // Calculate average scores from AI evaluation
        let taskAchievement = 0, coherenceCohesion = 0, lexicalResource = 0, grammar = 0;

        if (aiEval) {
          if (aiEval.task1) {
            taskAchievement += aiEval.task1.task_achievement || 0;
            coherenceCohesion += aiEval.task1.coherence_cohesion || 0;
            lexicalResource += aiEval.task1.lexical_resource || 0;
            grammar += aiEval.task1.grammatical_accuracy || 0;
          }
          if (aiEval.task2) {
            taskAchievement += aiEval.task2.task_response || 0;
            coherenceCohesion += aiEval.task2.coherence_cohesion || 0;
            lexicalResource += aiEval.task2.lexical_resource || 0;
            grammar += aiEval.task2.grammatical_accuracy || 0;
          }

          const count = (aiEval.task1 ? 1 : 0) + (aiEval.task2 ? 1 : 0);
          if (count > 0) {
            taskAchievement /= count;
            coherenceCohesion /= count;
            lexicalResource /= count;
            grammar /= count;
          }
        }

        submission = {
          id: sub.id.toString(),
          overall_band_score: sub.overall_band_score || 0,
          task_achievement_score: taskAchievement,
          coherence_cohesion_score: coherenceCohesion,
          lexical_resource_score: lexicalResource,
          grammar_score: grammar,
          submitted_at: sub.created_at
        };
      }

      return {
        id: test.id.toString(),
        name: test.name,
        description: test.description,
        duration: test.duration,
        total_marks: test.total_marks,
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
        description: true,
        duration: true,
        total_marks: true,
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

        // Calculate average scores from AI evaluation
        let taskAchievement = 0, coherenceCohesion = 0, lexicalResource = 0, grammar = 0;

        if (aiEval) {
          if (aiEval.task1) {
            taskAchievement += aiEval.task1.task_achievement || 0;
            coherenceCohesion += aiEval.task1.coherence_cohesion || 0;
            lexicalResource += aiEval.task1.lexical_resource || 0;
            grammar += aiEval.task1.grammatical_accuracy || 0;
          }
          if (aiEval.task2) {
            taskAchievement += aiEval.task2.task_response || 0;
            coherenceCohesion += aiEval.task2.coherence_cohesion || 0;
            lexicalResource += aiEval.task2.lexical_resource || 0;
            grammar += aiEval.task2.grammatical_accuracy || 0;
          }

          const count = (aiEval.task1 ? 1 : 0) + (aiEval.task2 ? 1 : 0);
          if (count > 0) {
            taskAchievement /= count;
            coherenceCohesion /= count;
            lexicalResource /= count;
            grammar /= count;
          }
        }

        submission = {
          id: sub.id.toString(),
          overall_band_score: sub.overall_band_score || 0,
          task_achievement_score: taskAchievement,
          coherence_cohesion_score: coherenceCohesion,
          lexical_resource_score: lexicalResource,
          grammar_score: grammar,
          submitted_at: sub.created_at
        };
      }

      return {
        id: test.id.toString(),
        name: test.name,
        description: test.description,
        duration: test.duration,
        total_marks: test.total_marks,
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

    // Validate word count - must be at least 50% of word_limit
    if (task1Answer && task1Answer.answer_text) {
      const task1Question = test.writing_questions.find(q => q.task_number === 1);
      if (task1Question) {
        const minWords = Math.ceil(task1Question.word_limit * 0.5);
        if (task1Answer.word_count < minWords) {
          return error(res, `Task 1 must have at least ${minWords} words (50% of ${task1Question.word_limit})`, 400);
        }
      }
    }

    if (task2Answer && task2Answer.answer_text) {
      const task2Question = test.writing_questions.find(q => q.task_number === 2);
      if (task2Question) {
        const minWords = Math.ceil(task2Question.word_limit * 0.5);
        if (task2Answer.word_count < minWords) {
          return error(res, `Task 2 must have at least ${minWords} words (50% of ${task2Question.word_limit})`, 400);
        }
      }
    }

    // Prepare data for OpenAI evaluation
    const submissionData = {};

    if (task1Answer && task1Answer.answer_text) {
      const task1Question = test.writing_questions.find(q => q.task_number === 1);
      submissionData.task1 = {
        question: task1Question?.question_text || '',
        answer: task1Answer.answer_text,
        wordCount: task1Answer.word_count
      };
    }

    if (task2Answer && task2Answer.answer_text) {
      const task2Question = test.writing_questions.find(q => q.task_number === 2);
      submissionData.task2 = {
        question: task2Question?.question_text || '',
        answer: task2Answer.answer_text,
        wordCount: task2Answer.word_count
      };
    }

    // Call OpenAI to evaluate
    const aiEvaluation = await evaluateWritingTest(submissionData);

    if (!aiEvaluation.success) {
      return error(res, aiEvaluation.error || "Failed to evaluate test", 500);
    }

    // Calculate overall band score
    const task1Band = aiEvaluation.data.task1?.overall_band || null;
    const task2Band = aiEvaluation.data.task2?.overall_band || null;
    const overallBand = calculateAverageBand(task1Band, task2Band);

    // Save submission to database
    const submission = await prisma.writing_submissions.create({
      data: {
        user_id: BigInt(userId),
        test_id: BigInt(test_id),
        task1_answer: task1Answer?.answer_text || null,
        task1_word_count: task1Answer?.word_count || null,
        task2_answer: task2Answer?.answer_text || null,
        task2_word_count: task2Answer?.word_count || null,
        time_taken: time_taken || 0,
        ai_evaluation: JSON.stringify(aiEvaluation.data),
        overall_band_score: overallBand,
        status: 'evaluated',
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    // Return submission ID and results
    logInfo('Writing test submitted successfully', {
      userId,
      testId: test_id,
      submissionId: submission.id.toString(),
      overallBand
    });
    success(res, {
      submission_id: submission.id.toString(),
      overall_band: overallBand,
      evaluation: aiEvaluation.data,
      message: "Test submitted and evaluated successfully"
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