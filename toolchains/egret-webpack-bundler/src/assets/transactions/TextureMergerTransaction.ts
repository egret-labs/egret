// import { Compilation } from "webpack";
// import { walkDir } from "../../utils";
// import { Transaction } from "../Transaction";
// import * as path from 'path';
// import * as texturemrger from '@egret/texture-merger-core';

// export class TextureMergerTransaction extends Transaction {

//     private files: string[] = [];

//     constructor() {
//         super();
//     }

//     get fileDependencies() {
//         return this.files;
//     }

//     async execute(compilation: Compilation) {
//         const compiler = compilation.compiler;
//         const entities = await getAllTextureMergerConfig(root);
//         for (const entity of entities) {
//             const content = await readFileAsync(compiler, entity.path);
//             const json = texturemrger.parseConfig('yaml', content.toString());
//             const relativeRoot = path.dirname(path.relative(compiler.context, entity.path)).split('\\').join('/');
//             json.root = path.dirname(entity.path);
//             const output = await texturemrger.executeMerge(json);
//             const jsonOutputFilePath = `${relativeRoot}/${json.outputName}.json`;
//             const imageOutputFilePath = `${relativeRoot}/${json.outputName}.png`;
//             const spriteSheetRelativeFilePath = path.relative('resource', jsonOutputFilePath).split('\\').join('/');
//             const spriteSheetImageRelativeFilePath = path.relative('resource', imageOutputFilePath).split('\\').join('/');
//             const spriteSheetResourceConfig = {
//                 name: `${json.outputName}_json`,
//                 url: spriteSheetRelativeFilePath,
//                 type: 'sheet',
//                 subkeys: ''
//             };
//             const subkeys = [];
//             for (const file of json.files) {
//                 const name = path.basename(file).split('.').join('_');
//                 factory.removeResource(name);
//                 subkeys.push(name);
//             }
//             spriteSheetResourceConfig.subkeys = subkeys.join(',');

//             const spriteSheetImageResourceConfig = {
//                 name: `${json.outputName}_png`,
//                 url: spriteSheetImageRelativeFilePath,
//                 type: 'image'
//             };

//             factory.emitResource(output.buffer, spriteSheetImageResourceConfig);
//             factory.emitResource(JSON.stringify(output.config), spriteSheetResourceConfig);

//         }
//     }
// }

// async function getAllTextureMergerConfig(root: string) {
//     const entities = await walkDir(root);
//     return entities.filter((e) => e.name === 'texture-merger.yaml');
// }
