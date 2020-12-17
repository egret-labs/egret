import * as convert from 'xml-js';
import { AST_Attribute, AST_FullName_Type, AST_Node, AST_Node_Name_And_Type, AST_Skin, AST_STATE, AST_STATE_ADD } from '../exml-ast';
import { getTypings } from './typings';

let skinParts: string[] = [];


class EuiParser {


    private currentSkinNode!: AST_Skin;
    private skinNameIndex = 1;
    private varIndex = 0;

    parseText(filecontent: string): AST_Skin {
        const data = convert.xml2js(filecontent) as convert.Element;
        const rootExmlElement = data.elements!.find(e => e.name === 'e:Skin')!;
        const skinNode = this.createSkinNode(rootExmlElement);
        return skinNode;
    }


    createSkinNode(rootExmlElement: convert.Element) {
        this.varIndex = 0;
        const childrenExmlElement = getExmlChildren(rootExmlElement);

        const isRootSkin = rootExmlElement
            && rootExmlElement.attributes
            && rootExmlElement.attributes.class

        const fullname = isRootSkin ? rootExmlElement.attributes!.class as string : `skins.MyComponent1$Skin${this.skinNameIndex}`
        // : `TestSkin${this.skinNameIndex++}`;
        const x = fullname.split(".");
        const namespace = x[1] ? x[0] : "";
        const classname = x[1] ? x[1] : x[0];

        this.currentSkinNode = {
            fullname,
            namespace,
            stateAttributes: [],
            classname,
            children: [],
            attributes: [],
            states: [],
            bindings: []//[{ target: 'a1', templates: ["hostComponent.data.data"], chainIndex: [0], property: 'text' }]
        }

        this.walkAST_Node(rootExmlElement);
        for (let key in rootExmlElement.attributes) {

            if (key === 'class' || key.indexOf("xmlns") >= 0) {
                continue;
            }
            const value = rootExmlElement.attributes[key] as string;
            if (key === 'states') {
                this.currentSkinNode.states = value.split(',');
                continue;
            }
            const type = getTypings('eui.Skin', key);
            if (!type) {
                continue;
            }
            const attribute = createAttribute(key, type, value);
            this.currentSkinNode.attributes.push(attribute);

        }

        for (let childElement of childrenExmlElement) {

            const child = this.createAST_Node(childElement);
            if (child) {
                this.currentSkinNode.children.push(child);
            }

        }
        return this.currentSkinNode;
    }

    private walkAST_Node(nodeExmlElement: convert.Element) {
        const type = getClassNameFromEXMLElement(nodeExmlElement)
        if (skinParts.indexOf(type) == -1) {
            skinParts.push(type.toUpperCase());
        }
        const childrenExmlElement = getExmlChildren(nodeExmlElement);
        for (const element of childrenExmlElement) {
            this.walkAST_Node(element)
        }
    }

    private createAST_Node(nodeExmlElement: convert.Element): AST_Node | null {

        if (nodeExmlElement.name === 'w:Config') {
            return null;
        }

        const childrenExmlElement = getExmlChildren(nodeExmlElement);

        const type = getClassNameFromEXMLElement(nodeExmlElement)
        this.varIndex++;
        const node: AST_Node = {
            type,
            children: [],
            attributes: [],
            stateAttributes: [],
            varIndex: this.varIndex,
            id: null
        }


        createAST_Attributes(node, nodeExmlElement, this.currentSkinNode, this.varIndex);

        for (let element of childrenExmlElement) {
            let nodeType: AST_Node_Name_And_Type;
            if (type === 'eui.Scroller' && element.name === 'e:List') {
                nodeType = {
                    namespace: 'e',
                    name: "viewport",
                    type: AST_FullName_Type.ATTRIBUTE
                }
            }
            else {
                nodeType = getNodeType(element.name!);
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
                if (key === 'skinName' || key === 'itemRendererSkinName') {
                    const parser = new EuiParser();
                    const value = parser.createSkinNode(element.elements![0]);
                    const attribute: AST_Attribute = {
                        type: key,
                        key,
                        value
                    }
                    node.attributes.push(attribute)
                }
                else if (key === 'viewport') {
                    const attribute: AST_Attribute = {
                        type: 'object',
                        key: key,
                        value: this.createAST_Node(element)!
                    }
                    node.attributes.push(attribute);
                }
                else if (key === 'layout') {
                    const attribute: AST_Attribute = {
                        type: 'object',
                        key: key,
                        value: this.createAST_Node(element.elements![0])!
                    }
                    node.attributes.push(attribute);

                }
                else if (key === 'props') {
                    for (const obj of element.elements as any) {
                        let value = this.createAST_Node(obj)
                        const attribute: AST_Attribute = {
                            type: 'object',
                            key: key,
                            value: value!
                        }
                        node.attributes.push(attribute);
                    }
                }
                else {
                    throw new Error(`missing ${key}`)
                }


            }
        }
        return node;
    }

}



