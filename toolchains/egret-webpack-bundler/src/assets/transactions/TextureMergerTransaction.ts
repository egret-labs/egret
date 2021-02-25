import * as texturemrger from '@egret/texture-merger-core';
import * as path from 'path';
import { ResourceConfig } from '../ResourceConfigFactory';
import { Transaction } from '../Transaction';
import { TransactionManager } from '../TransactionManager';

export class TextureMergerTransaction extends Transaction {

    private json!: texturemrger.TexturePackerOptions;
    private spriteSheetResourceConfig!: ResourceConfig;
    private spriteSheetImageResourceConfig!: ResourceConfig;

    async onPrepare(manager: TransactionManager) {
        const factory = manager.factory;
        const content = await manager.inputFileSystem.readFileAsync(this.source);
        const json = texturemrger.parseConfig('yaml', content.toString());
        const relativeRoot = path.dirname(this.source).split('\\').join('/');
        json.root = path.dirname(this.source);

        const jsonOutputFilePath = `${relativeRoot}/${json.outputName}.json`;
        const imageOutputFilePath = `${relativeRoot}/${json.outputName}.png`;
        const spriteSheetRelativeFilePath = path.relative('resource', jsonOutputFilePath).split('\\').join('/');
        const spriteSheetImageRelativeFilePath = path.relative('resource', imageOutputFilePath).split('\\').join('/');
        const spriteSheetResourceConfig = {
            name: `${json.outputName}_json`,
            url: spriteSheetRelativeFilePath,
            type: 'sheet',
            subkeys: ''
        };
        const subkeys = [];
        for (const file of json.files) {
            const name = path.basename(file).split('.').join('_');
            manager.factory.removeResource(name);
            subkeys.push(name);
        }
        spriteSheetResourceConfig.subkeys = subkeys.join(',');

        const spriteSheetImageResourceConfig = {
            name: `${json.outputName}_png`,
            url: spriteSheetImageRelativeFilePath,
            type: 'image'
        };
        factory.addResource(spriteSheetResourceConfig);
        factory.addResource(spriteSheetImageResourceConfig);
        this.json = json;
        this.spriteSheetResourceConfig = spriteSheetResourceConfig;
        this.spriteSheetImageResourceConfig = spriteSheetImageResourceConfig;
        return { fileDependencies: [] };
    }

    async onExecute(manager: TransactionManager) {

        const images = await Promise.all(this.json.files.map(async (file) => {
            const contents = await manager.inputFileSystem.readFileAsync(path.join(this.json.root, file));
            return { path: file, contents };
        }));
        const output = await texturemrger.executeMerge(images, this.json);

        const filepath = 'resource/' + this.spriteSheetResourceConfig.url;
        const filepath2 = 'resource/' + this.spriteSheetImageResourceConfig.url;
        manager.outputFileSystem.emitAsset(filepath, JSON.stringify(output.config));
        manager.outputFileSystem.emitAsset(filepath2, output.buffer);
    }
}