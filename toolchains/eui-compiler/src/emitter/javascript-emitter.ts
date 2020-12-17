import * as codegen from 'escodegen';
import { BaseEmitter } from '.';
import { AST_Attribute, AST_Node, AST_NodeBase, AST_Skin, AST_STATE, AST_Binding } from "../exml-ast";
import { EmitterHost } from './host';




export class JavaScriptEmitter extends BaseEmitter {



    private mapping: { [index: string]: EmitterFunction } = {
        number: createNumberOrBooleanLiteral,
        boolean: createNumberOrBooleanLiteral,
        string: createStringLiteral,
        any: createStringLiteral,
        'egret.Rectangle': createNewRectangle,
        'object': this.createNewObject.bind(this),
        skinName: createSkinName,
        itemRendererSkinName: createSkinName
    }

    private javascript = '';

    getResult() {
        return this.javascript;
    }

    private body: JS_AST.Node[] = [];

    emitHeader(themeData: any) {
        let outputText = '';
        outputText += extendsHelper;
        outputText += euiHelper(themeData.skins);
        this.javascript += outputText;
    }

    emitSkinNode(filename: string, skinNode: AST_Skin) {
        let ast = this.generateJavaScriptAST(skinNode);
        try {
            const text = codegen.generate(
                ast
            )
            this.javascript += text + "\n";
            this.javascript += `
    generateEUI.paths['${filename}'] = ${skinNode.namespace}.${skinNode.classname};
            `;
        }
        catch (e) {
            console.log(`${filename}编译失败`);
            console.log(e.stack);
        }
    }

    generateJavaScriptAST(skinNode: AST_Skin) {

        const code = this.createSkinNodeAst(skinNode);
        return createProgram([code]);
    }

    createSkinNodeAst(skinNode: AST_Skin) {
        const ids: string[] = [];

        const host = new EmitterHost();

        const states: { name: string, items: (AST_STATE & { context: number })[] }[] = [];



        if (skinNode.states) {
            for (const stateName of skinNode.states) {
                states.push({ name: stateName, items: [] })
            }
        }

        function visitChildren(node: AST_Node) {
            if (node.id) {
                ids.push(node.id);
            }

            for (let stateAttribute of node.stateAttributes) {
                let arr = states.find(s => s.name === stateAttribute.name)!;
                arr.items.push(Object.assign({}, stateAttribute, { context: node.varIndex }))
            }

            node.children.forEach(visitChildren);

        }

        visitChildren(skinNode as any as AST_Node)

        const className = createIdentifier(skinNode.classname);
        const namespace = skinNode.namespace ? createIdentifier(skinNode.namespace) : null;
        this.writeToBody(emitSkinPart(ids));
        const context = createIdentifier('_this');
        this.emitAttributes(context, skinNode, host)
        this.emitChildren(context, skinNode, host);


        for (let binding of skinNode.bindings) {
            const result = this.emitBinding(binding)
            this.writeToBody(result);
        }


        if (skinNode.states.length > 0) {
            this.writeToBody(
                createExpressionStatment(
                    createAssignmentExpression(
                        createMemberExpression(context, createIdentifier('states')),
                        createArray(
                            states.map(s => {
                                return createNewExpression(
                                    createMemberExpression(
                                        createIdentifier('eui'),
                                        createIdentifier("State")
                                    ),
                                    [
                                        createStringLiteral(s.name),
                                        createArray(s.items.map((item) => {
                                            if (item.type === 'set') {
                                                return createNewExpression(
                                                    createMemberExpression(
                                                        createIdentifier("eui"),
                                                        createIdentifier("SetProperty")
                                                    ),
                                                    [
                                                        createStringLiteral(`a${item.context}`),
                                                        createStringLiteral(item.attribute.key),
                                                        this.mapping[item.attribute.type](item.attribute.value, host)
                                                    ]
                                                )
                                            }
                                            else {
                                                return createNewExpression(
                                                    createMemberExpression(
                                                        createIdentifier("eui"),
                                                        createIdentifier("AddItems")
                                                    ),
                                                    [
                                                        createStringLiteral(`a${item.context}`),
                                                        createStringLiteral(""),
                                                        createNumberOrBooleanLiteral(1),
                                                        createStringLiteral("")
                                                        // createStringLiteral(item.attribute.key),
                                                        // this.mapping[item.attribute.type](item.attribute.value)
                                                    ]
                                                )
                                            }

                                        }))
                                    ]
                                )
                            })
                        )
                    )
                )
            )
        }
        const body = namespace ?
            createExpressionStatment(
                createAssignmentExpression(
                    createMemberExpression(namespace, className),
                    createClass(className, this.body, host)
                )) : createVariableDeclaration(className, createClass(className, this.body, host))
        return body
    }


