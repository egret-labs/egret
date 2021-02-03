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
                    const json = parseConfig(file, content.toString());
                    validConfig(json);
                    const factory = new ResourceConfigFactory();
                    factory.parseFromOriginConfig(json);
                    if (executeBundle) {
                        await executeTextureMerger(compilation, path.join(compiler.context, 'resource'), factory);
                        for (const resource of json.resources) {
                            const filepath = 'resource/' + resource.url;
                            const assetFullPath = path.join(compiler.context, filepath);
                            const assetbuffer = await readFileAsync(compiler, assetFullPath);
                            compilation.emitAsset(filepath, new webpack.sources.RawSource(assetbuffer));
                        }
                    }
                    const source = new webpack.sources.RawSource(JSON.stringify(factory.config), false);
                    compilation.emitAsset(file, source);
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
        json.root = path.dirname(path.relative(compiler.context, entity.path)).split("\\").join("/")
        json.outputName = 'output';
        const output = await texturemrger.executeMerge(json);
        const configSource = new webpack.sources.RawSource(JSON.stringify(output.config));
        const bufferSource = new webpack.sources.RawSource(output.buffer);
        compilation.emitAsset(json.root + '/spritesheet.json', configSource);
        compilation.emitAsset(json.root + '/spritesheet.png', bufferSource);

        const spriteSheetResourceConfig = {
            name: "spritesheet_json",
            url: json.root + "spritsheet.json",
            type: "spriteSheet",
            subkeys: ''
        }
        const subkeys = [];
        for (let file of json.files) {
            const name = path.basename(file).split(".").join("_");
            factory.removeResource(name);
            subkeys.push(name);
        }
        spriteSheetResourceConfig.subkeys = subkeys.join(",");

        factory.addResource(spriteSheetResourceConfig);

    }
}

async function getAllTextureMergerConfig(root: string) {
    const entities = await walkDir(root);
    return entities.filter((e) => e.name === 'texture-merger.yaml');
}

function parseConfig(filename: string, raw: string): ResourceConfigFile {
    try {
        const json = JSON.parse(raw);
        return json;
    }
    catch (e) {
        throw new Error(`${filename}不是合法的JSON文件`);
    }
}

function validConfig(config: ResourceConfigFile) {
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

type ResourceConfigFile = Parameters<typeof import('../../../../packages/assetsmanager')['initConfig']>[1];

type ResrouceConfig = ResourceConfigFile['resources'][0]


class ResourceConfigFactory {

    config: ResourceConfigFile = { groups: [], resources: [] };

    parseFromOriginConfig(origin: ResourceConfigFile) {
        this.config = JSON.parse(JSON.stringify(origin));
    }

    removeResource(name: string) {
        console.log('删除', name)
        const index = this.config.resources.findIndex(r => r.name === name);
        console.log('index', index)
        if (index >= 0) {
            this.config.resources.splice(index, 1);
        }
    }

    addResource(resource: ResrouceConfig) {
        this.config.resources.push(resource);
    }


}