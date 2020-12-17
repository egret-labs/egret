// import { walk } from 'egret-node-utils';
// import * as fs from 'fs';
// import * as path from 'path';
// import { Project, SourceFile } from 'ts-simple-ast';
// import * as convert from 'xml-js';


// export async function emitDts() {

//     const project: Project = new Project({ compilerOptions: { outDir: "libs", declaration: true } });
//     const dtsSourceFile: SourceFile = project.createSourceFile('exml.e.ts');
//     const list = await walk('resource', (path) => {
//         return path.indexOf('.exml') >= 0;
//     });
//     for (let filename of list) {
//         const contents = fs.readFileSync(filename, 'utf-8');
//         const data = convert.xml2js(contents, { compact: true }) as convert.ElementCompact;
//         const node = new EXMLNode(data);
//         const tempArr = node.className.split(".");
//         const className = tempArr.pop();
//         const namespaceName = tempArr.join(".");
//         if (namespaceName) {
//             let a = dtsSourceFile.getNamespace(namespaceName)
//             if (!a) {
//                 a = dtsSourceFile.addNamespace({ name: namespaceName })
//             }
//             a.addClass({ name: className, isExported: true, extends: "eui.Skin" });
//         }
//         else {
//             dtsSourceFile.addClass({ name: className, extends: "eui.Skin" });
//         }
//     }

//     const result = project.emitToMemory({ emitOnlyDtsFiles: true });
//     for (const file of result.getFiles()) {
//         if (file.filePath.indexOf("exml.e.d.ts")) {
//             fs.writeFileSync(file.filePath, file.text);
//         }
//     }
// }


// class EXMLNode {

//     public readonly className!: string;

//     constructor(public xmlNode: convert.ElementCompact) {
//         const element = xmlNode['e:Skin'] as convert.ElementCompact;
//         this.className = element._attributes!.class as string;
//     }
// }


