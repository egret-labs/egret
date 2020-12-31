import { AST_Attribute, AST_FullName_Type, AST_Node, AST_Node_Name_And_Type, AST_Skin, AST_STATE, AST_STATE_ADD, Error } from '../exml-ast';
import { IdCharacter, Element, Mapping, Token } from '../parser/ast-type';
import { xml2js } from '../parser/index';
import { ErrorPrinter } from '../parser/printError';
import { EgretElements, getTypings, initTypings, setErrorPrint } from './typings';

const skinParts: string[] = [];

export const namespaceMapping = {};

let skinNameIndex = 1;

export class EuiParser {

    private currentSkinNode!: AST_Skin;
    // private skinNameIndex = 1;
    private varIndex = 0;

    private printer: Function = () => { };

    private className = 'MyComponent1';

    public errors: Error[] = [];

    constructor(className?: string) {
        if (className)
            this.className = className;
    }

    parseText(filecontent: string, filePath: string): AST_Skin {
        const errorPrinter = new ErrorPrinter(filecontent, filePath, this);
        const printer = errorPrinter.printError.bind(errorPrinter);
        this.printer = printer;
        setErrorPrint(printer);
        const rawTree = xml2js(filecontent, printer);
        if (rawTree.elements.length > 1) {
            const token = rawTree.elements[1].name!;
            const name = token.value;
            this.printer(`another root tag found: \`${name}\``, token);
        }
        const rootExmlElement = rawTree.elements.find((e) => e.name!.value === 'e:Skin')!;
        if (!rootExmlElement) {
            this.printer('expect e:Skin', rawTree.elements[0].name)
        }
        const skinNode = this.createSkinNode(rootExmlElement);
        this.check(skinNode, this.printer);
        skinNode.errors = this.errors;
        return skinNode;
    }

    private createSkinNode(rootExmlElement: Element) {
        this.varIndex = 0;
        const childrenExmlElement = getExmlChildren(rootExmlElement);

        const classToken = rootExmlElement.attributes.find((e) => e.key!.value === 'class')!;
        if (classToken) {
            const arr = classToken.value!.value.split('.');
            const c1 = arr[0];
            const c2 = arr[1];
            this.className = c2 ? c2 : c1;
        }

        const isRootSkin = rootExmlElement && classToken;

        const fullname = isRootSkin ? classToken.value!.value : `skins.${this.className}$Skin${skinNameIndex++}`;
        const x = fullname.split('.');
        const namespace = x[1] ? x[0] : '';
        const classname = x[1] ? x[1] : x[0];

        this.currentSkinNode = {
            fullname,
            namespace,
            stateAttributes: [],
            classname,
            children: [],
            attributes: [],
            states: [],
            bindings: [],//[{ target: 'a1', templates: ["hostComponent.data.data"], chainIndex: [0], property: 'text' }]
            mapping: {},
            errors: []
        } as any as AST_Skin;
        if (isRootSkin) {
            this.currentSkinNode.mapping.fullname = classToken.value;
            if (x[1]) {
                this.currentSkinNode.mapping.namespace = classToken.value;
                this.currentSkinNode.mapping.classname = classToken.value;
            }
            else {
                this.currentSkinNode.mapping.classname = classToken.value;
            }
        }

        this.walkAST_Node(rootExmlElement);

        for (const child of rootExmlElement.attributes) {
            const key = child.key!.value;
            let value = child.value!.value;
            if (key === 'class' || key.indexOf('xmlns') >= 0) {
                if (key.indexOf('xmlns') >= 0) {
                    const reg = /^([\u4E00-\u9FA5A-Za-z0-9_]+)\.\*$/;
                    const name = key.split(':')[1];
                    if (reg.test(value as string)) {
                        const match = (value as string).match(reg);
                        if (match) {
                            namespaceMapping[name] = match[1] + '.';
                        }
                    }
                    else if (value == '*') {
                        namespaceMapping[name] = '';
                    }
                }
                continue;
            }
            value = value as string;
            if (key === 'states') {
                this.currentSkinNode.states = value.split(',');
                continue;
            }
            const type = getTypings('eui.Skin', key, child.key!);
            if (!type) {
                continue;
            }
            const attribute = createAttribute(key, type, value, {
                key: child.key!,
                value: child.value!
            });
            this.currentSkinNode.attributes.push(attribute);
        }

        for (const childElement of childrenExmlElement) {
            const child = this.createAST_Node(childElement);
            if (child) {
                this.currentSkinNode.children.push(child);
            }
        }
        return this.currentSkinNode;
    }

