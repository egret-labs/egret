import { Transaction } from "./Transaction";

export class TransactionManager {

    transactions: Map<string, Transaction> = new Map();

    create<T extends { new(...args: any[]): () => Transaction }>(transactionClass: T, ...args: ConstructorParameters<T>) {
        const t = new transactionClass(...args);
    }

}