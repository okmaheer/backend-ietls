import { prisma } from "../config/prismaClient.js";
import { success, error } from "../utils/response.js";
import { logError, logInfo, logDebug } from "../utils/logger.js";
import {
  generateTransactionId,
  buildPaymentUrl,
  isPaymentSuccessful
} from "../services/swichnowService.js";

/**
 * POST /api/payment/initiate
 * Authenticated user initiates a premium subscription payment.
 * Returns the Swichnow payment URL for frontend redirect.
 */
export const initiatePayment = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return error(res, new Error("User not authenticated"), 401);

    // Check if user is already paid
    const user = await prisma.users.findUnique({ where: { id: BigInt(userId) } });
    if (!user) return error(res, new Error("User not found"), 404);

    if (user.is_user_paid) {
      return error(res, new Error("You already have a premium subscription"), 400);
    }

    const transactionId = generateTransactionId(userId.toString());
    const amount = process.env.SUBSCRIPTION_PRICE || '500.00';
    const item = process.env.SUBSCRIPTION_ITEM_NAME || 'IELTS Premium Subscription';

    // Save transaction to database
    await prisma.payment_transactions.create({
      data: {
        user_id: BigInt(userId),
        transaction_id: transactionId,
        amount: parseFloat(amount),
        currency: process.env.SUBSCRIPTION_CURRENCY || 'PKR',
        item: item,
        payment_status: 'pending',
        created_at: new Date(),
        updated_at: new Date(),
      }
    });

    const paymentUrl = buildPaymentUrl({
      transactionId,
      item,
      amount,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone || '',
      successRedirectUrl: `${process.env.FRONTEND_URL}/payment/callback`,
    });

    logInfo('Payment initiated', { userId: userId.toString(), transactionId, amount, paymentUrl });
    return success(res, { paymentUrl, transactionId }, "Payment URL generated");
  } catch (err) {
    logError("Failed to initiate payment", err, { userId: req.user?.id });
    return error(res, new Error("Failed to initiate payment"), 500);
  }
};

/**
 * GET/POST /api/payment/callback
 * Handles the redirect from Swichnow after payment.
 * Updates transaction status and user's is_user_paid flag.
 * Mirrors: swichnow-donation.php lines 1044-1112
 */
export const paymentCallback = async (req, res) => {
  try {
    // Extract callback params (check both cases as in PHP plugin lines 1054-1084)
    const transactionId = req.query.customerTransactionId
      || req.query.CustomerTransactionId
      || req.body?.customerTransactionId
      || req.body?.CustomerTransactionId;

    const status = req.query.status
      || req.query.Status
      || req.body?.status
      || req.body?.Status;

    const paymentMethod = req.query.paymentMethod
      || req.query.PaymentMethod
      || req.body?.paymentMethod
      || req.body?.PaymentMethod;

    logInfo('Payment callback received', {
      transactionId,
      status,
      paymentMethod,
      rawQuery: req.query,
      rawBody: req.body,
    });

    if (!transactionId || !status) {
      logError('Payment callback - missing required fields', null, {
        rawQuery: req.query,
        rawBody: req.body,
      });
      return error(res, new Error("Missing transaction ID or status"), 400);
    }

    // Find the transaction
    const transaction = await prisma.payment_transactions.findUnique({
      where: { transaction_id: transactionId }
    });

    if (!transaction) {
      logError("Payment callback - transaction not found", null, { transactionId });
      return error(res, new Error("Transaction not found"), 404);
    }

    // Update transaction status
    const updateData = {
      payment_status: status.toLowerCase(),
      updated_at: new Date(),
      swichnow_response: JSON.stringify(req.query || req.body),
    };
    if (paymentMethod) updateData.payment_method = paymentMethod;

    await prisma.payment_transactions.update({
      where: { transaction_id: transactionId },
      data: updateData,
    });

    logInfo('Payment callback - status saved', {
      transactionId,
      status: status.toLowerCase(),
      isSuccess: isPaymentSuccessful(status),
      paymentMethod: paymentMethod || 'N/A',
    });

    // If payment is successful, activate user with 30-day access
    if (isPaymentSuccessful(status)) {
      await prisma.users.update({
        where: { id: transaction.user_id },
        data: {
          is_user_paid:    true,
          status:          '1',
          access_given_at: new Date(),
          duration:        '2', // 30 days (matches Laravel duration map)
          updated_at:      new Date(),
        },
      });
      logInfo('User activated with 30-day premium access', {
        userId: transaction.user_id.toString(),
        transactionId
      });
    }

    // Return status (frontend will handle display)
    return success(res, {
      transactionId,
      status: status.toLowerCase(),
      isSuccess: isPaymentSuccessful(status)
    }, "Payment status updated");
  } catch (err) {
    logError("Payment callback error", err);
    return error(res, new Error("Payment callback processing failed"), 500);
  }
};

/**
 * GET /api/payment/status/:transactionId
 * Check payment status for a specific transaction.
 */
export const getPaymentStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user?.id;

    const transaction = await prisma.payment_transactions.findUnique({
      where: { transaction_id: transactionId }
    });

    if (!transaction) return error(res, new Error("Transaction not found"), 404);

    // Ensure user owns this transaction
    if (transaction.user_id.toString() !== userId.toString()) {
      return error(res, new Error("Unauthorized"), 403);
    }

    return success(res, {
      transactionId: transaction.transaction_id,
      status: transaction.payment_status,
      amount: transaction.amount,
      currency: transaction.currency,
      isSuccess: isPaymentSuccessful(transaction.payment_status),
      createdAt: transaction.created_at,
    }, "Payment status fetched");
  } catch (err) {
    logError("Failed to fetch payment status", err);
    return error(res, new Error("Failed to fetch payment status"), 500);
  }
};

/**
 * GET /api/payment/subscription-info
 * Returns subscription details: price, currency, and available paid test counts.
 * Called by frontend to populate the PremiumModal.
 */
export const getSubscriptionInfo = async (req, res) => {
  try {
    // Count active paid tests (type=2) by category
    const paidWritingTestCounts = await prisma.tests.groupBy({
      by: ['category'],
      where: {
        status: 1,
        type: 2,
        writing_questions: { some: {} }
      },
      _count: { id: true }
    });

    const testCounts = {
      academicWriting: 0,
      generalTrainingWriting: 0,
    };

    paidWritingTestCounts.forEach(group => {
      if (group.category === 1) testCounts.academicWriting = group._count.id;
      if (group.category === 2) testCounts.generalTrainingWriting = group._count.id;
    });

    return success(res, {
      price: process.env.SUBSCRIPTION_PRICE || '500.00',
      currency: process.env.SUBSCRIPTION_CURRENCY || 'PKR',
      itemName: process.env.SUBSCRIPTION_ITEM_NAME || 'IELTS Premium Subscription',
      testCounts,
    }, "Subscription info fetched");
  } catch (err) {
    logError("Failed to fetch subscription info", err);
    return error(res, new Error("Failed to fetch subscription info"), 500);
  }
};
