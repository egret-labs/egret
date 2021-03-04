import * as freeTexPackerCore from 'free-tex-packer-core';
import fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
const options1: freeTexPackerCore.TexturePackerOptions = {
    textureName: 'my-texture',
    width: 1024,
    height: 1024,
    fixedSize: false,
    padding: 2,
    allowRotation: true,
    detectIdentical: true,
    allowTrim: true,
    exporter: 'JsonArray' as freeTexPackerCore.PackerExporterType.JSON_HASH,
    //  {
    //     fileExt: 'json',
    //     template: path.resolve(__dirname, '../template.mst')
    // },
    removeFileExtension: false,
    prependFolderName: true
};

export type TexturePackerOptions = {
    files: string[],
    root: string,
    outputName: string
}

type EmitTypings = {
    frames: {
        filename: string,
        frame: { x: number, y: number, w: number, h: number },
        rotated: boolean,
        trimmed: boolean,
        spriteSourceSize: { x: number, y: number, w: number, h: number },
        sourceSize: any,
        pivot: any
    }[],
    meta: {
        app: string,
        version: string,
        image: string,
        format: string,
        size: {
            w: number, h: number
        },
        scale: number
    }
}

type OutputTypings = {

    file: string,
    frames: {
        [name: string]: {
            x: number, y: number, w: number, h: number, offX: number, offY: number, sourceW: number, sourceH: number
        }
    }
}

function convert(from: EmitTypings, file: string): OutputTypings {
    const result: OutputTypings = {
        file,
        frames: {}
    };
    for (const item of from.frames) {
        const { frame, spriteSourceSize } = item;
        const name = path.basename(item.filename).split(".").join("_");
        result.frames[name] = {
            x: frame.x,
            y: frame.y,
            w: frame.w,
            h: frame.h,
            offX: spriteSourceSize.x,
            offY: spriteSourceSize.y,
            sourceW: spriteSourceSize.w,
            sourceH: spriteSourceSize.h
        };
    }
    return result;
}

type Output = { config: OutputTypings, buffer: Buffer }

export function parseConfig(type: 'json' | 'yaml', content: string): TexturePackerOptions {
    if (type === 'json') {
        return JSON.parse(content);
    }
    else {
        try {
            const doc = yaml.load(content);
            return doc as TexturePackerOptions;
        } catch (e) {
            throw e;
        }
    }
}

export function executeMerge(images: { path: string, contents: Buffer }[], options: TexturePackerOptions) {

    return new Promise<Output>((resolve, reject) => {
        freeTexPackerCore.default(images, options1, (files, error) => {
            if (error) {
                console.error('Packaging failed', error);
            } else {
                const output: Partial<Output> = {};

                for (const item of files) {
                    if (path.extname(item.name) === '.json') {
                        const json = JSON.parse(item.buffer.toString());
                        output.config = convert(json, options.outputName + '.png');
                    }
                    else {
                        output.buffer = item.buffer;
                    }
                }
                resolve(output as Output);
            }
        });
    });
}