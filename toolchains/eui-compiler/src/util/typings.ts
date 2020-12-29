import * as fs from 'fs';
import * as path from 'path';
import { Token } from '../parser/ast-type';

type PropertyTypings = {
    [className: string]: {
        [propertyKey: string]: string
    }
}

let property: PropertyTypings;

let errorPrint: Function = () => { };

export function setErrorPrint(func: Function) {
    errorPrint = func;
}

export function getTypings(className: string, propertyKey: string, token: Token) {

    if (propertyKey === 'id') {
        return 'id';
    }
    let typings = property[className];
    let type: string;
    let isCustomComponent = false;
    if (!typings) {
        typings = property['eui.Component'];
        isCustomComponent = true;
        // console.error('missing classname on typings:', className)
        // process.exit(1);
    }
    type = typings[propertyKey];

    while (!type && typings.super) {
        typings = property[typings.super];
        type = typings[propertyKey];
    }
    if (!type) {
        if (isCustomComponent) {
            type = 'any';
        }
        else {
            // console.error(`${className}中不包含${propertyKey}属性`);
            errorPrint(`attribute key \`${propertyKey}\` not found in \`${className}\``, token);
            return null;
        }
    }
    return type;
}

export let EgretElements: string[] = [];

export function initTypings() {
    const filename = path.resolve(__dirname, '../../', 'property.json');
    const content = fs.readFileSync(filename, 'utf-8');
    property = JSON.parse(content);
    for (const className in property) {
        EgretElements.push(className);
        const typings = property[className];
        if (typings.super) {

        }
    }
}
