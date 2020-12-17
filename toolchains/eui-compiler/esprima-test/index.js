const fs = require('fs');
const jsContent = fs.readFileSync('./code.js', 'utf-8');
const esprima = require("esprima");
const ast = esprima.parseScript(jsContent);
fs.writeFileSync('./ast.json', JSON.stringify(ast, null, '\t'));

const codegen = require('escodegen');


const code1 = createExpressionStatment(

    createAssignmentExpression(
        createMemberExpression(
            createIdentifier("_this"),
            createIdentifier("skinsPart")
        ),
        createIdentifier("ddd")
    )
);

const code2 = createExpressionStatment(
    createAssignmentExpression(
        createMemberExpression(createIdentifier('skins'), createIdentifier('MyComponent2')),
        createClass(createIdentifier("MyComponent2"))
    )
)


createClass(createIdentifier("MyComponent2"))

const javascript = codegen.generate(

    createProgram([code2])
)
console.log(javascript)

function createExpressionStatment(expression) {
    return {
        "type": "ExpressionStatement",
        "expression": expression
    }
}

function createAssignmentExpression(left, right) {
    return {
        "type": "AssignmentExpression",
        "operator": "=",
        "left": left,
        "right": right
    }
}

function createMemberExpression(object, property) {
    return {
        "type": "MemberExpression",
        "computed": false,
        "object": object,
        "property": property
    }
}


function createIdentifier(name) {
    return {
        "type": "Identifier",
        "name": name
    }
}

function createProgram(body) {
    return {
        "type": "Program",
        "body": body,
        "sourceType": "script"
    }
}


function createClass(className) {

    const superCall = {
        "type": "VariableDeclaration",
        "declarations": [
            {
                "type": "VariableDeclarator",
                "id": {
                    "type": "Identifier",
                    "name": "_this"
                },
                "init": {
                    "type": "LogicalExpression",
                    "operator": "||",
                    "left": {
                        "type": "CallExpression",
                        "callee": {
                            "type": "MemberExpression",
                            "computed": false,
                            "object": {
                                "type": "Identifier",
                                "name": "_super"
                            },
                            "property": {
                                "type": "Identifier",
                                "name": "call"
                            }
                        },
                        "arguments": [
                            {
                                "type": "ThisExpression"
                            }
                        ]
                    },
                    "right": {
                        "type": "ThisExpression"
                    }
                }
            }
        ],
        "kind": "var"
    };

    const returnStatement = {
        "type": "ReturnStatement",
        "argument": createIdentifier("_this")
    };

    const arguments = [
        createMemberExpression(
            createIdentifier("eui"),
            createIdentifier("Skin")
        )
    ];

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
                "body": [
                    {
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
                    },
                    {
                        "type": "FunctionDeclaration",
                        "id": className,
                        "params": [],
                        "body": {
                            "type": "BlockStatement",
                            "body": [
                                superCall,
                                returnStatement
                            ]
                        },
                        "generator": false,
                        "expression": false,
                        "async": false
                    },
                    {
                        "type": "ReturnStatement",
                        "argument": className
                    }
                ]
            },
            "generator": false,
            "expression": false,
            "async": false
        },
        "arguments": arguments
    }
}
