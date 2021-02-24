import * as path from 'path';
import { Compilation, Compiler } from "webpack";
import { fileChanged } from "../loaders/utils";

export class Transaction {

    get fileDependencies(): string[]

    async execute(compilation: Compilation) {

    }


    async prepared(compiler: Compiler) {

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