    private walkAST_Node(nodeExmlElement: Element) {
        const type = getClassNameFromEXMLElement(nodeExmlElement);
        if (skinParts.indexOf(type) == -1) {
            skinParts.push(type.toUpperCase());
        }
        const childrenExmlElement = getExmlChildren(nodeExmlElement);
        for (const element of childrenExmlElement) {
            this.walkAST_Node(element);
        }
    }

    private createAST_Node(nodeExmlElement: Element): AST_Node | null {

        if (nodeExmlElement.name!.value === 'w:Config') {
            return null;
        }

        const childrenExmlElement = getExmlChildren(nodeExmlElement);

        const type = getClassNameFromEXMLElement(nodeExmlElement);
        this.varIndex++;
        const node: AST_Node = {
            type,
            children: [],
            attributes: [],
            stateAttributes: [],
            varIndex: this.varIndex,
            id: null,
            mapping: { type: nodeExmlElement.name }
        };
        createAST_Attributes(node, nodeExmlElement, this.currentSkinNode, this.varIndex);

        for (const element of childrenExmlElement) {
            let nodeType: AST_Node_Name_And_Type;
            let helper = false;
            if (type === 'eui.Scroller' && element.name!.value === 'e:List') {
                nodeType = {
                    namespace: 'e',
                    name: 'viewport',
                    type: AST_FullName_Type.ATTRIBUTE
                };
            }
            else {
                helper = true;
                nodeType = getNodeType(element.name!.value);
            }
            // NodeElement的children中
            // 不一定全是 node.children
            // 也有可能是 attribute
            if (nodeType.type === AST_FullName_Type.ELEMENT) {
                const child = this.createAST_Node(element);
                if (child) {
                    node.children.push(child);
                }
            }
            else {
                const key = nodeType.name;
                const mapping: any = {};
                if (helper) {
                    mapping.key = element.name;
                }
                if (key === 'skinName' || key === 'itemRendererSkinName') {
                    const parser = new EuiParser(this.className);
                    const value = parser.createSkinNode(element.elements![0]);
                    const attribute: AST_Attribute = {
                        type: key,
                        key,
                        value,
                        mapping
                    };
                    node.attributes.push(attribute);
                }
                else if (key === 'viewport') {
                    const attribute: AST_Attribute = {
                        type: 'object',
                        key: key,
                        value: this.createAST_Node(element)!,
                        mapping
                    };
                    node.attributes.push(attribute);
                }
                else if (key === 'layout') {
                    const attribute: AST_Attribute = {
                        type: 'object',
                        key: key,
                        value: this.createAST_Node(element.elements![0])!,
                        mapping
                    };
                    node.attributes.push(attribute);
                }
                else if (key === 'props') {
                    for (const obj of element.elements as any) {
                        const value = this.createAST_Node(obj);
                        const attribute: AST_Attribute = {
                            type: 'object',
                            key: key,
                            value: value!,
                            mapping
                        };
                        node.attributes.push(attribute);
                    }
                }
                else {
                    this.printer('unexpected label name', mapping.key);
                    // throw new Error(`missing ${key}`);
                }
            }
        }
        return node;
    }

