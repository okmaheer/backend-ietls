import { prisma } from "../../config/prismaClient.js";
import { success, error } from "../../utils/response.js";
import { evaluateWritingTest } from "../../services/openaiService.js";
import { logError, logInfo, logDebug } from "../../utils/logger.js";

// 📝 Request expert review for a submission
export const requestExpertReview = async (req, res) => {
  try {
    const { submission_id } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return error(res, "User not authenticated", 401);
    }

    if (!submission_id) {
      return error(res, "Submission ID is required", 400);
    }

    // Check if submission exists and belongs to user
    const submission = await prisma.writing_submissions.findUnique({
      where: { id: BigInt(submission_id) }
    });

    if (!submission) {
      return error(res, "Submission not found", 404);
    }

    if (submission.user_id.toString() !== userId.toString()) {
      return error(res, "Unauthorized access", 403);
    }

    // Check if expert review already requested for this submission
    const existingRequest = await prisma.expert_review_requests.findUnique({
      where: { submission_id: BigInt(submission_id) }
    });

    if (existingRequest) {
      return error(res, "Expert review already requested for this test", 409);
    }

    // Create expert review request
    const reviewRequest = await prisma.expert_review_requests.create({
      data: {
        submission_id: BigInt(submission_id),
        user_id: BigInt(userId),
        status: 'pending',
        requested_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    logInfo('Expert review requested successfully', {
      userId,
      submissionId: submission_id,
      reviewRequestId: reviewRequest.id.toString()
    });

    success(res, {
      id: reviewRequest.id.toString(),
      submission_id: reviewRequest.submission_id.toString(),
      status: reviewRequest.status,
      requested_at: reviewRequest.requested_at,
      message: "Expert review requested successfully"
    }, "Expert review requested successfully");

  } catch (err) {
    logError("Failed to request expert review", err, {
      userId: req.user?.id,
      submissionId: req.body.submission_id,
      method: req.method,
      url: req.originalUrl
    });
    error(res, err.message || "Failed to request expert review", 500);
  }
};

// 📊 Get all expert review requests for a user
export const getUserReviewRequests = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return error(res, "User not authenticated", 401);
    }

    const requests = await prisma.expert_review_requests.findMany({
      where: {
        user_id: BigInt(userId)
      },
      include: {
        writing_submissions: {
          select: {
            id: true,
            test_id: true,
            overall_band_score: true,
            expert_score: true,
            expert_feedback: true,
            expert_feedback_sent: true,
            created_at: true
          }
        }
      },
      orderBy: {
        requested_at: 'desc'
      }
    });

    // Format response
    const formattedRequests = requests.map(request => ({
      id: request.id.toString(),
      submission_id: request.submission_id.toString(),
      user_id: request.user_id.toString(),
      status: request.status,
      requested_at: request.requested_at,
      reviewed_at: request.reviewed_at,
      admin_notes: request.admin_notes,
      submission: {
        id: request.writing_submissions.id.toString(),
        test_id: request.writing_submissions.test_id.toString(),
        overall_band_score: request.writing_submissions.overall_band_score,
        expert_score: request.writing_submissions.expert_score,
        expert_feedback: request.writing_submissions.expert_feedback,
        expert_feedback_sent: request.writing_submissions.expert_feedback_sent,
        created_at: request.writing_submissions.created_at
      }
    }));

    logInfo('User review requests fetched successfully', {
      userId,
      count: formattedRequests.length
    });

    success(res, formattedRequests, "Review requests fetched successfully");

  } catch (err) {
    logError("Failed to fetch review requests", err, {
      userId: req.user?.id,
      method: req.method,
      url: req.originalUrl
    });
    error(res, err.message || "Failed to fetch review requests", 500);
  }
};

// 📄 Get single review request details
export const getReviewRequestDetails = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return error(res, "User not authenticated", 401);
    }

    const request = await prisma.expert_review_requests.findUnique({
      where: { id: BigInt(requestId) },
      include: {
        writing_submissions: true
      }
    });

    if (!request) {
      return error(res, "Review request not found", 404);
    }

    if (request.user_id.toString() !== userId.toString()) {
      return error(res, "Unauthorized access", 403);
    }

    // Format response
    const formattedRequest = {
      id: request.id.toString(),
      submission_id: request.submission_id.toString(),
      user_id: request.user_id.toString(),
      status: request.status,
      requested_at: request.requested_at,
      reviewed_at: request.reviewed_at,
      admin_notes: request.admin_notes,
      submission: {
        id: request.writing_submissions.id.toString(),
        test_id: request.writing_submissions.test_id.toString(),
        overall_band_score: request.writing_submissions.overall_band_score,
        expert_score: request.writing_submissions.expert_score,
        expert_feedback: request.writing_submissions.expert_feedback,
        expert_feedback_sent: request.writing_submissions.expert_feedback_sent
      }
    };

    logInfo('Review request details fetched successfully', {
      userId,
      requestId
    });

    success(res, formattedRequest, "Review request details fetched successfully");

  } catch (err) {
    logError("Failed to fetch review request details", err, {
      userId: req.user?.id,
      requestId: req.params.requestId,
      method: req.method,
      url: req.originalUrl
    });
    error(res, err.message || "Failed to fetch review request details", 500);
  }
};

