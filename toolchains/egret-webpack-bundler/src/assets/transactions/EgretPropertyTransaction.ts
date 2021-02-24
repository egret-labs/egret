import { Compilation, Compiler } from "webpack";
import { createProject } from "../../egretproject";
import { getAssetsFileSystem } from "../AssetsFileSystem";
import { Transaction } from "../Transaction";
import { CopyFileTransaction } from "./CopyFileTransaction";

export class EgretPropertyTransaction extends Transaction {

    constructor(private libraryType: 'debug' | 'release') {
        super('egretProperties.json');
    }

    get fileDependencies(): string[] {
        return [
            'egretProperties.json'
        ]
    }

    async prepare2(compiler: Compiler) {

        const project = createProject(compiler.context);
        const egretModules = project.getModulesConfig('web');
        const initial: string[] = [];
        for (const m of egretModules) {
            for (const asset of m.target) {
                const filename = this.libraryType == 'debug' ? asset.debug : asset.release;
                initial.push(filename);
                this.addSubTransaction(new CopyFileTransaction(filename));

            }
        }
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
            }
        }


        if (await assetsFileSystem.needUpdate('manifest.json')) {
            const manifest = { initial, game: ['main.js'] };
            const manifestContent = JSON.stringify(manifest, null, '\t');
            assetsFileSystem.update(compilation, { filePath: 'manifest.json', dependencies: this.fileDependencies }, manifestContent);
        }
    }


}

