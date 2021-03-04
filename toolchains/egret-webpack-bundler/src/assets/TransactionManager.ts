import { createProject } from '../egretproject';
import { EgretProjectData } from '../egretproject/data';
import { walkDir } from '../utils';
import { ResourceConfigFactory } from './ResourceConfigFactory';
import { Transaction } from './Transaction';
import { TextureMergerTransaction } from './transactions/TextureMergerTransaction';

interface InputFileSystem {

    readFileAsync(filepath: string, encoding: 'utf-8'): Promise<string>
    readFileAsync(filepath: string): Promise<Buffer>

}

interface OutputFileSystem {

    emitAsset(filepath: string, content: string | Buffer): void;

}

export class TransactionManager {

    transactions: Map<string, Transaction> = new Map();

    inputFileSystem!: InputFileSystem;

    outputFileSystem!: OutputFileSystem

    factory = new ResourceConfigFactory();

    project: EgretProjectData;

    // eslint-disable-next-line no-useless-constructor
    constructor(public projectRoot: string) {
        this.project = createProject(projectRoot);
    }

    create<T extends { new(...args: any[]): Transaction }>(transactionClass: T, ...args: ConstructorParameters<T>) {
        const t = new transactionClass(...args);
        this.transactions.set(t.source, t);
        return t;
    }

    async initialize() {
        const source = 'resource/default.res.json';
        const content = await this.inputFileSystem.readFileAsync(source, 'utf-8');
        this.factory.parse(source, content);
    }

    async addTextureMerger() {
        const entities = await getAllTextureMergerConfig(this.projectRoot);
        for (const entity of entities) {
            this.create(TextureMergerTransaction, entity.path);
        }
    }

    async prepare() {
        for (const [source, transaction] of this.transactions) {
            await transaction.prepare(this);
        }
    }

    async execute() {
        for (const [source, transaction] of this.transactions) {
            await transaction.onExecute(this);
        }
    }

    async finish() {
        const factory = this.factory;
        const output = factory.emitConfig();
        this.outputFileSystem.emitAsset('resource/default.res.json', output);
    }

}

async function getAllTextureMergerConfig(root: string) {
    const entities = await walkDir(root);
    return entities.filter((e) => e.name === 'texture-merger.yaml');
}