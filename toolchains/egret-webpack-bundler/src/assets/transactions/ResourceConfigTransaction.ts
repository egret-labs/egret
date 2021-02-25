import { walkDir } from '../../utils';
import { ResourceConfig } from '../ResourceConfigFactory';
import { Transaction } from '../Transaction';
import { TransactionManager } from '../TransactionManager';
import { CopyFileTransaction } from './CopyFileTransaction';
export type ResourceConfigFilePluginOption = { file: string, executeBundle?: boolean };

export class ResourceConfigTransaction extends Transaction {

    async onPrepare(manager: TransactionManager) {

        const factory = manager.factory;
        const config = factory.config;
        for (const x of config.resources as ResourceConfig[]) {
            if (!x.isEmitted) {
                manager.create(CopyFileTransaction, 'resource/' + x.url);
            }

        }
        return { fileDependencies: [] };
    }

    async onExecute(manager: TransactionManager) {

    }
}

async function getAllTextureMergerConfig(root: string) {
    const entities = await walkDir(root);
    return entities.filter((e) => e.name === 'texture-merger.yaml');
}