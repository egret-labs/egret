import * as path from 'path';
import { Compilation, Compiler } from "webpack";
import { fileChanged } from "../loaders/utils";

export abstract class Transaction {

    abstract get fileDependencies(): string[]

    abstract execute(compilation: Compilation): Promise<void>


    abstract preExecute(compiler: Compiler): Promise<void>

    subTransaction: Transaction[] = [];

    addSubTransaction(transaction: Transaction) {
        this.subTransaction.push(transaction)
    }

    static onCompilation(transactions: Transaction[], compilation: Compilation) {
        for (const transaction of transactions) {
            const fullPaths = transaction.fileDependencies.map(p => path.join(compilation.compiler.context, p));
            for (let fullFilepath of fullPaths) {
                compilation.fileDependencies.add(fullFilepath);
                if (fileChanged(compilation.compiler, fullFilepath)) {
                    compilation.hooks.processAssets.tapPromise(transaction.constructor.name, async (assets) => {
                        await transaction.execute(compilation);
                    });
                }
            }
            Transaction.onCompilation(transaction.subTransaction, compilation);
        }

    }
}