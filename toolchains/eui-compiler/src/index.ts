
import * as fs from 'fs';
import * as glob from 'glob';
import * as path from 'path';
import { DeclarationEmitter, JavaScriptEmitter, JSONEmitter } from './emitter';
import { getFilePathRelativeProjectRoot, getThemes, initilize } from './eui-config';
import { AST_Skin } from './exml-ast';
import { ThemeFile } from './theme';
import { generateAST } from './util/parser';
import { initTypings } from './util/typings';
/* eslint-disable global-require */
export const parser = require('./util/parser') as typeof import('./util/parser');
export const typeInit = initTypings;
export const emitter = {
    JavaScriptEmitter,
    JSONEmitter,
    DeclarationEmitter
};

export type EuiAstTransformer = (ast: AST_Skin) => AST_Skin

type EmitSolution = (theme: ThemeFile, transformers: EuiAstTransformer[]) => { filename: string, content: string }

const javascriptEmitSolution: EmitSolution = (theme, transformers) => {
    const themeData = theme.data;
    const exmlFiles = themeData.exmls;
    const emitter = new JavaScriptEmitter();
    emitter.emitHeader(themeData);
    for (const filename of exmlFiles) {
        const fullpath = getFilePathRelativeProjectRoot(filename);
        const content = fs.readFileSync(fullpath, 'utf-8');
        let skinNode = generateAST(content);
        for (const transformer of transformers) {
            skinNode = transformer(skinNode);
        }
        emitter.emitSkinNode(filename, skinNode);
    }
    const filename = theme.filePath.replace('thm.json', 'thm.js');
    const content = emitter.getResult();
    return { filename, content };
};

const jsonEmitSolution: EmitSolution = (theme, transformers) => {
    const themeData = theme.data;
    const exmlFiles = themeData.exmls;
    const emitter = new JSONEmitter();
    for (const filename of exmlFiles) {
        const fullpath = getFilePathRelativeProjectRoot(filename);
        const content = fs.readFileSync(fullpath, 'utf-8');
        let skinNode = generateAST(content);
        for (const transformer of transformers) {
            skinNode = transformer(skinNode);
        }
        emitter.emitSkinNode(filename, skinNode);
    }
    const filename = theme.filePath.replace('thm.json', 'thm.js');
    const content = emitter.getResult();
    return { filename, content };
};

const debugEmitSolution: EmitSolution = (theme, transformers) => {
    if (theme.data.autoGenerateExmlsList) {
        const dirname = path.dirname(theme.filePath);
        // const 
        const exmlFiles = glob.sync('**/*.exml', { cwd: dirname }).map((item) => path.join(dirname, item).split('\\').join('/'));
        const exmlContents = exmlFiles.map((filename) => {
            const contents = fs.readFileSync(filename, 'utf-8');
            return { filename, contents };
        });
        theme.sort(exmlContents);
        const content = JSON.stringify(theme.data, null, '\t');
        fs.writeFileSync(theme.filePath, content);
    }
    const themeData = theme.data;
    const exmlFiles = themeData.exmls;
    const emitter = new DeclarationEmitter();
    for (const filename of exmlFiles) {
        const fullpath = getFilePathRelativeProjectRoot(filename);
        const content = fs.readFileSync(fullpath, 'utf-8');
        let skinNode = generateAST(content);
        for (const transformer of transformers) {
            skinNode = transformer(skinNode);
        }
        emitter.emitSkinNode(filename, skinNode);
    }
    const filename = 'libs/exml.e.d.ts';
    const content = emitter.getResult();
    return { filename, content };
};

const rawEmitSolution: EmitSolution = (theme) => {

    const filename = theme.filePath.replace('thm.json', 'raw.thm.json');
    const themeData = theme.data;
    const exmlFiles = themeData.exmls;
    const result: any = {};

    function walkObject(obj: any) {
        if (obj.mapping) {
            delete obj.mapping;
        }
        for (const key in obj) {
            const v = obj[key];
            if (v && typeof v === 'object') {
                walkObject(v);
            }
        }
    }

    for (const filename of exmlFiles) {
        const fullpath = getFilePathRelativeProjectRoot(filename);
        const content = fs.readFileSync(fullpath, 'utf-8');
        const skinNode = generateAST(content);
        walkObject(result);
        result[filename] = skinNode;
    }
    result.skins = theme.data.skins;

    return {
        filename,
        content: JSON.stringify(result, null, '\t')
    };
};

const modes: { [mode: string]: EmitSolution } = {
    'commonjs': javascriptEmitSolution,
    'commonjs2': jsonEmitSolution,
    'debug': debugEmitSolution,
    'raw': rawEmitSolution
};

export class EuiCompiler {

    private _transformers: EuiAstTransformer[] = [];

    constructor(root: string, private mode = 'commonjs') {
        initilize(root);
        initTypings();
    }

    setCustomTransformers(transformers: EuiAstTransformer[]) {
        this._transformers = transformers;
    }

    emit(): { filename: string, content: string }[] {
        const themes = getThemes();
        const solution = modes[this.mode];
        return themes.map((theme) => solution(theme, this._transformers));
    }

    getThemes() {
        return getThemes();
    }
}

