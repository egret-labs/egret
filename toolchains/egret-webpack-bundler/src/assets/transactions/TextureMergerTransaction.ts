import * as texturemrger from '@egret/texture-merger-core';
import * as path from 'path';
import { Compilation, Compiler } from "webpack";
import { readFileAsync } from "../../loaders/utils";
import { ResourceConfig, ResourceConfigFactory } from "../../plugins/ResourceConfigFactory";
import { getAssetsFileSystem } from "../AssetsFileSystem";
import { Transaction } from "../Transaction";

export class TextureMergerTransaction extends Transaction {

    private json!: texturemrger.TexturePackerOptions;
    private spriteSheetResourceConfig!: ResourceConfig;
    private spriteSheetImageResourceConfig!: ResourceConfig;

    constructor(private fullfilepath: string, private factory: ResourceConfigFactory) {
        super();
    }

    get fileDependencies() {
        return [this.fullfilepath];
    }

    async prepared(compiler: Compiler) {
        const factory = this.factory;
        // const entities = await getAllTextureMergerConfig(root);
        // for (const entity of entities) {
        const content = await readFileAsync(compiler, this.fullfilepath);
        const json = texturemrger.parseConfig('yaml', content.toString());
        const relativeRoot = path.dirname(path.relative(compiler.context, this.fullfilepath)).split('\\').join('/');
        json.root = path.dirname(this.fullfilepath);

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
            factory.removeResource(name);
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
    }

    async execute(compilation: Compilation) {
        const output = await texturemrger.executeMerge(this.json);

        const filepath = 'resource/' + this.spriteSheetResourceConfig.url;
        const filepath2 = 'resource/' + this.spriteSheetImageResourceConfig.url;
        const assetsFileSystem = getAssetsFileSystem();
        assetsFileSystem.update(compilation, { filePath: filepath, dependencies: [] }, JSON.stringify(output.config));
        assetsFileSystem.update(compilation, { filePath: filepath2, dependencies: [] }, output.buffer);

        // factory.emitResource(output.buffer, spriteSheetImageResourceConfig);
        // factory.emitResource(JSON.stringify(output.config), spriteSheetResourceConfig);

    }
}


