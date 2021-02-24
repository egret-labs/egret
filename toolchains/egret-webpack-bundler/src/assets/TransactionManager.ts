import { Transaction } from "./Transaction";

interface InputFileSystem {

    readFileAsync(filepath: string): Promise<string>

}


export class TransactionManager {

    transactions: Map<string, Transaction> = new Map();

    inputFileSystem!: InputFileSystem

    create<T extends { new(...args: any[]): Transaction }>(transactionClass: T, ...args: ConstructorParameters<T>) {
        const t = new transactionClass(...args);
        this.transactions.set(t.source, t);
        return t;
    }

    async prepare() {
        for (const [source, transaction] of this.transactions) {
            await transaction.prepare(this);
        }
    }

    async execute() {
        for (const [source, transaction] of this.transactions) {
            await transaction.execute(this);
        }
    }

}