    private emitNode(node: AST_Node, host: EmitterHost) {
        const context = createVarIndexIdentifier(node)
        // if (node.type.indexOf('w.') > -1) {
        //     this.emitAttributes(context, node, host)
        //     this.emitChildren(context, node, host);
        //     return;
        // }
        this.writeToBody(
            emitCreateNode(
                context,
                emitComponentName(node.type)
            )
        );
        if (node.id) {
            this.writeToBody(
                createExpressionStatment(
                    createAssignmentExpression(
                        createMemberExpression(createIdentifier("_this"), createIdentifier(node.id)),
                        context
                    )
                )
            )
        }
        if (node.stateAttributes.length > 0) {
            this.writeToBody(
                createExpressionStatment(
                    createAssignmentExpression(
                        createMemberExpression(createIdentifier("_this"), context),
                        context
                    )
                )
            )
        }
        this.emitAttributes(context, node, host)
        this.emitChildren(context, node, host);
    }

    private emitChildren(context: JS_AST.Identifier, node: AST_NodeBase, host: EmitterHost) {
        if (node.children.length == 0) {
            return;
        }
        for (let child of node.children) {
            if (child.type.indexOf('w.') == -1) {

                this.emitNode(child, host)
            }
            else {
                for (let _child of child.children) {
                    const context = createVarIndexIdentifier(_child)
                    //this.emitChildren(context, _child, host)
                    this.emitNode(_child, host)
                }
            }
        }

        let children = node.children.map(node => {
            if (node.type.indexOf('w.') == -1) {
                return createVarIndexIdentifier(node)
            }
            else {
                return null;
            }
        })
        children = children.filter(function (s) {
            return s;
        });
        const type = (node as any).type;
        let propertyKey = 'elementsContent';
        if (type) {
            if (type.indexOf('TweenGroup') > -1) {
                propertyKey = 'items';
            }
            else if (type.indexOf('TweenItem') > -1) {
                propertyKey = 'paths';
            }
        }
        this.writeToBody(emitElementsContent(context.name, children as JS_AST.Identifier[], propertyKey))
    }

    private emitAttributes(context: JS_AST.Identifier, node: AST_NodeBase, host: EmitterHost) {
        if ((node as any).type) {
            if ((node as any).type.indexOf('w.') == -1) {

                for (const attribute of node.attributes) {
                    this.writeToBody(this.emitAttribute(context, attribute, host))
                };
            }
        }
        else {
            for (const attribute of node.attributes) {
                this.writeToBody(this.emitAttribute(context, attribute, host))
            };
        }
    }

    private createNewObject(value: AST_Node, host: EmitterHost): JS_AST.Node {

        const varIndexIdentifer = createIdentifier(`a${value.varIndex}`)
        this.emitNode(value, host);
        return varIndexIdentifer
    }


    private writeToBody(node: JS_AST.Node) {
        this.body.push(node);
    }

    private emitAttribute(context: JS_AST.Identifier, attribute: AST_Attribute, host: EmitterHost): JS_AST.Node {

        const emitterFunction = this.mapping[attribute.type];
        if (!emitterFunction) {
            console.error("找不到", attribute.key, attribute.type, attribute.value);
            process.exit(1);
            return null as any as JS_AST.Node;
        }
        else {
            return createExpressionStatment(
                createAssignmentExpression(
                    createMemberExpression(
                        context,
                        createIdentifier(attribute.key)
                    ),
                    emitterFunction(attribute.value, host)
                )
            )
        }
    }

