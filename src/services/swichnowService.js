import crypto from 'crypto';
import { logInfo, logDebug } from '../utils/logger.js';

const SUCCESS_STATUSES = ['success', 'successful', 'paid', 'completed'];

/**
 * Generate HMAC-SHA256 checksum per Swichnow docs.
 * Formula: hash_hmac('sha256', "Swich:{transactionId}:{item}:{amount}", secretKey)
 * Reference: swichnow-donation.php line 720-721
 */
export const generateChecksum = (transactionId, item, amount) => {
  const secretKey = process.env.SWICHNOW_SECRET_KEY;
  const checksumString = `Swich:${transactionId}:${item}:${amount}`;
  logDebug('Generating checksum', { checksumString, secretKeyLength: secretKey?.length });
  return crypto.createHmac('sha256', secretKey).update(checksumString).digest('hex');
};

/**
 * Generate unique transaction ID (max 50 chars).
 * Format: SUB_{userId}_{timestamp}_{random4digits}
 * Reference: swichnow-donation.php line 716
 */
export const generateTransactionId = (userId) => {
  return `SUB_${userId}_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
};

/**
 * Build the full Swichnow payment URL with query parameters.
 * Reference: swichnow-donation.php lines 724-741
 */
export const buildPaymentUrl = ({ transactionId, item, amount, userName, userEmail, userPhone, successRedirectUrl }) => {
  const gatewayUrl = process.env.SWICHNOW_GATEWAY_URL || 'https://payin-pwa.swichnow.com';
  const currency = process.env.SUBSCRIPTION_CURRENCY || 'PKR';
  const formattedAmount = parseFloat(amount).toFixed(2);

  const checksum = generateChecksum(transactionId, item, formattedAmount);

  const params = new URLSearchParams({
    clientId: process.env.SWICHNOW_CLIENT_ID,
    customerTransactionId: transactionId,
    item: item.substring(0, 500),
    amount: formattedAmount,
    channel: '0',
    billReferenceNo: transactionId,
    description: item,
    PayeeName: userName,
    Email: userEmail,
    MSISDN: userPhone || '',
    currency: currency,
    checksum: checksum,
    successRedirectUrl: successRedirectUrl,
  });

  const paymentUrl = `${gatewayUrl}/?${params.toString()}`;
  logInfo('Payment URL built', { transactionId, amount: formattedAmount, currency });
  return paymentUrl;
};

/**
 * Check if a payment callback status indicates success.
 * Reference: swichnow-donation.php line 1106
 */
export const isPaymentSuccessful = (status) => {
  return SUCCESS_STATUSES.includes(status?.toLowerCase());
};
