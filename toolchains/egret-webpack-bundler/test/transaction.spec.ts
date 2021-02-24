import { Transaction } from '../src/assets/Transaction';
import { TransactionManager } from '../src/assets/TransactionManager';

const MockTransction = jest.fn().mockImplementation(Transaction as any);

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
            //
        })

        it('manager.transactions have source', () => {
            const manager = new TransactionManager();
            manager.create(MockTransction, 'source-file.txt', 2, 3);
            expect(manager.transactions.get('source-file.txt')).toBeInstanceOf(MockTransction)
        });
    })


})