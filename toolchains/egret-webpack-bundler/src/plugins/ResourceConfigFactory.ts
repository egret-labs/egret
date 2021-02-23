import * as texturemrger from '@egret/texture-merger-core';
import * as path from 'path';
import * as webpack from 'webpack';
import { readFileAsync } from '../loaders/utils';
import { walkDir } from '../utils';

export type ResourceConfigFile = Parameters<typeof import('../../../../packages/assetsmanager')['initConfig']>[1];

export type ResourceConfig = ResourceConfigFile['resources'][0] & {
    isEmitted?: boolean
}

export class ResourceConfigFactory {

    compilation!: webpack.Compilation;

    config: ResourceConfigFile = { groups: [], resources: [] };

    parse(filename: string, raw: string) {

        let json: ResourceConfigFile;
        try {
            json = JSON.parse(raw);
        }
        catch (e) {
            throw new Error(`${filename}不是合法的JSON文件`);
        }
        this.validConfig(json);
        this.config = JSON.parse(JSON.stringify(json));

    }

    async execute() {
        const compilation = this.compilation;
        const compiler = compilation.compiler;
        await executeTextureMerger(compilation, path.join(compiler.context, 'resource'), this);
        for (const resource of this.config.resources as ResourceConfig[]) {
            if (!resource.isEmitted) {
                const filepath = 'resource/' + resource.url;
                const assetFullPath = path.join(compiler.context, filepath);
                const assetbuffer = await readFileAsync(compiler, assetFullPath);
                compilation.emitAsset(filepath, new webpack.sources.RawSource(assetbuffer));
            }
        }
    }

    removeResource(name: string) {
        const index = this.config.resources.findIndex((r) => r.name === name);
        if (index >= 0) {
            this.config.resources.splice(index, 1);
        }
    }

    emitResource(content: Buffer | string, config: ResourceConfig) {
        const bufferSource = new webpack.sources.RawSource(content);
        const fileAssetPath = path.join('resource', config.url);
        this.compilation.emitAsset(fileAssetPath, bufferSource);
        config.isEmitted = true;
        this.config.resources.push(config);
    }

    private validConfig(config: ResourceConfigFile) {
        const groups = config.groups;
        const resources: { [name: string]: ResourceConfigFile['resources'][0]; } = {};
        for (const r of config.resources) {
            resources[r.name] = r;
        }
        for (const group of groups) {
            const keys = group.keys.split(',');
            for (const key of keys) {
                if (!resources[key]) {
                    throw new Error(`资源配置组${group.name}中包含了不存在的资源名${key}`);
                }
            }
        }
    }

    emitConfig() {
        for (const r of this.config.resources as ResourceConfig[]) {
            delete r.isEmitted;
        }
        const content = JSON.stringify(this.config);
        return content;
    }

}

async function executeTextureMerger(compilation: webpack.Compilation, root: string, factory: ResourceConfigFactory) {
    const compiler = compilation.compiler;
    const entities = await getAllTextureMergerConfig(root);
    for (const entity of entities) {
        const content = await readFileAsync(compiler, entity.path);
        const json = texturemrger.parseConfig('yaml', content.toString());
        const relativeRoot = path.dirname(path.relative(compiler.context, entity.path)).split('\\').join('/');
        json.root = path.dirname(entity.path);
        const output = await texturemrger.executeMerge(json);
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

        factory.emitResource(output.buffer, spriteSheetImageResourceConfig);
        factory.emitResource(JSON.stringify(output.config), spriteSheetResourceConfig);

    }
}

async function getAllTextureMergerConfig(root: string) {
    const entities = await walkDir(root);
    return entities.filter((e) => e.name === 'texture-merger.yaml');
}
