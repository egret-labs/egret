import * as freeTexPackerCore from 'free-tex-packer-core';
import fs from 'fs';
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
    removeFileExtension: true,
    prependFolderName: true
};

export type TexturePackerOptions = {
    files: string[],
    root: string
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
        result.frames[item.filename] = {
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

export function merger(options: TexturePackerOptions) {
    const images: any[] = [];
    images.push({ path: 'img1.png', contents: fs.readFileSync('./tests/1.png') });
    images.push({ path: 'img2.png', contents: fs.readFileSync('./tests/2.png') });
    images.push({ path: 'img3.png', contents: fs.readFileSync('./tests/3.png') });

    return new Promise<Output>((resolve, reject) => {
        freeTexPackerCore.default(images, options1, (files, error) => {
            if (error) {
                console.error('Packaging failed', error);
            } else {
                const output: Partial<Output> = {};

                for (const item of files) {
                    if (path.extname(item.name) === '.json') {
                        const json = JSON.parse(item.buffer.toString());
                        output.config = convert(json, 'x.png');
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

merger({ files: [], root: '' }).then((v) => {
});