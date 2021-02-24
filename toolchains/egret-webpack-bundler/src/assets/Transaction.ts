import * as path from 'path';
import { Compilation, Compiler } from 'webpack';
import { fileChanged } from '../loaders/utils';
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

    async execute2(compilation: Compilation) {

    }

    async prepare(manager: TransactionManager) {
        this.preparedResult = await this.onPrepare(manager);
    }

    protected async onPrepare(manager: TransactionManager): Promise<TransactionPreparedResult> {
        return { fileDependencies: [] };
    }

    async onExecute(manager: TransactionManager) {

    }

    async prepare2(compiler: Compiler) {

    }

    subTransaction: Transaction[] = [];

    addSubTransaction(transaction: Transaction) {
        this.subTransaction.push(transaction);
    }

    static onCompilation(transactions: Transaction[], compilation: Compilation) {
        for (const transaction of transactions) {
            Transaction.onCompilation(transaction.subTransaction, compilation);
            const fullPaths = transaction.fileDependencies.map((p) => path.join(compilation.compiler.context, p));
            for (const fullFilepath of fullPaths) {
                compilation.fileDependencies.add(fullFilepath);
                if (fileChanged(compilation.compiler, fullFilepath)) {
                    compilation.hooks.processAssets.tapPromise(transaction.constructor.name, async (assets) => {
                        await transaction.execute2(compilation);
                    });
                }
            }

        }

    }
}