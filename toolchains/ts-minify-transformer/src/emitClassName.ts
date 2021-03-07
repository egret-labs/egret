import * as ts from 'typescript';

function isTypeScriptDeclaration(node: ts.Node) {
    if (node.modifiers) {
        return node.modifiers.some((m) => m.kind === ts.SyntaxKind.DeclareKeyword);
    }
    else {
        return false;
    }
}

function hasExport(node: ts.Node) {
    if (node.modifiers) {
        return node.modifiers.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    }
    else {
        return false;
    }
}

function getFullName(namedNode: ts.NamedDeclaration) {
    let node: ts.Node = namedNode;
    const moduleNames: string[] = [namedNode.name!.getText()];
    while (node.parent) {
        node = node.parent;
        if (ts.isModuleDeclaration(node)) {
            moduleNames.unshift(node.name.getText());
        }
    }
    return {
        fullname: moduleNames.join('.'),
        hasNamespace: moduleNames.length > 1
    };
}

function isGlobalVariable(node: ts.Node) {
    let n = node;
    while (n.parent) {
        n = n.parent;
        if (ts.isModuleDeclaration(n)) {
            return false;
        }
    }
    return true;
}

function createGlobalExpression(text: string) {
    return ts.createIdentifier(`window["${text}"] = ${text};`);
}

function getInterfaces(node: ts.ClassDeclaration, program: ts.Program) {

    const result: string[] = [];
    const typeChecker = program.getTypeChecker();

    if (node.heritageClauses) {
        for (const h of node.heritageClauses) {
            if (h.token === ts.SyntaxKind.ImplementsKeyword) {
                for (const type of h.types) {
                    const name = type.expression;
                    const symbol = typeChecker.getSymbolAtLocation(name)!;
                    const typeSymbol = typeChecker.getDeclaredTypeOfSymbol(symbol);
                    const baseTypes = typeSymbol.getBaseTypes();
                    if (baseTypes) {
                        for (const baseType of baseTypes) {
                            const declaration = baseType.symbol.declarations[0];

                            const { fullname } = getFullName(declaration);
                            result.push(fullname);
                        }
                    }
                    result.push(name.getText());
                }
            }
        }
    }
    return result;
}

export function emitReflect(prefix: string, program: ts.Program) {
    return function (ctx: ts.TransformationContext) {

        function visitClassDeclaration(node: ts.ClassDeclaration) {
            if (isTypeScriptDeclaration(node)) {
                return node;
            }
            const nameNode = node.name;
            if (nameNode) {
                const result = getFullName(node);
                const arrays: ts.Node[] = [
                    node
                ];
                const interfaces = getInterfaces(node, program).map((item) => `"${prefix}.${item}"`).join(',');
                const reflectExpression = ts.createIdentifier(`__reflect(${nameNode.getText()}.prototype,"${prefix}.${result.fullname}",[${interfaces}]); `);
                arrays.push(reflectExpression);

                return ts.createNodeArray(arrays);
            }
            else {
                return node;
            }
        }

        function visitor(node: ts.Node): any {

            let result: ts.Node | ts.NodeArray<ts.Node>;

            if (ts.isClassDeclaration(node)) {
                result = visitClassDeclaration(node);
            }
            else {
                result = ts.visitEachChild(node, visitor, ctx);
            }

            return result;
        };
        return function (sf: ts.SourceFile) {
            return ts.visitNode(sf, visitor);
        };
    };
}

export function emitClassName(program: ts.Program) {
    return function (ctx: ts.TransformationContext) {
        function visitClassDeclaration(node: ts.ClassDeclaration) {
            if (isTypeScriptDeclaration(node)) {
                return node;
            }
            const nameNode = node.name;
            if (nameNode) {
                const result = getFullName(node);
                const arrays: ts.Node[] = [
                    node
                ];
                if (!result.hasNamespace) {
                    const globalExpression = createGlobalExpression(result.fullname);
                    arrays.push(globalExpression);
                }

                const interfaces = getInterfaces(node, program).map((item) => `"${item}"`).join(',');
                // const interfaces = getInterfaces(node, program).map((item) => `"${item}"`).join(',');
                const reflectExpression = ts.createIdentifier(`__reflect(${nameNode.getText()}.prototype,"${result.fullname}",[${interfaces}]); `);
                arrays.push(reflectExpression);

                return ts.createNodeArray(arrays);
            }
            else {
                return node;
            }
        }

        function visitVariableStatement(node: ts.VariableStatement) {
            if (isTypeScriptDeclaration(node) || hasExport(node)) {
                return node;
            }

            const globalExpressions = node.declarationList.declarations.map((d) => {
                const nameNode = d.name;
                const nameText = nameNode.getText();
                const globalExpression = createGlobalExpression(nameText);
                return globalExpression;
            });

            return ts.createNodeArray(
                [node as ts.Node].concat(globalExpressions)
            );
        }

        function visitFunctionOrEnumDeclaration(node: ts.NamedDeclaration) {
            if (isTypeScriptDeclaration(node)) {
                return node;
            }
            const nameNode = node.name;
            if (nameNode) {
                const nameText = nameNode!.getText();
                const globalExpression = createGlobalExpression(nameText);
                const arrays = [
                    node,
                    globalExpression
                ];
                if (node.kind === ts.SyntaxKind.ModuleDeclaration) {
                    arrays.unshift(
                        ts.createIdentifier(`var ${nameText} = window['${nameText}']; `)
                    );
                }
                return ts.createNodeArray(arrays);
            }
            else {
                return node;
            }
        }

        function visitor(node: ts.Node): any {

            let result: ts.Node | ts.NodeArray<ts.Node>;

            if (node.kind === ts.SyntaxKind.ClassDeclaration) {
                result = visitClassDeclaration(node as ts.ClassDeclaration);
            }
            else if (node.kind === ts.SyntaxKind.EnumDeclaration) {
                result = visitFunctionOrEnumDeclaration(node as ts.EnumDeclaration);
            }
            else if (node.kind === ts.SyntaxKind.ModuleDeclaration) {
                result = ts.visitEachChild(node, visitor, ctx);
                result = visitFunctionOrEnumDeclaration(result as ts.ModuleDeclaration);
            }
            else if ((node.kind === ts.SyntaxKind.FunctionDeclaration) && isGlobalVariable(node)) {
                result = visitFunctionOrEnumDeclaration(node as ts.FunctionDeclaration);
            }
            else if (node.kind === ts.SyntaxKind.VariableStatement && isGlobalVariable(node)) {
                result = visitVariableStatement(node as ts.VariableStatement);
            }
            else {
                result = ts.visitEachChild(node, visitor, ctx);
            }

            return result;
        };
        return function (sf: ts.SourceFile) {
            return ts.visitNode(sf, visitor);
        };
    };
}