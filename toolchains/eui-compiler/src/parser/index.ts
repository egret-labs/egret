import { Lexer } from './lexer';
import { Generator } from './generator';

export function xml2js(filecontent: string, printer: Function) {
    const lexer = new Lexer(filecontent, printer);
    const tokens = lexer.analysis();
    const generator = new Generator(tokens, printer);
    const tree = generator.generate();
    return tree;
}