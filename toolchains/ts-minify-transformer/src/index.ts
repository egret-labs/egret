import * as ts from 'typescript';

import { PropertiesMinifier, PropertyMinifierOptions } from './properties-minifier';

// tslint:disable-next-line:no-default-export
export function minifyTransformer(program: ts.Program, config?: Partial<PropertyMinifierOptions>): ts.TransformerFactory<ts.SourceFile> {
    const minifier = new PropertiesMinifier(config);
    return (context: ts.TransformationContext) => (file: ts.SourceFile) => minifier.visitSourceFile(file, program, context);
}

export { emitClassName } from './emitClassName';
export { emitDefine } from './emitDefine';