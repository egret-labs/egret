import { Compilation, sources, WebpackError } from "webpack";
import { createProject } from "../../egretproject";
import { readFileAsync } from "../../loaders/utils";
import { getAssetsFileSystem } from "../AssetsFileSystem";
import { Transaction } from "../Transaction";

export class EgretPropertyTransaction extends Transaction {

    constructor(private libraryType: 'debug' | 'release') {
        super();
    }

    get fileDependencies(): string[] {
        return [
            'egretProperties.json'
        ]
    }


    async execute(compilation: Compilation) {

        const assetsFileSystem = getAssetsFileSystem();

        const compiler = compilation.compiler;
        const project = createProject(compiler.context);
        const egretModules = project.getModulesConfig('web');
        const initial: string[] = [];
        for (const m of egretModules) {
            for (const asset of m.target) {
                const filename = this.libraryType == 'debug' ? asset.debug : asset.release;
                initial.push(filename);
                if (await assetsFileSystem.needUpdate(filename)) {
                    try {
                        const content = await readFileAsync(compiler, filename);
                        const source = new sources.RawSource(content, false);
                        assetsFileSystem.update(compilation, { filePath: filename, dependencies: [] }, content);
                    }
                    catch (e) {
                        const message = `\t模块加载失败:${m.name}\n\t文件访问异常:${filename}`;
                        const webpackError = new WebpackError(message);
                        webpackError.file = 'egretProperties.json';
                        compilation.getErrors().push(webpackError);
                    }
                }

            }
        }


        if (await assetsFileSystem.needUpdate('manifest.json')) {
            const manifest = { initial, game: ['main.js'] };
            const manifestContent = JSON.stringify(manifest, null, '\t');
            assetsFileSystem.update(compilation, { filePath: 'manifest.json', dependencies: this.fileDependencies }, manifestContent);
        }
    }


}