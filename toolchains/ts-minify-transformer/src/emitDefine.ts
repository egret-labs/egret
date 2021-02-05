
import * as ts from 'typescript';



/**
 * 添加编译的 DEFINE 参数
 */
type Defines = {
    [key: string]: string | number | boolean
};
export function emitDefine(define: Defines) {

    return (ctx: ts.TransformationContext) => {
        const visitor = (node: ts.Node): ts.VisitResult<any> => {
            if (node.kind === ts.SyntaxKind.Identifier) {
                const identifier = node as ts.Identifier;
                const key = identifier.text;
                if (define.hasOwnProperty(key)) {
                    const value = define[identifier.text];
                    if (typeof value === 'string') {
                        return ts.createStringLiteral(value);
                    }
                    else if (typeof value === 'number') {
                        return ts.createNumericLiteral(value.toString());
                    }
                    else if (typeof value === 'boolean') {
                        return value ? ts.createTrue() : ts.createFalse();
                    }
                    else {
                        console.error(`非法的 Define 值 : ${identifier.text}`);
                        return ts.visitEachChild(node, visitor, ctx);
                    }
                }
                return ts.visitEachChild(node, visitor, ctx);
            }
            else {
                return ts.visitEachChild(node, visitor, ctx);
            }

        };
        return (sf: any) => ts.visitNode(sf, visitor);
    };

}