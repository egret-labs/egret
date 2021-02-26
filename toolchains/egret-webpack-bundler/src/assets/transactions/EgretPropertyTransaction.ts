import { EgretProjectData } from '../../egretproject/data';
import { WebpackBundleOptions } from '../../options/typings';
import { Transaction } from '../Transaction';
import { TransactionManager } from '../TransactionManager';
import { CopyFileTransaction } from './CopyFileTransaction';

export class EgretPropertyTransaction extends Transaction {

    constructor(private options: Pick<WebpackBundleOptions, 'libraryType' | 'subpackages'>) {
        super('egretProperties.json');
    }

    async onPrepare(manager: TransactionManager) {
        const project = new EgretProjectData();
        const content = await manager.inputFileSystem.readFileAsync('egretProperties.json', 'utf-8');
        project.initialize(manager.projectRoot, content);
        const egretModules = project.getModulesConfig('web');
        for (const m of egretModules) {
            for (const asset of m.target) {
                const filename = this.options.libraryType == 'debug' ? asset.debug : asset.release;
                manager.create(CopyFileTransaction, filename);
            }
        }
        return { fileDependencies: [] };
    }

    async onExecute(manager: TransactionManager) {
        const project = new EgretProjectData();
        const content = await manager.inputFileSystem.readFileAsync('egretProperties.json', 'utf-8');
        project.initialize(manager.projectRoot, content);
        const egretModules = project.getModulesConfig('web');
        const initial: string[] = [];
        for (const m of egretModules) {
            for (const asset of m.target) {
                const filename = this.options.libraryType == 'debug' ? asset.debug : asset.release;
                initial.push(filename);
            }
        }

        const subpackages = this.options.subpackages?.map((item) => item.name + '.js');
        const game = subpackages ? ['main.js'].concat(subpackages) : ['main.js'];
        const manifest = { initial, game };
        const manifestContent = JSON.stringify(manifest, null, '\t');
        manager.outputFileSystem.emitAsset('manifest.json', manifestContent);
    }
}

