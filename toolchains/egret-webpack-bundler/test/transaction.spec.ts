import { Transaction } from '../src/assets/Transaction';
import { TransactionManager } from '../src/assets/TransactionManager';


const mockPreparedMethod = jest.fn();

const MockTransction = jest.fn().mockImplementation(class X extends Transaction {

    constructor(source: string) {
        super(source);
        this.prepare = mockPreparedMethod;
    }
} as any);

describe('TransactionManager', () => {

    describe('TransactionManager#create', () => {

        it('constructor params', () => {
            const manager = new TransactionManager();
            manager.create(MockTransction, 1, 2, 3);
            expect(MockTransction).toHaveBeenCalledWith(1, 2, 3);
        });

        it('transaction source', () => {
            const manager = new TransactionManager();
            const transaction = manager.create(MockTransction, 'source-file.txt', 2, 3);
            expect(transaction.source).toStrictEqual('source-file.txt');
        })

        it('manager.transactions have source', () => {
            const manager = new TransactionManager();
            manager.create(MockTransction, 'source-file.txt', 2, 3);
            expect(manager.transactions.get('source-file.txt')).toBeInstanceOf(MockTransction)
        });
    });


    describe('TransactionManager#prepare', () => {

        it(`transaction's prepare should be called`, () => {
            const manager = new TransactionManager();
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

            const manager = new TransactionManager();
            manager.create(CompositeTransaction, 'source-file-1.txt');
            await manager.prepare();
            expect(mockPreparedMethod).toBeCalledWith(manager);
        })
    });
})