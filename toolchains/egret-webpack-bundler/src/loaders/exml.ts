
// const exmlLoader: webpack.loader.Loader = function (content) {
//     const result = parser.parse(content);
//     const className = result.className.replace(/^skins./, 'eui.');
//     const resource = this.resource.replace(this.rootContext || (this as any).options.context, '.');

import * as eui from "@egret/eui-compiler";
import * as path from 'path';
import * as webpack from 'webpack';
//     let code = `${STATIC}
//       module.exports = ${result.code};
//       if (window.generateEUI) {
//         generateEUI.skins['${className.replace(/Skin$/, '')}'] = "${resource}";
//         generateEUI.paths['${resource}'] = window['${className}']= module.exports;
//       }
//       if (window.EXML) {
//         EXML.update('${resource}', module.exports);
//       }`;

//     if (process.env.NODE_ENV === 'production') {
//         // 内部类变量名不稳定eg: AddEntergyPanelSkin$Skin1
//         // 用terser规避一下，保证hash相同
//         code = Terser.minify(code).code;
//     }
//     return code;
// };

const exmlLoader: webpack.loader.Loader = function (content) {

    if (!euiCompiler) {
        // euiCompiler = new eui.EuiCompiler(this.rootContext);
    }
    const { parser, emitter } = eui;
    const skinNode = parser.generateAST(content.toString());
    const jsEmitter = new emitter.JavaScriptEmitter();
    const relativePath = path.relative(this.rootContext, this.resourcePath).split("\\").join("/");
    jsEmitter.emitSkinNode(relativePath, skinNode);
    // const theme = euiCompiler.getThemes()[0]
    // generateThemeJs(this, theme);
    const result = `module.exports = ${jsEmitter.getResult()};`
    return result;
}

function generateThemeJs(loaderContext: webpack.loader.LoaderContext, theme: import("@egret/eui-compiler/lib/theme").ThemeFile) {
    const outputFilename = theme.filePath.replace(".thm.json", ".thm.js");
    const requires = theme.data.exmls.map(exml => `require("./${path.relative(path.dirname(theme.filePath), exml).split("\\").join("/")}");`);
    const content = `window.skins = window.skins || {};
window.generateEUI = window.generateEUI || {
  paths: {},
  styles: undefined,
  skins: ${JSON.stringify(theme.data.skins, null, '\t')},
};
${requires.join('\n')}
module.exports = window.generateEUI;
`;
    loaderContext.emitFile(outputFilename, content, null);
}



let euiCompiler: eui.EuiCompiler;

function getEuiCompier() {

}

export default exmlLoader;