    private emitBinding(binding: AST_Binding) {

        const words = binding.templates.map(item => {
            const result = Number(item);
            if (isNaN(result)) {
                return item;
            }
            else {
                return result;
            }
        });
        const keys = binding.chainIndex;
        let elements: any[] = [];
        let index: any[] = [];
        for (const word of words) {
            elements.push(createStringLiteral(word as string))
        }
        for (const key of keys) {
            index.push(createNumberOrBooleanLiteral(key))
        }
        const result = createExpressionStatment(createCallExpression(
            createMemberExpression(
                { type: 'Identifier', name: 'eui.Binding' },
                { type: 'Identifier', name: '$bindProperties' }
            ), [
            createThis(),
            createArray(elements),
            createArray(index),
            createIdentifier(binding.target),
            createStringLiteral(binding.property)
        ]))
        return result;

    }
}

function createVarIndexIdentifier(node: AST_Node) {
    return createIdentifier(`a${node.varIndex}`)
}

function emitComponentName(type: string) {
    const arr = type.split('.');
    return createMemberExpression(
        createIdentifier(arr[0]),
        createIdentifier(arr[1])
    )
}

function emitElementsContent(context: string, ids: JS_AST.Identifier[], propertyKey: string) {
    return createExpressionStatment(
        createAssignmentExpression(
            createMemberExpression(createIdentifier(context),
                createIdentifier(propertyKey)),
            createArray(
                ids
            )
        )
    )
}


function emitCreateNode(varIndex: JS_AST.Identifier, componentName: JS_AST.Node) {
    return {
        type: "VariableDeclaration",
        declarations: [
            {
                type: "VariableDeclarator",
                id: varIndex,
                init: createNewExpression(
                    componentName, []
                )
            }
        ],
        kind: "var"
    }
}


function emitSkinPart(skins: string[]): JS_AST.Node {
    return createExpressionStatment(
        createAssignmentExpression(
            createMemberExpression(
                createIdentifier("_this"),
                createIdentifier("skinParts"),
            ),
            createArray(skins.map(createStringLiteral))
        )
    )
}

type EmitterFunction = (value: any, host: EmitterHost) => JS_AST.Node







namespace JS_AST {

    export type Node = {
        type: string
    }

    export type Identifier = {
        type: "Identifier",
        name: string
    }

    export type MemberExpression = {

        type: "MemberExpression",
        computed: false,
        object: Node,
        property: Node

    }

    export type Literal = {
        type: "Literal",
        value: any,
        raw: any
    }
}


function createArray(elements: JS_AST.Node[]) {
    return {
        type: "ArrayExpression",
        elements
    }
}

function createStringLiteral(value: string): JS_AST.Literal {
    return {
        type: "Literal",
        value,
        raw: "\"" + value + "\""
    }
}

function createSkinName(value: AST_Skin, host: EmitterHost) {

    const emitter = new JavaScriptEmitter();
    host.insertClassDeclaration(
        emitter.createSkinNodeAst(value)
    );
    return createIdentifier(value.fullname);
}

function createNumberOrBooleanLiteral(value: number | boolean): any {

    if (typeof value === 'number') {
        if (value < 0 || (value === 0 && 1 / value < 0)) {
            return {
                "type": "UnaryExpression",
                "operator": "-",
                "argument": {
                    type: "Literal",
                    value: -value,
                    raw: -value.toString()
                },
                "prefix": true
            }
        }
    }
    return {
        type: "Literal",
        value,
        raw: value.toString()
    }
}

function createNewRectangle(value: string) {
    const args = value.split(",").map((v) => parseInt(v));
    return createNewExpression(
        createMemberExpression(
            createIdentifier('egret'), createIdentifier('Rectangle')
        ),
        [
            createNumberOrBooleanLiteral(args[0]),
            createNumberOrBooleanLiteral(args[1]),
            createNumberOrBooleanLiteral(args[2]),
            createNumberOrBooleanLiteral(args[3])
        ]
    )
}

