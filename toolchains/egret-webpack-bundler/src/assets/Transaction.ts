import { TransactionManager } from './TransactionManager';

type TransactionPreparedResult = { fileDependencies: string[] }

export class Transaction {

    // eslint-disable-next-line no-useless-constructor
    constructor(readonly source: string) {
    }

    private preparedResult!: TransactionPreparedResult;

    get fileDependencies() {
        return this.preparedResult.fileDependencies;
    }

    async prepare(manager: TransactionManager) {
        this.preparedResult = await this.onPrepare(manager);
    }

    protected async onPrepare(manager: TransactionManager): Promise<TransactionPreparedResult> {
        return { fileDependencies: [] };
    }

    async onExecute(manager: TransactionManager) {

    }
}