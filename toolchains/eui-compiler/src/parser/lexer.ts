import { CharacterType, DelimiterMapping, space, Delimiters, Equal, Quotation } from './type';


export class Lexer {

    private rawText: string[] = [];
    private line = 1;
    private column = 0;
    private delimiterStack: any[] = [];
    private tokens: any[] = [];

    constructor(content: string) {
        this.rawText = content.split('');
    }

    public analysis(): any[] {
        let isString = false;
        let stringBuffer: any = null; // 存字符串的第一位
        let identifierBuffer: any = null;
        while (this.rawText.length > 0) {
            const char = this.getChar(1);
            const value = char.text;
            const value1 = value + this.viewChar(1).text;
            const value2 = value + this.viewChar(2).text;
            const value3 = value + this.viewChar(3).text;
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
                while (this.viewChar(3).text !== '-->') {
                    this.getChar(1);
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
                    char.text += this.getChar(length).text;
                }
                if (identifierBuffer) {
                    this.createToken(CharacterType.Identifier, identifierBuffer);
                    identifierBuffer = null;
                }
                // 闭界符
                if ((DelimiterMapping[text] && !Quotation.includes(text)) || (
                    Quotation.includes(text) && isString
                )) {
                    const lastDelimiter = this.viewTop(this.delimiterStack);
                    if (lastDelimiter &&
                        (DelimiterMapping[text] === lastDelimiter.text || DelimiterMapping[text + '_'] === lastDelimiter.text)) {
                        this.delimiterStack.pop();
                        if (Quotation.includes(lastDelimiter.text)) {
                            isString = false;
                            this.createToken(CharacterType.Word, stringBuffer);
                            stringBuffer = null;
                        }
                    }
                    else {
                        this.sendError(char, 'unexpected close delimiter');
                    }
                }
                // 开界符
                else {
                    char.text = text;
                    this.delimiterStack.push(char);
                    if (Quotation.includes(text)) {
                        isString = true;
                    }
                }
                this.createToken(CharacterType.Delimiters, char);
                continue;
            }
            // 存入字符
            else if (isString) {
                if (!stringBuffer) {
                    stringBuffer = char;
                }
                else {
                    stringBuffer.text += value;
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
                if(value === '\t') continue;
                if (!identifierBuffer) {
                    identifierBuffer = char;
                }
                else {
                    identifierBuffer.text += value;
                }
                continue;
            }


            this.sendError(char, 'unexpected char');
        }
        if (this.delimiterStack.length !== 0) {
            this.sendError(this.delimiterStack.pop(), 'expect close delimiter');
        }

        return this.tokens;
    }

    private getChar(length: number) {
        const line = this.line;
        const column = this.column + 1;

        let text = '';
        if (length > this.rawText.length) {
            text = this.rawText.join('');
            this.rawText = [];
        }
        else {
            for (let i = 0; i < length; i++) {
                const char = this.rawText.shift();
                text += char;
                this.column++;
                if (char == '\n') {
                    this.line++;
                    this.column = 0;
                }
            }
        }

        return { text, line, column };
    }

    private viewChar(length: number) {
        const line = this.line;
        const column = this.column;

        let text = '';
        if (length > this.rawText.length) {
            text = this.rawText.join('');
        }
        else {
            for (let i = 0; i < length; i++) {
                text += this.rawText[i];
            }
        }

        return { text, line, column };
    }

    private viewTop(arr: any[]) {
        return arr[arr.length - 1];
    }

    private createToken(type: number, char: any) {
        const node = {
            type,
            line: char.line,
            column: char.column,
            value: char.text
        }
        this.tokens.push(node);
    }

    private sendError(char: any, message: string) {
        console.log(char);
        throw (message);
    }
}