function createNewExpression(callee: JS_AST.Node, args: JS_AST.Node[]) {
    return {
        type: "NewExpression",
        callee: callee,
        arguments: args
    }
}

function createExpressionStatment(expression: JS_AST.Node) {
    return {
        "type": "ExpressionStatement",
        "expression": expression
    }
}

function createAssignmentExpression(left: JS_AST.Node, right: JS_AST.Node) {
    return {
        "type": "AssignmentExpression",
        "operator": "=",
        "left": left,
        "right": right
    }
}

function createMemberExpression(object: JS_AST.Identifier, property: JS_AST.Identifier) {
    return {
        "type": "MemberExpression",
        "computed": false,
        "object": object,
        "property": property
    }
}


function createIdentifier(name: string): JS_AST.Identifier {
    return {
        "type": "Identifier",
        name
    }
}

function createProgram(body: JS_AST.Node[]) {
    return {
        "type": "Program",
        body,
        "sourceType": "script"
    }
}

function createVariableDeclaration(left: JS_AST.Identifier, right: any) {
    return {
        "type": "VariableDeclaration",
        "declarations": [
            {
                "type": "VariableDeclarator",
                "id": left,
                "init": right
            }
        ],
        "kind": "var"
    }
}

function createThis() {
    return {
        "type": "ThisExpression"
    }
}

function createClass(className: JS_AST.Identifier, constractorBody: any[], host: EmitterHost) {

    const superCall = createVariableDeclaration(
        createIdentifier('_this'),
        {
            "type": "LogicalExpression",
            "operator": "||",
            "left": {
                "type": "CallExpression",
                "callee": createMemberExpression(
                    createIdentifier('_super'),
                    createIdentifier('call')
                ),
                "arguments": [
                    createThis()
                ]
            },
            "right": createThis()
        }
    );


    const returnStatement: any = {
        "type": "ReturnStatement",
        "argument": createIdentifier("_this")
    };

    const fullConstractorBody = [superCall].concat(constractorBody).concat([returnStatement]);

    const functionArguments = [
        createMemberExpression(
            createIdentifier("eui"),
            createIdentifier("Skin")
        )
    ];

    const extendExpression = {
        "type": "ExpressionStatement",
        "expression": {
            "type": "CallExpression",
            "callee": {
                "type": "Identifier",
                "name": "__extends"
            },
            "arguments": [
                className,
                {
                    "type": "Identifier",
                    "name": "_super"
                }
            ]
        }
    };

    const classAsFunction = {
        "type": "FunctionDeclaration",
        "id": className,
        "params": [],
        "body": {
            "type": "BlockStatement",
            "body": fullConstractorBody
        },
        "generator": false,
        "expression": false,
        "async": false
    };

    const returnExpression = {
        "type": "ReturnStatement",
        "argument": className
    };
    const body = ([extendExpression] as any[]).concat(host.list).concat([classAsFunction, returnExpression]);
    return {
        "type": "CallExpression",
        "callee": {
            "type": "FunctionExpression",
            "id": null,
            "params": [
                {
                    "type": "Identifier",
                    "name": "_super"
                }
            ],
            "body": {
                "type": "BlockStatement",
                "body": body
            },
            "generator": false,
            "expression": false,
            "async": false
        },
        "arguments": functionArguments
    }
}

function createCallExpression(callee: JS_AST.Node, args: JS_AST.Node[]) {
    return {
        type: "CallExpression",
        callee: callee,
        arguments: args
    }
}


const extendsHelper = `
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();

`

function euiHelper(skins: any) {
    return `
    window.skins=window.skins||{};
    window.generateEUI = {};
    generateEUI.paths = {};
    generateEUI.styles = undefined;
    generateEUI.skins = ${JSON.stringify(skins)};
    `
}