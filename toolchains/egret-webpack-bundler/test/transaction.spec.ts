import * as fs from 'fs';
import * as memfs from 'memfs';
import * as path from 'path';
import { Transaction } from '../src/assets/Transaction';
import { TransactionManager } from '../src/assets/TransactionManager';
import { CopyFileTransaction } from '../src/assets/transactions/CopyFileTransaction';
import { EgretPropertyTransaction } from '../src/assets/transactions/EgretPropertyTransaction';
import { ResourceConfigTransaction } from '../src/assets/transactions/ResourceConfigTransaction';
const mockPreparedMethod = jest.fn();

const mockExecuteMethod = jest.fn();

const MockTransction = jest.fn().mockImplementation(class X extends Transaction {

    constructor(source: string) {
        super(source);
        this.prepare = Transaction.prototype.prepare;
        this.onPrepare = mockPreparedMethod;
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
        });

        it('manager.transactions have source', () => {
            const manager = new TransactionManager('');
            manager.create(MockTransction, 'source-file.txt', 2, 3);
            expect(manager.transactions.get('source-file.txt')).toBeInstanceOf(MockTransction);
        });
    });

    describe('TransactionManager#prepare', () => {

        it('transaction\'s prepare should be called', () => {
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
        });
    });

    describe('TransactionManager#execute', () => {

        it('transaction\'s execute should be called', () => {
            const manager = new TransactionManager('');
            manager.create(MockTransction, 'source-file.txt', 2, 3);
            manager.prepare();
            manager.execute();
            expect(mockExecuteMethod).toBeCalledWith(manager);
        });
    });
});

describe('CopyFileTransaction', () => {

    it('execute', async () => {
        const manager = new TransactionManager('.');
        const vfs = memfs.Volume.fromJSON({
            '1.txt': 'HelloWorld'
        });
        manager.inputFileSystem = {
            readFileAsync: (file: string) => {
                return vfs.promises.readFile(file) as Promise<string>;
            }
        };
        const store: any = {};
        manager.outputFileSystem = {
            emitAsset: (filepath: string, content: string) => {
                store[filepath] = content;
            }
        };
        manager.create(CopyFileTransaction, '1.txt');
        await manager.prepare();
        await manager.execute();
        expect(store['1.txt'].toString()).toEqual('HelloWorld');
    });
});

describe('EgretProperyTransaction', () => {

    describe('EgretPropertyTransaction#execute', () => {
        it('generate manifest.json and javascript', async () => {
            const manager = new TransactionManager('.');
            const vfs = memfs.Volume.fromNestedJSON({
                'egretProperties.json': fs.readFileSync(path.join('test/simple-project/egretProperties.json'), 'utf-8'),
                'libs': {
                    'modules': {
                        'egret/egret.js': '',
                        'egret/egret.web.js': '',
                        'eui/eui.js': '',
                        'assetsmanager/assetsmanager.js': ''
                    }
                }
            });
            manager.inputFileSystem = {
                readFileAsync: (file: string) => {
                    return vfs.promises.readFile(file) as Promise<string>;
                }
            };
            const store: any = {};
            manager.outputFileSystem = {
                emitAsset: (filepath: string, content: string) => {
                    store[filepath] = content;
                }
            };
            manager.create(EgretPropertyTransaction, 'debug');
            await manager.prepare();
            await manager.execute();
            expect(store['manifest.json']).not.toBeUndefined();
            expect(store['libs/modules/egret/egret.web.js']).not.toBeUndefined();
        });
    });
});

describe('ResourceConfigTransaction', () => {

    describe('ResourceConfigTransaction#execute', () => {

        it('copy resource', async () => {
            const manager = new TransactionManager('.');
            const vfs = memfs.Volume.fromNestedJSON({
                'resource/default.res.json': fs.readFileSync(path.join('test/simple-project/resource/default.res.json'), 'utf-8'),
                'resource/spritesheet': {
                    'rank_no1.png': fs.readFileSync(path.join('test/simple-project/resource/spritesheet/rank_no1.png')) as any,
                    'rank_no2.png': fs.readFileSync(path.join('test/simple-project/resource/spritesheet/rank_no1.png')) as any,
                    'rank_no3.png': fs.readFileSync(path.join('test/simple-project/resource/spritesheet/rank_no1.png')) as any
                }
            });
            manager.inputFileSystem = {
                readFileAsync: (file: string) => {
                    return vfs.promises.readFile(file) as Promise<string>;
                }
            };
            const store: any = {};
            manager.outputFileSystem = {
                emitAsset: (filepath: string, content: string) => {
                    store[filepath] = content;
                }
            };
            manager.create(ResourceConfigTransaction, 'resource/default.res.json');
            await manager.prepare();
            await manager.execute();
        });
    });
});