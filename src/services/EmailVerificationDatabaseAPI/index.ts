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

    public static async touchLastSent(id: string, when: Date) {
        const result = await EmailVerification.findOneAndUpdate(
            { _id: id },
            {
                $set: {
                    lastSentAt: when,
                },
            },
            {
                new: true,
            }
        ).exec();

        if (!result) {
            throw new NotFoundError(`Record with id ${id} not found`);
        }

        return result;
    }

    public static async markConsumed(
        id: string,
        when: Date
    ): Promise<IEmailVerification> {
        const updated = await EmailVerification.findOneAndUpdate(
            { _id: id, consumedAt: null },
            { $set: { consumedAt: when } },
            { new: true }
        ).exec();

        if (!updated) {
            throw new NotFoundError(`Active record with id ${id} not found`);
        }

        return updated;
    }

    public static async createNew(params: {
        email: string;
        codeHash: string;
        expiresAt: Date;
        lastSentAt: Date;
    }): Promise<IEmailVerification> {
        const doc = await EmailVerification.create({
            email: params.email,
            codeHash: params.codeHash,
            expiresAt: params.expiresAt,
            lastSentAt: params.lastSentAt,
            consumedAt: null,
        });

        return doc;
    }
}
