import { ITransaction, Transaction } from "../../models/Transaction";

export class TransactionService{
    public static async createTransaction(
        data: ITransaction
    ) {
        try {
            const document = await Transaction.create(data);

            return document;
        } catch(error) {
            console.error('Failed to create transaction', error);

            throw error;
        }
    }

    public static async getTransaction(){
        try {
           const transactionList = await Transaction.find ({});

           return transactionList;
        } catch(error){
            console.error('Failed to get transaction', error);

            throw error;
        }
    }
}