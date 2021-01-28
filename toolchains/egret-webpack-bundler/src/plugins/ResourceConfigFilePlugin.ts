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
                    await executeTextureMerger(compiler, path.join(compiler.context, 'resource'));
                    if (executeBundle) {
                        for (const resource of json.resources) {
                            const filepath = 'resource/' + resource.url;
                            const assetFullPath = path.join(compiler.context, filepath);
                            const assetbuffer = await readFileAsync(compiler, assetFullPath);
                            compilation.emitAsset(filepath, new webpack.sources.RawSource(assetbuffer));
                        }
                    }
                    const source = new webpack.sources.RawSource(content, false);
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

async function executeTextureMerger(compiler: webpack.Compiler, root: string) {
    const entities = await getAllTextureMergerConfig(root);
    for (const entity of entities) {
        const content = readFileAsync(compiler, entity.path);
        const json = JSON.parse(content.toString()) as texturemrger.TexturePackerOptions;
        json.root = path.dirname(path.relative(compiler.context, entity.path));
        json.outputName = 'output';
        await texturemrger.executeMerge(json);
        console.log(json);
    }
}

async function getAllTextureMergerConfig(root: string) {
    const entities = await walkDir(root);
    return entities.filter((e) => e.name === 'texture-merger.json');
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
