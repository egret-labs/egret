import * as fs from 'fs';
import * as memfs from 'memfs';
import * as path from 'path';
import { Transaction } from '../src/assets/Transaction';
import { TransactionManager } from '../src/assets/TransactionManager';
import { CopyFileTransaction } from '../src/assets/transactions/CopyFileTransaction';
import { EgretPropertyTransaction } from '../src/assets/transactions/EgretPropertyTransaction';
import { ResourceConfigTransaction } from '../src/assets/transactions/ResourceConfigTransaction';
import { TextureMergerTransaction } from '../src/assets/transactions/TextureMergerTransaction';
const mockPreparedMethod = jest.fn();

const mockExecuteMethod = jest.fn();

const MockTransction = jest.fn().mockImplementation(class X extends Transaction {

    constructor(source: string) {
        super(source);
        this.prepare = Transaction.prototype.prepare;
        this.onPrepare = mockPreparedMethod;
        this.onExecute = mockExecuteMethod;
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

        it('transaction\'s prepare should be called', async () => {
            const manager = new TransactionManager('');
            manager.create(MockTransction, 'source-file.txt', 2, 3);
            await manager.prepare();
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

        it('transaction\'s execute should be called', async () => {
            const manager = new TransactionManager('');
            manager.create(MockTransction, 'source-file.txt', 2, 3);
            manager.outputFileSystem = {
                emitAsset: () => { }
            };
            await manager.prepare();
            await manager.execute();
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
                return vfs.promises.readFile(file) as any;
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
                    return vfs.promises.readFile(file) as any;
                }
            };
            const store: any = {};
            manager.outputFileSystem = {
                emitAsset: (filepath: string, content: string) => {
                    store[filepath] = content;
                }
            };
            manager.create(EgretPropertyTransaction, { libraryType: 'debug' });
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
                    'rank_no1.png': '111',
                    'rank_no2.png': '111',
                    'rank_no3.png': '111'
                }
            });
            manager.inputFileSystem = {
                readFileAsync: (file: string) => {
                    return vfs.promises.readFile(file) as any;
                }
            };
            const store: any = {};
            manager.outputFileSystem = {
                emitAsset: (filepath: string, content: string) => {
                    store[filepath] = content;
                }
            };
            manager.create(ResourceConfigTransaction, 'resource/default.res.json');
            await manager.initialize();
            await manager.prepare();
            await manager.execute();
            await manager.finish();
            expect(store['resource/default.res.json']).not.toBeUndefined();
            expect(store['resource/spritesheet/rank_no1.png'].toString()).toEqual('111');
        });
    });
});

describe('Transaction', () => {

    describe('TextureMergerTransaction', () => {

        it('TextureMergerTransaction#execute', async () => {

            function createVFS(root: string) {
                const vfs = new memfs.Volume();

                function walk(dirRoot: string) {
                    const items = fs.readdirSync(dirRoot);
                    for (const item of items) {
                        const p = path.join(dirRoot, item);
                        const stat = fs.statSync(p);
                        if (stat.isDirectory()) {
                            walk(p);
                        }
                        else if (stat.isFile()) {
                            vfs.mkdirpSync(path.dirname(p));
                            vfs.writeFileSync(p, fs.readFileSync(p));
                        }
                    }
                }
                walk(root);
                return vfs;
            }

            const manager = new TransactionManager('./test/simple-project');

            const vfs = createVFS('test/simple-project/');
            manager.inputFileSystem = {
                readFileAsync: (file: string) => {
                    return vfs.promises.readFile(path.join(manager.projectRoot, file)) as any;
                }
            };
            const store: any = {};
            manager.outputFileSystem = {
                emitAsset: (filepath: string, content: string) => {
                    store[filepath] = content;
                }
            };

            manager.create(ResourceConfigTransaction, 'resource/spritesheet/texture-merger.yaml');
            manager.create(TextureMergerTransaction, 'resource/spritesheet/texture-merger.yaml');
            await manager.initialize();
            await manager.prepare();
            await manager.execute();
            await manager.finish();
            const json = JSON.parse(store['resource/default.res.json'].toString()) as { resources: any[] };
            expect(json.resources.find((v) => v.name === 'rank_no1_png')).toBeUndefined();
            expect(json.resources.find((v) => v.name === 'spritesheet_json')).not.toBeUndefined();
        });
    });
});