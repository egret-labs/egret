import { CharacterType, CloseDelimiterMapping, space, Delimiters, Equal, Quotation } from './type';
import { Token } from './ast-type';

export class Lexer {

    private rawText: string[] = [];
    private line = 1;
    private column = 0;
    private delimiterStack: Token[] = [];
    private tokens: Token[] = [];
    private printer: Function = () => { };
    private hasChar = false;

    constructor(content: string, printer: Function) {
        this.rawText = content.split('');
        this.printer = printer;
    }

    public analysis(): Token[] {
        let isString = false;
        let stringBuffer: Token | null = null; // 存字符串的第一位
        let identifierBuffer: Token | null = null;
        while (this.rawText.length > 0) {
            const char = this.getChar(1);
            const value = char.value;
            const value1 = value + this.viewChar(1).value;
            const value2 = value + this.viewChar(2).value;
            const value3 = value + this.viewChar(3).value;
            // 跳过空白符
            if (!isString && space.includes(value)) {
                if (identifierBuffer) {
                    this.createToken(CharacterType.Identifier, identifierBuffer);
                    identifierBuffer = null;
                }
                continue;
            }
            // 跳过注释
            else if (!isString && value3 === '<!--') {
                while (this.viewChar(3).value !== '-->' && this.rawText.length > 0) {
                    this.getChar(1);
                }
                if (this.viewChar(3).value !== '-->') {
                    this.sendError(char, 'malformed comment');
                }
                this.getChar(3);
                continue;
            }
            // 处理界符
            else if (Delimiters.includes(value) ||
                Delimiters.includes(value1) ||
                Delimiters.includes(value2)) {
                let text = '';
                let length = -1;
                if (Delimiters.includes(value2)) {
                    text = value2;
                    length = 2;
                }
                else if (Delimiters.includes(value1)) {
                    text = value1;
                    length = 1;
                }
                else {
                    text = value;
                    length = 0;
                }
                if (length > 0) {
                    const nextChar = this.getChar(length);
                    char.value += nextChar.value;
                    char.endColumn = nextChar.endColumn;
                    char.endLine = nextChar.endLine;
                }
                if (identifierBuffer) {
                    this.createToken(CharacterType.Identifier, identifierBuffer);
                    identifierBuffer = null;
                }
                // 闭界符
                if ((CloseDelimiterMapping[text] && !Quotation.includes(text)) || (
                    Quotation.includes(text) && isString
                )) {
                    const lastDelimiter = this.viewTop(this.delimiterStack);
                    if (lastDelimiter &&
                        (CloseDelimiterMapping[text] === lastDelimiter.value || CloseDelimiterMapping[text + '_'] === lastDelimiter.value)) {
                        this.delimiterStack.pop();
                        if (Quotation.includes(lastDelimiter.value)) {
                            isString = false;
                            this.createToken(CharacterType.Word, stringBuffer!);
                            stringBuffer = null;
                        }
                    }
                    else {
                        this.sendError(char, 'unexpected close delimiter');
                    }
                }
                // 开界符
                else {
                    char.value = text;
                    this.delimiterStack.push(char);
                    if (Quotation.includes(text)) {
                        isString = true;
                    }
                }
                if (!Quotation.includes(text))
                    this.createToken(CharacterType.Delimiters, char);
                continue;
            }
            // 存入字符
            else if (isString) {
                if (!stringBuffer) {
                    stringBuffer = char;
                }
                else {
                    stringBuffer.value += value;
                    stringBuffer.endLine = char.endLine;
                    stringBuffer.endColumn = char.endColumn;
                }
                continue;
            }
            // = 
            else if (value === Equal) {
                if (identifierBuffer) {
                    this.createToken(CharacterType.Identifier, identifierBuffer);
                    identifierBuffer = null;
                }
                this.createToken(CharacterType.Equal, char);
                continue;
            }
            // identifier
            else {
                if (value === '\t') continue;
                if (this.delimiterStack.length == 0)
                    this.sendError(char, 'text data outside of root node');
                if (!identifierBuffer) {
                    identifierBuffer = char;
                }
                else {
                    identifierBuffer.value += value;
                    identifierBuffer.endLine = char.endLine;
                    identifierBuffer.endColumn = char.endColumn;
                }
                continue;
            }

            this.sendError(char, 'unexpected char');
        }
        if (this.delimiterStack.length !== 0) {
            for (const child of this.delimiterStack) {
                this.sendError(child, 'tag not closed propertly');
            }
        }
        if (identifierBuffer)
            this.createToken(CharacterType.Identifier, identifierBuffer);
        return this.tokens;
    }

    private getChar(length: number) {
        const startLine = this.line;
        const startColumn = this.column + 1;
        let endLine = -1;
        let endColumn = -1;

        let value = '';
        if (length > this.rawText.length) {
            length = this.rawText.length;
        }
        for (let i = 0; i < length; i++) {
            const char = this.rawText.shift();
            value += char;
            if (char === '\t' && this.hasChar) {
                this.column += 8 - this.column % 8;
            }
            else if (char === '\t') {
                this.column += 8;
            }
            else {
                this.column++;
                this.hasChar = true;
            }
            endColumn = this.column + 1;
            endLine = this.line;
            if (char === '\n') {
                this.line++;
                this.column = 0;
                this.hasChar = false;
            }
        }
        return { value, startLine, startColumn, endLine, endColumn };
    }

    private viewChar(length: number) {
        const line = this.line;
        const column = this.column;
        // let endLine = -1;
        // let endColumn = -1;

        let value = '';
        if (length > this.rawText.length) {
            value = this.rawText.join('');
        }
        else {
            for (let i = 0; i < length; i++) {
                value += this.rawText[i];
            }
        }

        return { value, line, column };
    }

    private viewTop(arr: Token[]) {
        return arr[arr.length - 1];
    }

    private createToken(type: number, char: Token) {
        const node = {
            type,
            startLine: char.startLine,
            startColumn: char.startColumn,
            endLine: char.endLine,
            endColumn: char.endColumn,
            value: char.value
        };
        this.tokens.push(node);
    }

    private sendError(char: Token, message: string) {
        // console.log(char);
        // throw (message);
        this.printer(message, char);
    }
}
