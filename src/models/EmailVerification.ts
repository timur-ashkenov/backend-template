import { Schema, model, Document } from 'mongoose';

export interface IEmailVerification extends Document {
    email: string;
    codeHash: string;
    expiresAt: Date;
    consumedAt: Date | null;
    lastSentAt: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
}

const EmailVerificationSchema = new Schema<IEmailVerification>(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            maxlength: 254,
        },
        codeHash: {
            type: String,
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: { expireAfterSeconds: 0 },
        },
        consumedAt: {
            type: Date,
            default: null,
        },
        lastSentAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        collection: 'email_verifications',
    }
);

EmailVerificationSchema.index({ email: 1, expiresAt: -1 });

export const EmailVerification = model<IEmailVerification>(
    'EmailVerification',
    EmailVerificationSchema
);

export default EmailVerification;
