import { EmailVerificationController } from '../../controllers/emailVerificationController';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { Router } from 'express';

const router = Router();

router.post('/auth/email/request', asyncHandler(EmailVerificationController.requestCode));

router.post('/auth/email/verify', asyncHandler(EmailVerificationController.verifyCode));

export default router;