// ✅ Check if expert review exists for a submission
export const checkExpertReviewStatus = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return error(res, "User not authenticated", 401);
    }

    // Check if submission belongs to user
    const submission = await prisma.writing_submissions.findUnique({
      where: { id: BigInt(submissionId) }
    });

    if (!submission) {
      return error(res, "Submission not found", 404);
    }

    if (submission.user_id.toString() !== userId.toString()) {
      return error(res, "Unauthorized access", 403);
    }

    // Check for existing review request
    const reviewRequest = await prisma.expert_review_requests.findUnique({
      where: { submission_id: BigInt(submissionId) }
    });

    if (reviewRequest) {
      success(res, {
        has_request: true,
        request_id: reviewRequest.id.toString(),
        status: reviewRequest.status,
        requested_at: reviewRequest.requested_at,
        reviewed_at: reviewRequest.reviewed_at
      }, "Review request exists");
    } else {
      success(res, {
        has_request: false
      }, "No review request found");
    }

  } catch (err) {
    logError("Failed to check review status", err, {
      userId: req.user?.id,
      submissionId: req.params.submissionId,
      method: req.method,
      url: req.originalUrl
    });
    error(res, err.message || "Failed to check review status", 500);
  }
};

// 👨‍💼 ADMIN: Get all expert review requests
export const getAllReviewRequests = async (req, res) => {
  try {
    const { status } = req.query;

    // Build filter conditions
    const whereConditions = {};
    if (status && status !== 'all') {
      whereConditions.status = status;
    }

    const requests = await prisma.expert_review_requests.findMany({
      where: whereConditions,
      include: {
        writing_submissions: {
          include: {
            tests: {
              include: {
                writing_questions: {
                  orderBy: { task_number: 'asc' }
                }
              }
            }
          }
        }
      },
      orderBy: {
        requested_at: 'desc'
      }
    });

    // Format response
    const formattedRequests = requests.map(request => ({
      id: request.id.toString(),
      submission_id: request.submission_id.toString(),
      user_id: request.user_id.toString(),
      status: request.status,
      requested_at: request.requested_at,
      reviewed_at: request.reviewed_at,
      admin_notes: request.admin_notes,
      submission: {
        id: request.writing_submissions.id.toString(),
        test_id: request.writing_submissions.test_id.toString(),
        task1_answer: request.writing_submissions.task1_answer,
        task1_word_count: request.writing_submissions.task1_word_count,
        task2_answer: request.writing_submissions.task2_answer,
        task2_word_count: request.writing_submissions.task2_word_count,
        time_taken: request.writing_submissions.time_taken,
        ai_evaluation: request.writing_submissions.ai_evaluation ? JSON.parse(request.writing_submissions.ai_evaluation) : null,
        overall_band_score: request.writing_submissions.overall_band_score,
        expert_score: request.writing_submissions.expert_score,
        expert_feedback: request.writing_submissions.expert_feedback,
        expert_feedback_sent: request.writing_submissions.expert_feedback_sent,
        created_at: request.writing_submissions.created_at,
        test: {
          id: request.writing_submissions.tests.id.toString(),
          title: request.writing_submissions.tests.name,
          category: request.writing_submissions.tests.category,
          questions: request.writing_submissions.tests.writing_questions.map(q => ({
            id: q.id.toString(),
            task_number: q.task_number,
            question_text: q.question_text,
            word_limit: q.word_limit
          }))
        }
      }
    }));

    logInfo('All review requests fetched successfully (admin)', {
      count: formattedRequests.length,
      status: status || 'all'
    });

    success(res, formattedRequests, "Review requests fetched successfully");

  } catch (err) {
    logError("Failed to fetch all review requests (admin)", err, {
      status: req.query.status,
      method: req.method,
      url: req.originalUrl
    });
    error(res, err.message || "Failed to fetch review requests", 500);
  }
};

