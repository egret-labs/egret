import { Transaction } from '../Transaction';
import { TransactionManager } from '../TransactionManager';

export class CopyFileTransaction extends Transaction {

    constructor(private filename: string) {
        super(filename);
    }

    async onExecute(manager: TransactionManager) {
        const content = await manager.inputFileSystem.readFileAsync(this.source);
        manager.outputFileSystem.emitAsset(this.source, content);
    }
}
