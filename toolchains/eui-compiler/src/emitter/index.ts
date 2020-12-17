import { AST_Skin } from '../exml-ast';

export abstract class BaseEmitter {

    abstract getResult(): string

    abstract emitHeader(themeData: any): void

    abstract emitSkinNode(filename: string, skinNode: AST_Skin): void

}

export * from './javascript-emitter';
export * from './declaration-emitter';
export * from './json-emitter';