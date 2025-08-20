import { EmailVerificationController } from '../../controllers/emailVerificationController';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { Router } from 'express';

const router = Router();

/**
 * @openapi
 * /auth/email/request:
 *   post:
 *     tags: [Auth]
 *     summary: Request verification code
 *     description: Generates a 6-digit code valid for ~1 hour and sends it to the given email. If a valid code was requested <60s ago, the request is accepted without re-sending.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmailRequest'
 *     responses:
 *       '200':
 *         description: Request accepted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthOk'
 *       '422':
 *         description: Invalid input (email missing/invalid)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
    '/auth/email/request',
    asyncHandler(EmailVerificationController.requestCode)
);

/**
 * @openapi
 * /auth/email/verify:
 *   post:
 *     tags: [Auth]
 *     summary: Verify code
 *     description: Verifies the 6-digit code for the given email. Codes are single-use and expire in ~1 hour.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmailVerifyRequest'
 *     responses:
 *       '200':
 *         description: Code is valid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthVerifyOk'
 *       '401':
 *         description: Invalid or expired code
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *           examples:
 *             invalid:
 *               value: { error: "invalid_code" }
 *             expired:
 *               value: { error: "expired_code" }
 *       '422':
 *         description: Invalid input (email/code missing or malformed)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
    '/auth/email/verify',
    asyncHandler(EmailVerificationController.verifyCode)
);

export default router;
