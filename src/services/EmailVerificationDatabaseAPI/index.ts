import { NotFoundError } from '../../errors';
import {
    IEmailVerification,
    EmailVerification,
} from '../../models/EmailVerification';

export class EmailVerificationDatabaseAPI {
    public static async findActiveByEmail(
        email: string
    ): Promise<IEmailVerification | null> {
        const activeRecord = await EmailVerification.findOne({
            email,
            consumedAt: null,
            expiresAt: { $gt: new Date() },
        })
            .sort({ expiresAt: -1 })
            .exec();

        return activeRecord;
    }

    static async deleteById(id: string): Promise<void> {
        await EmailVerification.deleteOne({ _id: id }).exec();
    }

    public static async createNew(params: {
        email: string;
        codeHash: string;
        expiresAt: Date;
    }): Promise<IEmailVerification> {
        const doc = await EmailVerification.create({
            email: params.email,
            codeHash: params.codeHash,
            expiresAt: params.expiresAt,
            consumedAt: null,
        });

        return doc;
    }

    static async updateActiveByEmail(
        email: string,
        patch: { codeHash: string; expiresAt: Date }
    ) {
        return EmailVerification.findOneAndUpdate(
            { email, consumedAt: null, expiresAt: { $gt: new Date() } },

            { $set: { codeHash: patch.codeHash, expiresAt: patch.expiresAt } },
            
            { new: true }
        ).exec();
    }
}
