import * as Ajv from 'ajv';
import * as fs from 'fs';
import * as path from 'path';
import { ThemeFile } from './theme';

let localize = require('ajv-i18n/localize/zh');


let projectRoot = '';
let egretProperties: EgretProperties



const schema = {
    "type": "object",
    "required": ["eui"],
    "properties": {
        "eui": {
            "required": ["themes"],
            "type": "object",
            "properties": {
                "themes": {
                    "type": "array", items: {
                        "type": "string"
                    }
                },
            }
        }
    }
}


class EgretPropertiesError extends Error {

    constructor(filepath, message) {
        super(filepath + " " + message);
    }
}


type EgretProperties = {
    eui: {
        // exmlRoot: string[],
        themes: string[]
    }
}


export function initilize(root: string) {


    projectRoot = root;
    parseEgretProperties();
}

function getJson(filepath) {
    if (!fs.existsSync(filepath)) {
        throw new EgretPropertiesError(filepath, '找不到该文件');
    }
    const content = fs.readFileSync(filepath, 'utf-8');
    try {
        return JSON.parse(content)
    }
    catch (e) {
        throw new EgretPropertiesError(filepath, '不是有效的JSON文件')
    }
}

function parseEgretProperties() {
    const ajv = new Ajv();
    const validate = ajv.compile(schema);
    const filePath = path.join(projectRoot, 'egretProperties.json');
    egretProperties = getJson(filePath);
    if (!egretProperties.eui) {
        egretProperties.eui = {
            themes: [
                "resource/default.thm.json"
            ]
        }
    }
    const valid = validate(egretProperties);

    if (!valid) {
        localize(validate.errors);
        const message = ajv.errorsText(validate.errors, { separator: '\n' });
        throw new EgretPropertiesError(filePath, message);
    }
    return;

}

export function getThemes() {
    const themes = egretProperties.eui.themes;
    return themes.map(t => {
        const themeFile = new ThemeFile(projectRoot, t);
        return themeFile;
    })
}

export function getFilePathRelativeProjectRoot(p: string) {
    return path.join(projectRoot, p).split("\\").join("/")
}


export function getEgretProperties() {
    return egretProperties;
}