import { BaseEmitter } from ".";
import { AST_Node, AST_NodeBase, AST_Skin } from "../exml-ast";


type OutputDataFormat_State = {
    $ssP?: { target: string, name: string, value: any }[],
    $saI?: { target: string, property: string, position: number, relativeTo: string }[]
}


type OutputDataFormat = {

    $path: string

    $sP?: string[]

    $sC: "$eSk"

    $s?: {
        [stateName: string]: OutputDataFormat_State
    }
}

export class JSONEmitter extends BaseEmitter {
    private jsonContent: string = '';
    private addBingdingJson: {
        $b: object[]
    } = { $b: [] };

    private euiNormalizeNames = {
        "$eBL": "eui.BitmapLabel",
        "$eB": "eui.Button",
        "$eCB": "eui.CheckBox",
        "$eC": "eui.Component",
        "$eDG": "eui.DataGroup",
        "$eET": "eui.EditableText",
        "$eG": "eui.Group",
        "$eHL": "eui.HorizontalLayout",
        "$eHSB": "eui.HScrollBar",
        "$eHS": "eui.HSlider",
        "$eI": "eui.Image",
        "$eL": "eui.Label",
        "$eLs": "eui.List",
        "$eP": "eui.Panel",
        "$ePB": "eui.ProgressBar",
        "$eRB": "eui.RadioButton",
        "$eRBG": "eui.RadioButtonGroup",
        "$eRa": "eui.Range",
        "$eR": "eui.Rect",
        "$eRAl": "eui.RowAlign",
        "$eS": "eui.Scroller",
        "$eT": "eui.TabBar",
        "$eTI": "eui.TextInput",
        "$eTL": "eui.TileLayout",
        "$eTB": "eui.ToggleButton",
        "$eTS": "eui.ToggleSwitch",
        "$eVL": "eui.VerticalLayout",
        "$eV": "eui.ViewStack",
        "$eVSB": "eui.VScrollBar",
        "$eVS": "eui.VSlider",
        "$eSk": "eui.Skin"
    };

    private elementContents: any = {};
    private elementIds: string[] = [];
    private skinParts: string[] = [];
    private nodeMap: { [id: string]: AST_NodeBase } = {};

    private otherNodeMap: any[] = [];

    getResult(): string {
        return this.jsonContent;
    }
    emitHeader(themeData: any): void {
    }
    emitSkinNode(filename: string, skinNode: AST_Skin): void {
        let json = {};
        this.elementContents = {};
        this.elementIds = [];
        this.skinParts = [];
        this.nodeMap = {};
        const key = skinNode.fullname;
        const item: OutputDataFormat = {
            $sC: "$eSk",
            $path: filename
        };
        json[key] = item;
        this.nodeMap[key] = skinNode;

        if (this.otherNodeMap.length == 0) {
            for (const key of Object.keys(this.nodeMap)) {
                this.catchClass(this.nodeMap[key]);
            }

        }

        this.setBaseState(skinNode, item, undefined, skinNode);

        Object.assign(item, this.elementContents);

        if (this.skinParts.length > 0) {
            item.$sP = this.skinParts;
        }

        this.setStates(skinNode, item);

        if (this.otherNodeMap.length > 0) {
            for (const child of this.otherNodeMap) {
                const result = this.createSkinName(child)
                const key = Object.keys(result)[0];
                delete result[key].$path;
                delete result[key].$s;
                Object.assign(json, result);
            }
        }

        if (this.addBingdingJson.$b.length > 0) {
            json[skinNode.fullname] = Object.assign(json[skinNode.fullname], this.addBingdingJson)
        }
        this.jsonContent = JSON.stringify(json, null, 4);

    }


