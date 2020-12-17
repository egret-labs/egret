import * as fs from 'fs';
import * as path from 'path';
import { generateAST } from '../util/parser';
import { AST_Node } from '../exml-ast';

export interface ThemeData {

    skins: { [componentName: string]: string },

    autoGenerateExmlsList: boolean,

    exmls: string[]

}


export class ThemeFile {

    data: ThemeData;

    private _dependenceMap: { [filename: string]: string[] } = {};
    private _preloads: string[] = [];

    constructor(private projectRoot: string, public filePath: string) {
        const jsonContent = fs.readFileSync(path.join(projectRoot, filePath), 'utf-8');
        const json = JSON.parse(jsonContent) as ThemeData;
        this.data = json;
        const duplicate = json.exmls.filter((item, index, array) => {
            return array.lastIndexOf(item) !== array.indexOf(item)
        })
        if (duplicate.length > 0) {
            console.log(`存在相同的皮肤文件`, duplicate)
            process.exit(1);
        }
    }

    public sort(exmls: any[], clear: boolean = false) {
        const theme = this.data;
        if (!theme.exmls || !theme.skins) {
            return;
        }
        if (clear) {
            this._dependenceMap = {};
        }
        this._preloads = exmls.filter((value) => value.preload).map((value) => value.filename);
        this.getDependence(exmls);
        theme.exmls.sort((a, b) => a.localeCompare(b));
        theme.exmls = this.sortExmls(exmls.map(item => item.filename));
    }

    private getDependence(exmls: any[]) {
        const dependenceMap = this._dependenceMap;
        for (const exml of exmls) {
            if (exml.filename in dependenceMap) continue;

            const skinNode = generateAST(exml.contents)
            const classes: string[] = ['eui:Skin'];
            for (const child of skinNode.children) {
                classes.push(...this.getDependenceClasses(child));
            }
            dependenceMap[exml.filename] = classes.filter((value, index, arr) => arr.indexOf(value) === index);
        }
    }


    private getDependenceClasses(node: AST_Node) {
        const result = [node.type];
        for (const child of node.children) {
            result.push(...this.getDependenceClasses(child));
        }
        return result;
    }

    private sortExmls(exmls: string[]) {
        const result: string[] = []
        const preloads = this._preloads
        for (const filename of exmls) {
            if (preloads.indexOf(filename) > -1) {
                this.sortFileName(filename, result);
            }
        }
        for (const filename of exmls) {
            this.sortFileName(filename, result);
        }
        return result;
    }

    private sortFileName(filename: string, output: string[]) {
        if (output.indexOf(filename) > -1) return;

        const dependencies = this._dependenceMap[filename];
        if (!dependencies) return;

        const skins = this.data.skins;
        for (const dependence of dependencies) {
            if (!skins[dependence]) continue;

            this.sortFileName(skins[dependence], output);
        }
        output.push(filename);
    }
}