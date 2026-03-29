import { prisma } from "../../config/prismaClient.js";
import { success, error } from "../../utils/response.js";
import { evaluateWritingTest } from "../../services/openaiService.js";
import { logError, logInfo, logDebug } from "../../utils/logger.js";
import { sendEmail } from "../../services/emailService.js";

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
      where: { id: BigInt(submission_id) },
      include: {
        tests: {
          select: {
            id: true,
            name: true,
            type: true,
            category: true
          }
        }
      }
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

    // Fetch user details for email
    const user = await prisma.users.findUnique({
      where: { id: BigInt(userId) }
    });

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

    // 📧 Send email to USER confirming request
    const userFirstName = (user?.name || "there").split(" ")[0];
    const testName = submission.tests?.name || "Writing Test";
    const aiScore = submission.overall_band_score || 0;
    const resultsUrl = `${process.env.FRONTEND_URL}/writing-test-results/${submission_id}`;
    const myReviewsUrl = `${process.env.FRONTEND_URL}/my-expert-reviews`;

    sendEmail({
      to: user?.email,
      subject: `Expert Review Requested - ${testName}`,
      title: "Expert Review Requested ✓",
      previewText: `Your expert review request for ${testName} has been submitted.`,
      body: `
        <p style="margin:0 0 16px 0;">Hi <strong>${userFirstName}</strong>,</p>
        <p style="margin:0 0 16px 0;">
          Thank you for requesting an expert review. We've received your request and our expert reviewers are reviewing your submission.
        </p>

        <div style="background:#f3fafb;border-left:4px solid #06bbcc;padding:16px;margin:20px 0;border-radius:4px;">
          <p style="margin:0 0 12px 0;font-weight:600;color:#101828;"><strong>📝 Test Details</strong></p>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:8px 0;color:#667085;">Test Name:</td>
              <td style="padding:8px 0;color:#101828;font-weight:600;">${testName}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#667085;">AI Score:</td>
              <td style="padding:8px 0;color:#06bbcc;font-weight:600;font-size:16px;">${aiScore.toFixed(1)}/9.0</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#667085;">Submission Date:</td>
              <td style="padding:8px 0;color:#101828;">${new Date(submission.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#667085;">Status:</td>
              <td style="padding:8px 0;"><span style="background:#fff3cd;color:#856404;padding:4px 8px;border-radius:4px;font-weight:600;font-size:12px;">⏳ Pending Review</span></td>
            </tr>
          </table>
        </div>

        <p style="margin:0 0 16px 0;color:#667085;">
          Our expert reviewers typically review submissions within <strong>24-48 hours</strong>. You'll receive an email notification as soon as your review is complete.
        </p>

        <p style="margin:0;color:#667085;">
          In the meantime, you can track your review status in your dashboard.
        </p>
      `,
      button: { text: "View My Reviews", url: myReviewsUrl },
      footerNote: "You'll be notified by email when your expert review is complete.",
    }).catch((err) => logError("User notification email failed", err, { userId, submissionId: submission_id }));

    // 📧 Send email to ADMIN with review request details
    const adminEmail = process.env.ADMIN_EMAIL;
    
    if (adminEmail) {
      const adminUrl = `${process.env.FRONTEND_URL}/admin/expert-reviews/${reviewRequest.id}`;
      
      sendEmail({
        to: adminEmail,
        subject: `New Expert Review Request - ${testName} by ${user?.name}`,
        title: "New Expert Review Request 📋",
        previewText: `A new expert review request has been submitted for ${testName}.`,
        body: `
          <p style="margin:0 0 16px 0;">Hello Admin,</p>
          <p style="margin:0 0 16px 0;">
            A new expert review request has been submitted and requires your attention.
          </p>

          <div style="background:#e7f5ff;border-left:4px solid #06bbcc;padding:16px;margin:20px 0;border-radius:4px;">
            <p style="margin:0 0 12px 0;font-weight:600;color:#101828;"><strong>👤 Student Information</strong></p>
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:8px 0;color:#667085;">Student Name:</td>
                <td style="padding:8px 0;color:#101828;font-weight:600;">${user?.name || "Unknown"}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#667085;">Email:</td>
                <td style="padding:8px 0;color:#101828;">${user?.email || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#667085;">Test Name:</td>
                <td style="padding:8px 0;color:#101828;font-weight:600;">${testName}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#667085;">AI Evaluation Score:</td>
                <td style="padding:8px 0;color:#06bbcc;font-weight:600;font-size:16px;">${aiScore.toFixed(1)}/9.0</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#667085;">Request Time:</td>
                <td style="padding:8px 0;color:#101828;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
              </tr>
            </table>
          </div>

          <div style="background:#f0f9ff;border-left:4px solid #0891b2;padding:16px;margin:20px 0;border-radius:4px;">
            <p style="margin:0 0 12px 0;font-weight:600;color:#101828;"><strong>📄 What You Need to Do</strong></p>
            <ol style="margin:0;padding-left:20px;color:#667085;">
              <li style="margin:8px 0;">Review the student's writing submission</li>
              <li style="margin:8px 0;">Evaluate grammar, structure, vocabulary, and fluency</li>
              <li style="margin:8px 0;">Assign an expert band score (0-9)</li>
              <li style="margin:8px 0;">Provide detailed feedback and recommendations</li>
              <li style="margin:8px 0;">Submit your review in the system</li>
            </ol>
          </div>

          <p style="margin:0 0 16px 0;color:#667085;">
            Click the button below to view the complete submission and start your review.
          </p>
        `,
        button: { text: "Review Submission", url: adminUrl },
        footerNote: "This review request is awaiting your expert evaluation.",
      }).catch((err) => logError("Admin notification email failed", err, { submissionId: submission_id, adminEmail }));
    }

    logInfo('Expert review requested successfully with emails sent', {
      userId,
      submissionId: submission_id,
      reviewRequestId: reviewRequest.id.toString(),
      userEmailSent: true,
      adminEmailSent: !!adminEmail
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

    // Find review request with related data
    const reviewRequest = await prisma.expert_review_requests.findUnique({
      where: { id: BigInt(requestId) },
      include: {
        writing_submissions: {
          include: {
            tests: {
              select: {
                id: true,
                name: true,
                type: true
              }
            }
          }
        }
      }
    });

    if (!reviewRequest) {
      return error(res, "Review request not found", 404);
    }

    // Fetch user details for email
    const user = await prisma.users.findUnique({
      where: { id: reviewRequest.user_id }
    });

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

    // 📧 Send completion email to USER
    const userFirstName = (user?.name || "there").split(" ")[0];
    const testName = reviewRequest.writing_submissions.tests?.name || "Writing Test";
    const aiScore = reviewRequest.writing_submissions.overall_band_score || 0;
    const expertScore = parseFloat(expert_overall_score);
    const resultUrl = `${process.env.FRONTEND_URL}/writing-test-results/${reviewRequest.submission_id}`;
    
    // Extract feedback text from expert_evaluation
    let feedbackSummary = "";
    if (typeof expert_evaluation === 'object') {
      feedbackSummary = expert_evaluation.overall_feedback || expert_evaluation.summary || "See detailed feedback in your results.";
    } else {
      feedbackSummary = String(expert_evaluation);
    }

    const scoreDifference = (expertScore - aiScore).toFixed(1);
    const scoreComparison = expertScore > aiScore ? `Higher than AI score (${scoreDifference} points)` : expertScore < aiScore ? `Lower than AI score (${scoreDifference} points)` : "Matches AI score";

    sendEmail({
      to: user?.email,
      subject: `Expert Review Complete - ${testName}`,
      title: "Your Expert Review is Ready! 🎉",
      previewText: `Your expert review for ${testName} has been completed. Your expert score: ${expertScore}/9.0`,
      body: `
        <p style="margin:0 0 16px 0;">Hi <strong>${userFirstName}</strong>,</p>
        <p style="margin:0 0 16px 0;">
          Great news! Your expert review has been completed by our IELTS expert. See your detailed evaluation below.
        </p>

        <div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:16px;margin:20px 0;border-radius:4px;">
          <p style="margin:0 0 12px 0;font-weight:600;color:#101828;"><strong>✅ Review Complete</strong></p>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:10px 0;color:#667085;">Test Name:</td>
              <td style="padding:10px 0;color:#101828;font-weight:600;">${testName}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#667085;">AI Score:</td>
              <td style="padding:10px 0;color:#06bbcc;font-weight:600;">${aiScore.toFixed(1)}/9.0</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#667085;"><strong>Expert Score:</strong></td>
              <td style="padding:10px 0;color:#22c55e;font-weight:700;font-size:18px;"><strong>${expertScore}/9.0</strong></td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#667085;">Score Comparison:</td>
              <td style="padding:10px 0;color:#101828;"><span style="background:#f3e8ff;color:#6b21a8;padding:4px 8px;border-radius:4px;font-weight:600;font-size:12px;">${scoreComparison}</span></td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#667085;">Review Date:</td>
              <td style="padding:10px 0;color:#101828;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
            </tr>
          </table>
        </div>

        <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:16px;margin:20px 0;border-radius:4px;">
          <p style="margin:0 0 12px 0;font-weight:600;color:#101828;"><strong>📝 Expert Feedback Summary</strong></p>
          <p style="margin:0;color:#667085;line-height:1.6;">${feedbackSummary}</p>
        </div>

        <p style="margin:0 0 16px 0;color:#667085;">
          Click the button below to view your complete expert evaluation with detailed feedback on grammar, vocabulary, task achievement, and coherence.
        </p>

        <div style="background:#f9fafb;padding:16px;border-radius:4px;margin:20px 0;">
          <p style="margin:0 0 8px 0;font-weight:600;color:#101828;">💡 Next Steps:</p>
          <ul style="margin:0;padding-left:20px;color:#667085;">
            <li style="margin:6px 0;">Review the expert feedback thoroughly</li>
            <li style="margin:6px 0;">Note areas for improvement</li>
            <li style="margin:6px 0;">Practice with focus on weak areas</li>
            <li style="margin:6px 0;">Take another practice test</li>
          </ul>
        </div>
      `,
      button: { text: "View Full Review", url: resultUrl },
      footerNote: "Keep practicing! You're making great progress.",
    }).catch((err) => logError("User completion email failed", err, { userId: reviewRequest.user_id, submissionId: reviewRequest.submission_id }));

    logInfo('Expert review submitted successfully with completion email sent', {
      requestId,
      status: status || 'completed',
      userEmail: user?.email,
      expertScore
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
