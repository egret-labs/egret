import { ResourceConfigFactory } from '../plugins/ResourceConfigFactory';
import { Transaction } from './Transaction';

interface InputFileSystem {

    readFileAsync(filepath: string): Promise<string>

}

interface OutputFileSystem {

    emitAsset(filepath: string, content: string): void;

}

export class TransactionManager {


    transactions: Map<string, Transaction> = new Map();

    inputFileSystem!: InputFileSystem;

    outputFileSystem!: OutputFileSystem;

    factory = new ResourceConfigFactory();

    // eslint-disable-next-line no-useless-constructor
    constructor(public projectRoot: string) {
    }

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
            await transaction.onExecute(this);
        }
    }

}