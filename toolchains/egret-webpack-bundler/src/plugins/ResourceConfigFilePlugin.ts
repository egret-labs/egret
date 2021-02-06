import * as texturemrger from '@egret/texture-merger-core';
import * as fs from 'fs';
import * as path from 'path';
import * as webpack from 'webpack';
import { fileChanged, readFileAsync } from '../loaders/utils';
import { walkDir } from '../utils';

export type ResourceConfigFilePluginOptions = [{ file: string, executeBundle?: boolean }];

export default class ResourceConfigFilePlugin {

    // eslint-disable-next-line no-useless-constructor
    constructor(private options: ResourceConfigFilePluginOptions) {
    }

    public apply(compiler: webpack.Compiler) {

        const pluginName = this.constructor.name;

        const bundleInfo = this.options[0];
        const { file, executeBundle } = bundleInfo;
        const fullFilepath = path.join(compiler.context, file);
        const existed = fs.existsSync(fullFilepath);
        if (!existed) {
            throw new Error(fullFilepath + '不存在');
        }
        compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
            if (!fileChanged(compiler, fullFilepath)) {
                return;
            }
            compilation.hooks.processAssets.tapPromise(pluginName, async (assets) => {
                try {
                    const content = await readFileAsync(compiler, fullFilepath);
                    compilation.fileDependencies.add(fullFilepath);
                    const factory = new ResourceConfigFactory();
                    factory.compilation = compilation;
                    factory.parse(file, content.toString());
                    if (executeBundle) {
                        factory.execute();
                    }
                    factory.emit();
                }
                catch (e) {
                    const message = `\t资源配置处理异常\n\t${e.message}`;
                    const webpackError = new webpack.WebpackError(message);
                    webpackError.file = file;
                    compilation.getErrors().push(webpackError);
                }
            });
        });
    }
}

async function executeTextureMerger(compilation: webpack.Compilation, root: string, factory: ResourceConfigFactory) {
    const compiler = compilation.compiler;
    const entities = await getAllTextureMergerConfig(root);
    for (const entity of entities) {
        const content = await readFileAsync(compiler, entity.path);
        const json = texturemrger.parseConfig('yaml', content.toString());
        json.root = path.dirname(path.relative(compiler.context, entity.path)).split('\\').join('/');
        const output = await texturemrger.executeMerge(json);
        const configSource = new webpack.sources.RawSource(JSON.stringify(output.config));
        const bufferSource = new webpack.sources.RawSource(output.buffer);
        const jsonOutputFilePath = `${json.root}/${json.outputName}.json`;
        compilation.emitAsset(jsonOutputFilePath, configSource);
        compilation.emitAsset(`${json.root}/${json.outputName}.png`, bufferSource);
        const relativeFilePath = path.relative('resource', jsonOutputFilePath).split('\\').join('/');

        const spriteSheetResourceConfig = {
            name: `${json.outputName}_json`,
            url: relativeFilePath,
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

        factory.addResource(spriteSheetResourceConfig);

    }
}

async function getAllTextureMergerConfig(root: string) {
    const entities = await walkDir(root);
    return entities.filter((e) => e.name === 'texture-merger.yaml');
}

type ResourceConfigFile = Parameters<typeof import('../../../../packages/assetsmanager')['initConfig']>[1];

type ResourceConfig = ResourceConfigFile['resources'][0] & { emit?: boolean }

class ResourceConfigFactory {

    private configFilePath!: string;

    compilation!: webpack.Compilation;

    config: ResourceConfigFile = { groups: [], resources: [] };

    parse(filename: string, raw: string) {

        this.configFilePath = filename;
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
            if (!resource.emit) {
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

    addResource(resource: ResourceConfig) {
        resource.emit = true;
        this.config.resources.push(resource);
    }

    private validConfig(config: ResourceConfigFile) {
        const groups = config.groups;
        const resources: { [name: string]: ResourceConfigFile['resources'][0] } = {};
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

    emit() {
        for (const r of this.config.resources as ResourceConfig[]) {
            delete r.emit;
        }
        const content = JSON.stringify(this.config);
        const source = new webpack.sources.RawSource(content, false);
        this.compilation.emitAsset(this.configFilePath, source);
    }

}