// 👨‍💼 ADMIN: Get single review request details
export const getReviewRequestDetailsAdmin = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await prisma.expert_review_requests.findUnique({
      where: { id: BigInt(requestId) },
      include: {
        writing_submissions: {
          include: {
            tests: {
              include: {
                writing_questions: {
                  orderBy: { task_number: 'asc' }
                }
              }
            }
          }
        }
      }
    });

    if (!request) {
      return error(res, "Review request not found", 404);
    }

    // Format response
    const formattedRequest = {
      id: request.id.toString(),
      submission_id: request.submission_id.toString(),
      user_id: request.user_id.toString(),
      status: request.status,
      requested_at: request.requested_at,
      reviewed_at: request.reviewed_at,
      admin_notes: request.admin_notes,
      submission: {
        id: request.writing_submissions.id.toString(),
        test_id: request.writing_submissions.test_id.toString(),
        task1_answer: request.writing_submissions.task1_answer,
        task1_word_count: request.writing_submissions.task1_word_count,
        task2_answer: request.writing_submissions.task2_answer,
        task2_word_count: request.writing_submissions.task2_word_count,
        time_taken: request.writing_submissions.time_taken,
        ai_evaluation: request.writing_submissions.ai_evaluation ? JSON.parse(request.writing_submissions.ai_evaluation) : null,
        overall_band_score: request.writing_submissions.overall_band_score,
        expert_score: request.writing_submissions.expert_score,
        expert_feedback: request.writing_submissions.expert_feedback,
        expert_feedback_sent: request.writing_submissions.expert_feedback_sent,
        created_at: request.writing_submissions.created_at,
        test: {
          id: request.writing_submissions.tests.id.toString(),
          title: request.writing_submissions.tests.name,
          category: request.writing_submissions.tests.category,
          questions: request.writing_submissions.tests.writing_questions.map(q => ({
            id: q.id.toString(),
            task_number: q.task_number,
            question_text: q.question_text,
            word_limit: q.word_limit
          }))
        }
      }
    };

    logInfo('Review request details fetched successfully (admin)', {
      requestId
    });

    success(res, formattedRequest, "Review request details fetched successfully");

  } catch (err) {
    logError("Failed to fetch review request details (admin)", err, {
      requestId: req.params.requestId,
      method: req.method,
      url: req.originalUrl
    });
    error(res, err.message || "Failed to fetch review request details", 500);
  }
};

// 👨‍💼 ADMIN: Submit expert review
export const submitExpertReview = async (req, res) => {
  try {
    const { requestId } = req.params;
    const {
      expert_evaluation,
      expert_overall_score,
      admin_notes,
      status
    } = req.body;

    // Validate required fields
    if (!expert_evaluation || !expert_overall_score) {
      return error(res, "Expert evaluation and overall score are required", 400);
    }

    // Find review request
    const reviewRequest = await prisma.expert_review_requests.findUnique({
      where: { id: BigInt(requestId) }
    });

    if (!reviewRequest) {
      return error(res, "Review request not found", 404);
    }

    // Update submission with expert review
    await prisma.writing_submissions.update({
      where: { id: reviewRequest.submission_id },
      data: {
        expert_feedback: JSON.stringify(expert_evaluation),
        expert_score: parseFloat(expert_overall_score),
        expert_feedback_sent: true,
        updated_at: new Date()
      }
    });

    // Update review request status
    await prisma.expert_review_requests.update({
      where: { id: BigInt(requestId) },
      data: {
        status: status || 'completed',
        reviewed_at: new Date(),
        admin_notes: admin_notes || null,
        updated_at: new Date()
      }
    });

    logInfo('Expert review submitted successfully', {
      requestId,
      status: status || 'completed'
    });

    success(res, {
      request_id: requestId,
      status: status || 'completed',
      message: "Expert review submitted successfully"
    }, "Expert review submitted successfully");

  } catch (err) {
    logError("Failed to submit expert review", err, {
      requestId: req.params.requestId,
      method: req.method,
      url: req.originalUrl
    });
    error(res, err.message || "Failed to submit expert review", 500);
  }
};

// 👨‍💼 ADMIN: Update review request status
export const updateReviewRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, admin_notes } = req.body;

    if (!status) {
      return error(res, "Status is required", 400);
    }

    const validStatuses = ['pending', 'in_progress', 'completed', 'rejected'];
    if (!validStatuses.includes(status)) {
      return error(res, "Invalid status value", 400);
    }

    const reviewRequest = await prisma.expert_review_requests.findUnique({
      where: { id: BigInt(requestId) }
    });

    if (!reviewRequest) {
      return error(res, "Review request not found", 404);
    }

    const updateData = {
      status,
      admin_notes: admin_notes || reviewRequest.admin_notes,
      updated_at: new Date()
    };

    // If marking as completed or rejected, set reviewed_at
    if (status === 'completed' || status === 'rejected') {
      updateData.reviewed_at = new Date();
    }

    const updatedRequest = await prisma.expert_review_requests.update({
      where: { id: BigInt(requestId) },
      data: updateData
    });

    logInfo('Review request status updated successfully', {
      requestId,
      status: updatedRequest.status
    });

    success(res, {
      id: updatedRequest.id.toString(),
      status: updatedRequest.status,
      reviewed_at: updatedRequest.reviewed_at,
      admin_notes: updatedRequest.admin_notes
    }, "Review request status updated successfully");

  } catch (err) {
    logError("Failed to update review request status", err, {
      requestId: req.params.requestId,
      status: req.body.status,
      method: req.method,
      url: req.originalUrl
    });
    error(res, err.message || "Failed to update review request status", 500);
  }
};