function formatBinding(value: any, node: any) {

    let jsKeyWords: string[] = ["null", "NaN", "undefined", "true", "false"];
    let HOST_COMPONENT = "hostComponent";


    value = value.substring(1, value.length - 1).trim();
    let templates = [value];
    let chainIndex: number[] = [];
    let length = templates.length;
    for (let i = 0; i < length; i++) {
        let item = templates[i].trim();
        if (!item) {
            templates.splice(i, 1);
            i--;
            length--;
            continue;
        }
        let first = item.charAt(0);
        if (first == "'" || first == "\"" || first >= "0" && first <= "9" || first == "-") {
            continue;
        }
        if (item.indexOf(".") == -1 && jsKeyWords.indexOf(item) != -1) {
            continue;
        }
        if (item.indexOf("this.") == 0) {
            item = item.substring(5);
        }

        let firstKey = item.split(".")[0];

        let flag = true;
        for (const item of skinParts) {
            if (item.indexOf(firstKey.toUpperCase()) > -1) {
                flag = false;
            }
        }
        if (firstKey != HOST_COMPONENT && flag) {
            item = HOST_COMPONENT + "." + item;
        }

        templates[i] = "\"" + item + "\"";
        chainIndex.push(i);

    }
    return {
        templates: templates,
        chainIndex: chainIndex
    }
}






export function generateAST(filecontent: string): AST_Skin {
    return new EuiParser().parseText(filecontent);
}

function getClassNameFromEXMLElement(element: convert.Element) {
    let result = element.name!.replace(/:/g, '.');
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


function getExmlChildren(element: convert.Element) {
    const childrenElements = element.elements;
    if (!childrenElements) {
        return [];
    }
    else {
        return childrenElements.filter(item => {
            return item.type !== 'comment'
        })
    };
}




function getNodeType(name1: string): AST_Node_Name_And_Type {
    const tempArr = name1.split(":");
    const namespace = tempArr[0];
    const name = tempArr[1];
    // 根据名称的首字母是否是大小写来判断是属性还是子节点
    const type = name.charAt(0).toLowerCase() === name.charAt(0)
        ? AST_FullName_Type.ATTRIBUTE
        : AST_FullName_Type.ELEMENT
    return { namespace, name, type };
}

function parseStateAttribute(className: string, originKey: string, value: string): AST_STATE {
    const [key, stateName] = originKey.split(".");
    const type = getTypings(className, key)!;
    const attribute = createAttribute(key, type, value);
    return {
        type: "set",
        attribute,
        name: stateName
    }
}


/**
 * 将NodeElement的 attribute节点转化为Node的Attribute
 * @param nodeElement 
 */
function createAST_Attributes(node: AST_Node, nodeElement: convert.Element, skinNode: AST_Skin, varIndex: number) {
    const attributes: AST_Attribute[] = [];
    const className = getClassNameFromEXMLElement(nodeElement)
    for (let key in nodeElement.attributes) {
        if (key === 'locked') {
            continue;
        }
        let value = nodeElement.attributes[key] as string;
        if (value.indexOf("%") >= 0) {
            if (key === 'width') {
                key = 'percentWidth';
                value = value.replace("%", '')
            }
            else if (key === 'height') {
                key = 'percentHeight';
                value = value.replace("%", '')
            }
        }
        if (key.indexOf(".") >= 0) {
            const stateAttribute = parseStateAttribute(className, key, value);
            node.stateAttributes.push(stateAttribute);
            continue;
        }
        if (key === 'includeIn') {
            const includeStates: AST_STATE_ADD[] = value.split(",").map(sName => {
                return {
                    name: sName,
                    type: 'add'
                }
            })
            node.stateAttributes = node.stateAttributes.concat(includeStates);
            continue;
        }
        if (key === 'id') {
            node.id = value;
            continue;
        }

        if (value.search(/{\w*}/) > -1) {
            const result = formatBinding(value, node)
            const array = result.templates.map(item => {
                item = item.replace(/\"/g, "");
                return item;
            })
            skinNode.bindings.push({
                target: 'a' + varIndex,
                templates: array,
                chainIndex: result.chainIndex,
                property: key,
            })
            continue;
        }
        const type = getTypings(className, key);
        if (!type) {
            continue
        }
        const attribute = createAttribute(key, type, value);
        attributes.push(attribute);
    }
    node.attributes = attributes
}

function createAttribute(key: string, type: string, attributeValue: any): AST_Attribute {

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
            value = parseFloat(attributeValue)
        }
    }

    return {
        type,
        key,
        value
    }
}

