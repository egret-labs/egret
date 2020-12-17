import { BaseEmitter } from ".";
import { AST_Skin } from "../exml-ast";

export class DeclarationEmitter extends BaseEmitter {

    private declaration: string = '';

    getResult(): string {
        return this.declaration;
    }
    emitHeader(themeData: any): void {

    }
    emitSkinNode(filename: string, skinNode: AST_Skin): void {
        const text = this.generateText(skinNode.classname, skinNode.namespace);
        this.declaration += text;
    }

    generateText(className: string, moduleName: string) {
        let text = '';
        if (moduleName) {
            text = `declare module ${moduleName} {
    class ${className} extends eui.Skin {
    }
}
`;
        }
        else {
            text = `class ${className} extends eui.Skin {
}
`;
        }
        return text;
    }
}