    private check(rootNode: AST_Skin | AST_Node, printer: Function) {

        checkClassName(rootNode as AST_Skin);
        checkID(rootNode as AST_Node);
        const type = (rootNode as AST_Skin).fullname ? (rootNode as AST_Skin).fullname : rootNode.type;
        checkType(rootNode as AST_Node);
        if (rootNode.type === 'eui.Scroller') checkScroller(rootNode as AST_Node);
        checkAttribute(rootNode.attributes);
        for (const child of rootNode.children) {
            this.check(child, printer);
        }


        function checkClassName(rootNode: AST_Skin) {
            if (rootNode.fullname) {
                const value = rootNode.fullname;
                const reg = /^skins\./;
                if (!value.match(reg)) {
                    // const column = rootNode.mapping.fullname.startColumn;
                    // const line = rootNode.mapping.fullname.startLine;
                    error(`Exml Error: classname should start with \`skins.\`, which value is \`${rootNode.fullname}\``, rootNode.mapping.fullname);
                }
            }
        }

        function checkID(rootNode: AST_Node) {
            const id = rootNode.id;
            if (id) {
                const arr = id.split('');
                for (const c of arr) {
                    if (!IdCharacter.includes(c)) {
                        error('Invalid character in entity name', rootNode.mapping.id);
                    }
                }
            }
        }

        function checkType(rootNode: AST_Node) {
            if (rootNode.type &&
                (rootNode.type.indexOf('eui.') > -1 && !EgretElements.includes(rootNode.type))) {
                error('unexpected label name', rootNode.mapping.type);
            }
        }

        function checkAttribute(attributes: AST_Attribute[]) {
            let keys: string[] = [];
            for (const attr of attributes) {
                if (keys.includes(attr.key) && attr.key !== 'skinName') {
                    error(`\`${type}\` has duplicated attribute: \`${attr.key}\``, attr.mapping.key);
                }
                else {
                    keys.push(attr.key);
                }
            }
        }

        function checkScroller(rootNode: AST_Node) {
            const length = rootNode.children.length;
            if (length > 1) {
                const child = rootNode.children[0];
                // const column = child.mapping.type.startColumn;
                // const line = child.mapping.type.startLine;
                error(`Exml Error: eui.Scroller can have only one child, where has ${length}`, child.mapping.type);
            }
            const type = length > 0 ? rootNode.children[0].type : '';
            if (length == 1 && type !== 'eui.Group') {
                const child = rootNode.children[0];
                // const column = child.mapping.type.startColumn;
                // const line = child.mapping.type.startLine;
                error('Exml Error: eui.Scroller\'s child type should be `eui.Group`', child.mapping.type);
            }
        }

        function error(message: string, token: Token) {
            printer(message, token);
        }
    }
}



export function generateAST(filecontent: string, filePath: string = ''): AST_Skin {
    skinNameIndex = 1;
    let result: AST_Skin;
    let parser = new EuiParser();

    ErrorPrinter.shouldPrint = false;
    try {
        result = parser.parseText(filecontent, filePath);
    }
    catch (e) {
        result = {
            fullname: '',
            namespace: '',
            stateAttributes: [],
            classname: '',
            children: [],
            attributes: [],
            states: [],
            bindings: [],
            mapping: {},
            errors: parser.errors
        } as any as AST_Skin;
    }

    return result;
}

function formatBinding(value: string, node: AST_Node) {

    const jsKeyWords: string[] = ['null', 'NaN', 'undefined', 'true', 'false'];
    const HOST_COMPONENT = 'hostComponent';

    value = value.substring(1, value.length - 1).trim();
    const templates = [value];
    const chainIndex: number[] = [];
    let length = templates.length;
    for (let i = 0; i < length; i++) {
        let item = templates[i].trim();
        if (!item) {
            templates.splice(i, 1);
            i--;
            length--;
            continue;
        }
        const first = item.charAt(0);
        if (first == '\'' || first == '"' || first >= '0' && first <= '9' || first == '-') {
            continue;
        }
        if (item.indexOf('.') == -1 && jsKeyWords.indexOf(item) != -1) {
            continue;
        }
        if (item.indexOf('this.') == 0) {
            item = item.substring(5);
        }

        const firstKey = item.split('.')[0];

        let flag = true;
        for (const item of skinParts) {
            if (item.indexOf(firstKey.toUpperCase()) > -1) {
                flag = false;
            }
        }
        if (firstKey != HOST_COMPONENT && flag) {
            item = HOST_COMPONENT + '.' + item;
        }

        templates[i] = '"' + item + '"';
        chainIndex.push(i);

    }
    return {
        templates: templates,
        chainIndex: chainIndex
    };
}

