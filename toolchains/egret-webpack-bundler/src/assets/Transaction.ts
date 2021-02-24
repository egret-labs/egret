import * as path from 'path';
import { Compilation, Compiler } from "webpack";
import { fileChanged } from "../loaders/utils";
import { TransactionManager } from './TransactionManager';

export class Transaction {

    constructor(readonly source: string) {
    }

    get fileDependencies(): string[] {
        return [];
    }

    async execute(compilation: Compilation) {

    }

    async prepare(manager: TransactionManager) {

    }


    async prepare2(compiler: Compiler) {

    }

    subTransaction: Transaction[] = [];

    addSubTransaction(transaction: Transaction) {
        this.subTransaction.push(transaction)
    }

    static onCompilation(transactions: Transaction[], compilation: Compilation) {
        for (const transaction of transactions) {
            Transaction.onCompilation(transaction.subTransaction, compilation);
            const fullPaths = transaction.fileDependencies.map(p => path.join(compilation.compiler.context, p));
            for (let fullFilepath of fullPaths) {
                compilation.fileDependencies.add(fullFilepath);
                if (fileChanged(compilation.compiler, fullFilepath)) {
                    compilation.hooks.processAssets.tapPromise(transaction.constructor.name, async (assets) => {
                        await transaction.execute(compilation);
                    });
                }
            }

        }

    }
}