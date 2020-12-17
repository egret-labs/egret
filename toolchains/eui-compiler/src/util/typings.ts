import * as fs from 'fs';
import * as path from 'path';


type PropertyTypings = {
    [className: string]: {
        [propertyKey: string]: string
    }
}


let property: PropertyTypings;

export function getTypings(className: string, propertyKey: string) {

    if (propertyKey === 'id') {
        return "id";
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
            console.error(`${className}中不包含${propertyKey}属性`);
            return null;
        }
    }
    return type;
}

export function initTypings() {
    const filename = path.resolve(__dirname, "../../", "property.json")
    const content = fs.readFileSync(filename, 'utf-8');
    property = JSON.parse(content);
    for (let className in property) {
        const typings = property[className];
        if (typings.super) {

        }
    }
}