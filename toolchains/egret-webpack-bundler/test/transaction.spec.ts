import * as fs from 'fs';
import * as memfs from 'memfs';
import * as path from 'path';
import { Transaction } from '../src/assets/Transaction';
import { TransactionManager } from '../src/assets/TransactionManager';
import { EgretPropertyTransaction } from '../src/assets/transactions/EgretPropertyTransaction';
const mockPreparedMethod = jest.fn();

const mockExecuteMethod = jest.fn();

const MockTransction = jest.fn().mockImplementation(class X extends Transaction {

    constructor(source: string) {
        super(source);
        this.prepare = mockPreparedMethod;
        this.execute = mockExecuteMethod;
    }
} as any);

describe('TransactionManager', () => {

    describe('TransactionManager#create', () => {

        it('constructor params', () => {
            const manager = new TransactionManager('');
            manager.create(MockTransction, 1, 2, 3);
            expect(MockTransction).toHaveBeenCalledWith(1, 2, 3);
        });

        it('transaction source', () => {
            const manager = new TransactionManager('');
            const transaction = manager.create(MockTransction, 'source-file.txt', 2, 3);
            expect(transaction.source).toStrictEqual('source-file.txt');
        })

        it('manager.transactions have source', () => {
            const manager = new TransactionManager('');
            manager.create(MockTransction, 'source-file.txt', 2, 3);
            expect(manager.transactions.get('source-file.txt')).toBeInstanceOf(MockTransction)
        });
    });


    describe('TransactionManager#prepare', () => {

        it(`transaction's prepare should be called`, () => {
            const manager = new TransactionManager('');
            manager.create(MockTransction, 'source-file.txt', 2, 3);
            manager.prepare();
            expect(mockPreparedMethod).toBeCalledWith(manager);
        });

        it('transaction recursive prepare', async () => {
            class CompositeTransaction extends Transaction {

                async prepare(manager: TransactionManager) {
                    manager.create(MockTransction, 'source-file-2.txt');
                }
            }

            const manager = new TransactionManager('');
            manager.create(CompositeTransaction, 'source-file-1.txt');
            await manager.prepare();
            expect(mockPreparedMethod).toBeCalledWith(manager);
        })
    });

    describe('TransactionManager#execute', () => {

        it(`transaction's execute should be called`, () => {
            const manager = new TransactionManager('');
            manager.create(MockTransction, 'source-file.txt', 2, 3);
            manager.prepare();
            manager.execute();
            expect(mockExecuteMethod).toBeCalledWith(manager);
        });
    });
})

describe('EgretProperyTransaction', () => {

    it('execute', async () => {
        const manager = new TransactionManager('.');
        const vfs = memfs.Volume.fromJSON({
            'egretProperties.json': fs.readFileSync(path.join('test/simple-project/egretProperties.json'), 'utf-8')
        })
        manager.inputFileSystem = {
            readFileAsync: (file: string) => {
                return vfs.promises.readFile(file) as Promise<string>
            }
        }
        manager.create(EgretPropertyTransaction, 'debug');
        await manager.prepare();
        await manager.execute();
    })
});