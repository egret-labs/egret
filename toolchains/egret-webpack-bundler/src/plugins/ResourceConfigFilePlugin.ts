import * as path from 'path';
import * as webpack from 'webpack';
import { updateFileTimestamps } from '../loaders/utils';

declare module 'webpack' {

    export interface InputFileSystem {
        purge?(what: string): void;
    }

    export interface Compiler {

        watchFileSystem: any

        inputFileSystem: import('webpack').InputFileSystem
    }

}

export type ResourceConfigFilePluginOptions = [{ file: string, executeBundle?: boolean }];

export default class ResourceConfigFilePlugin {

    // eslint-disable-next-line no-useless-constructor
    constructor(private options: ResourceConfigFilePluginOptions) {
    }

    public apply(compiler: webpack.Compiler) {

        function readFileAsync(filePath: string): Promise<Buffer> {
            return new Promise((resolve, reject) => {
                compiler.inputFileSystem.readFile(filePath, (error, content) => {
                    if (error) {
                        reject(new Error(`文件访问异常:${filePath}`));
                    }
                    else {
                        resolve(content);
                    }
                });
            });
        }

        function readStatAsync(filePath: string) {
            return new Promise<{ mtimeMs: number }>((resolve, reject) => {
                compiler.inputFileSystem.stat(filePath, (error, stats) => {
                    if (error) {
                        reject(new Error(`文件访问异常:${filePath}`));
                    }
                    else {
                        resolve(stats);
                    }
                });
            });
        }

        const pluginName = this.constructor.name;

        compiler.hooks.watchRun.tap(pluginName, async (compiler, a) => {
            const keys = Object.keys(compiler.watchFileSystem.watcher.mtimes);
            for (const key of keys) {
                updateFileTimestamps(compiler, key);
            }
        });

        let mtimeMs = 0;

        compiler.hooks.emit.tapPromise(pluginName, async (compilation) => {

            const assets = compilation.assets;
            const bundleInfo = this.options[0];
            const { file, executeBundle } = bundleInfo;
            const fullFilepath = path.join(compiler.context, file);
            compilation.fileDependencies.add(fullFilepath);

            const stats = await readStatAsync(fullFilepath);
            if (mtimeMs === stats.mtimeMs) {
                return;
            }
            mtimeMs = stats.mtimeMs;
            try {
                const content = await readFileAsync(fullFilepath);
                const json = parseConfig(file, content.toString());
                validConfig(json);
                if (executeBundle) {
                    for (const resource of json.resources) {
                        const filepath = 'resource/' + resource.url;
                        const assetFullPath = path.join(compiler.context, filepath);
                        const assetbuffer = await readFileAsync(assetFullPath);
                        updateAssets(assets, filepath, assetbuffer);
                    }
                }
                updateAssets(assets, file, content);
            }
            catch (e) {
                const message = `\t资源配置处理异常\n\t${e.message}`;
                compilation.errors.push({ file: file, message });
            }

        });
    }
}

function updateAssets(assets: any, filePath: string, content: string | Buffer) {

    assets[filePath.split('\\').join('/')] = {
        source: () => content,
        size: () => ((typeof content === 'string') ? content.length : content.byteLength)
    };
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