    setBaseState(node: AST_NodeBase, json: any, key: string = '$bs', skinNode: AST_NodeBase) {
        const base = {};
        if (key.indexOf('w.') < 0) {
            json[key] = base;
            for (const attr of node.attributes) {
                base[attr.key] = this.parseValue(attr.value, skinNode);
            }
            if (node["type"]) {
                base['$t'] = this.convertType(node["type"]);
            }
            for (let binding of (skinNode as AST_Skin).bindings) {
                if (node['type']) {
                    // const type = node['type'].replace("eui.", "_");
                    // const keyWord = key.replace(type, "a");
                    //if (keyWord === binding.target) {
                    if ((node as any).varIndex == binding.target.replace('a', '')) {
                        const array = binding.templates.map(item => {
                            const result = Number(item);
                            if (isNaN(result)) {
                                return item;
                            }
                            else {
                                return result;
                            }
                        })
                        if (binding.templates.length == 1 && binding.chainIndex.length == 1) {
                            this.addBingdingJson.$b.push({
                                "$bd": array,
                                "$bt": key,
                                "$bp": binding.property
                            });
                        }
                        else {
                            this.addBingdingJson.$b.push({
                                "$bd": array,
                                "$bt": key,
                                "$bp": binding.property,
                                "$bc": binding.chainIndex
                            });
                        }
                        json[key][binding.property] = "";
                    }
                }
            }
        }

        const elementContents: string[] = [];
        const sIds: string[] = [];


        for (const child of node.children) {
            const id = this.parseNode(child);
            if (id.indexOf('w.') < 0) {
                this.hasAddType(child) ? sIds.push(id) : elementContents.push(id);

            }
            this.setBaseState(child, this.elementContents, id, skinNode);
        }

        const type = (node as any).type;
        let prop = '$eleC';
        if (type) {
            if (type.indexOf('TweenGroup') > -1) {
                prop = 'items';
            }
            else if (type.indexOf('TweenItem') > -1) {
                prop = 'paths';
            }
        }
        elementContents.length > 0 && (base[prop] = elementContents);
        sIds.length > 0 && (base['$sId'] = sIds);
    }

    setStates(skinNode: AST_Skin, json: OutputDataFormat) {
        if (skinNode.states.length === 0) {
            return;
        }
        json.$s = {};
        for (const state of skinNode.states) {
            json.$s[state] = {};
        }
        this.getStatesAttribute(skinNode, json.$s);
    }

    getStatesAttribute(node: AST_NodeBase, json: NonNullable<OutputDataFormat['$s']>) {
        const target = this.getNodeId(node)!;
        for (const attr of node.stateAttributes) {
            switch (attr.type) {
                case 'set': {
                    if (attr.name in json) {
                        if (!json[attr.name].$ssP) {
                            json[attr.name].$ssP = [];
                        }
                        json[attr.name].$ssP!.push({
                            target,
                            name: attr.attribute.key,
                            value: attr.attribute.value
                        });
                    }
                } break;
                case 'add': {
                    if (attr.name in json) {
                        if (!json[attr.name].$saI) {
                            json[attr.name].$saI = [];
                        }
                        json[attr.name].$saI!.push({
                            target,
                            property: "",
                            position: 1,
                            relativeTo: ""
                        });
                    }
                } break;
            }
        }
        for (const child of node.children) {
            this.getStatesAttribute(child, json);
        }
    }

    hasAddType(node: AST_NodeBase) {
        for (const attr of node.stateAttributes) {
            if (attr.type === 'add') {
                return true;
            }
        }
        return false;
    }

    getNodeId(node: AST_NodeBase) {
        const nodeMap = this.nodeMap;
        for (const id in nodeMap) {
            if (nodeMap[id] === node) {
                return id;
            }
        }
        return null;
    }

    parseNode(node: AST_Node) {
        let id = node.id;
        if (id) {
            this.skinParts.push(id);
        }
        else {
            let i = 1;
            let type = node.type;
            if (node.type.indexOf('w.') < 0) {
                type = node.type.split('.').pop()!;
            }
            do {
                id = `_${type}${i++}`;
            } while (this.elementIds.indexOf(id) !== -1);
        }
        this.elementIds.push(id);
        this.nodeMap[id] = node;
        return id;
    }

    parseValue(value: string | number | boolean | AST_Node | AST_Skin, skinNode: AST_NodeBase) {
        if (!value["attributes"] && !value["children"]) {
            return value;
        }
        if (value["type"]) {
            const id = this.parseNode(value as AST_Node);
            this.setBaseState(value as AST_Node, this.elementContents, id, skinNode);
            return id;
        }
        return value;
    }

    convertType(type: string) {
        for (const key in this.euiNormalizeNames) {
            if (this.euiNormalizeNames[key] === type) {
                return key;
            }
        }
        if (type.indexOf("Object") >= 0) {
            return "Object"
        }
        else if (type.indexOf("tween") >= 0) {
            return "egret." + type.replace(":", ".");
        }
        else {
            return "$eSk";
        }
    }

    catchClass(nodeMap: any) {
        if (nodeMap.attributes) {
            for (let child of nodeMap.attributes) {
                if (child.type == 'skinName') {
                    this.otherNodeMap.push(child);
                    const value = child.value.fullname;
                    nodeMap.attributes = [
                        {
                            'type': 'skinName',
                            'key': 'skinName',
                            'value': value,
                            'attributes': []
                        }
                    ];
                    break;
                }
            }
        }
        if (nodeMap.children) {
            for (let child of nodeMap.children) {
                this.catchClass(child)
            }
        }
    }

    createSkinName(child: any) {
        const emitter = new JSONEmitter();
        emitter.emitSkinNode('', child.value);
        const result = emitter.getResult();
        return JSON.parse(result);
    }

}