function getClassNameFromEXMLElement(element: Element) {
    let result = element.name!.value.replace(/:/g, '.');
    const firstWord = result.split('.')[0];
    switch (firstWord) {
        case 'e':
            result = result.replace('e', 'eui');
            break;
        case 'ns1':
            result = result.replace('ns1:', '');
            break;
        default:
            break;
    }
    return result;
}

function getExmlChildren(element: Element) {
    const childrenElements = element.elements;

    return childrenElements;
}

function getNodeType(name1: string): AST_Node_Name_And_Type {
    const tempArr = name1.split(':');
    const namespace = tempArr[0];
    const name = tempArr[1];
    // 根据名称的首字母是否是大小写来判断是属性还是子节点
    const type = name.charAt(0).toLowerCase() === name.charAt(0) ?
        AST_FullName_Type.ATTRIBUTE :
        AST_FullName_Type.ELEMENT;
    return { namespace, name, type };
}

function parseStateAttribute(className: string, originKey: string, value: string, mapping: Mapping): AST_STATE {
    const [key, stateName] = originKey.split('.');
    const type = getTypings(className, key, mapping.key)!;
    const attribute = createAttribute(key, type, value, mapping);
    return {
        type: 'set',
        attribute,
        name: stateName
    };
}

function createAST_Attributes(node: AST_Node, nodeElement: Element, skinNode: AST_Skin, varIndex: number) {
    const attributes: AST_Attribute[] = [];
    const className = getClassNameFromEXMLElement(nodeElement);
    for (const attr of nodeElement.attributes) {
        let key = attr.key!.value;
        if (key === 'locked') {
            continue;
        }
        let value = attr.value!.value as string;
        if (value.indexOf('%') >= 0) {
            if (key === 'width') {
                key = 'percentWidth';
                value = value.replace('%', '');
            }
            else if (key === 'height') {
                key = 'percentHeight';
                value = value.replace('%', '');
            }
        }
        if (key.indexOf('.') >= 0) {
            const stateAttribute = parseStateAttribute(className, key, value, {
                key: attr.key!,
                value: attr.value!
            });
            node.stateAttributes.push(stateAttribute);
            continue;
        }
        if (key === 'includeIn') {
            const includeStates: AST_STATE_ADD[] = value.split(',').map((sName) => {
                return {
                    name: sName,
                    type: 'add'
                };
            });
            node.stateAttributes = node.stateAttributes.concat(includeStates);
            continue;
        }
        if (key === 'id') {
            node.id = value;
            node.mapping['id'] = attr.value;
            continue;
        }

        if (value.search(/{\w*}/) > -1) {
            const result = formatBinding(value, node);
            const array = result.templates.map((item) => {
                item = item.replace(/\"/g, '');
                return item;
            });
            skinNode.bindings.push({
                target: 'a' + varIndex,
                templates: array,
                chainIndex: result.chainIndex,
                property: key
            });
            continue;
        }
        const type = getTypings(className, key, attr.key!);
        if (!type) {
            continue;
        }
        const attribute = createAttribute(key, type, value, {
            key: attr.key!,
            value: attr.value!
        });
        attributes.push(attribute);
    }
    node.attributes = attributes;
}

function createAttribute(key: string, type: string, attributeValue: string, mapping: Mapping): AST_Attribute {

    let value: AST_Attribute['value'] = attributeValue;
    if (type == 'number') {
        value = Number(attributeValue);
    }
    else if (type === 'boolean') {
        value = attributeValue === 'true';
    }
    else if (type === 'any') {
        const temp = Number(attributeValue);
        if (!isNaN(temp)) {
            value = temp;
        }
    }
    else if (['top', 'bottom', 'left', 'right'].indexOf(key) >= 0) {
        if (!isNaN(parseFloat(attributeValue))) {
            type = 'number';
            value = parseFloat(attributeValue);
        }
    }

    return {
        type,
        key,
        value,
        mapping
    };
}