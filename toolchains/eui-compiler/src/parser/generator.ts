import { delimiter } from 'path';
import { AttributeDelimiter, CharacterType, CloseDelimiterMapping, Delimiters, OpenDelimiterMapping } from './type';

export class Generator {

    private tokens: any[] = [];
    private root: {
        declaration: any,
        elements: any[]
    } = {
            declaration: {},
            elements: []
        };
    private delimiterStack: string[] = [];

    constructor(tokens: any[]) {
        this.tokens = tokens;
    }

    public generate() {
        // let isAttribute = false;
        while (this.tokens.length > 0) {
            const token = this.getToken();
            const value = token.value;
            if (token.type === CharacterType.Delimiters) {
                if (OpenDelimiterMapping.hasOwnProperty(value) &&
                    (value !== this.viewTop(this.delimiterStack) &&
                        value + '_' !== this.viewTop(this.delimiterStack))) {
                    this.delimiterStack.push(value);
                    if (value === '<?') {
                        this.root.declaration = this.parseDeclaration();
                    }
                    // else if (['</', '<']) {
                    else if (['<'].includes(value)) {
                        const element = this.parseElement();
                        this.root.elements.push(element);
                    }
                }
                // else if (CloseDelimiterMapping.hasOwnProperty(value) &&
                //     (CloseDelimiterMapping[value] === this.viewTop(this.delimiterStack) ||
                //         CloseDelimiterMapping[value + '_'] === this.viewTop(this.delimiterStack))) {
                //     this.delimiterStack.pop();
                //     if (['>', '/>'].includes(value)) {

                //     }
                // }
            }
            else {
                this.sendError('unexpected toke 1', token);
            }
        }

        return this.root;
    }

    private parseDeclaration() {
        let dec: { attributes: any[] } = { attributes: [] };
        const id = this.getToken();
        if (id.value !== 'xml') {
            this.sendError('unexpected token 2', id);
        }
        dec.attributes = this.parseAttributes();
        const close = this.getToken();
        if (close.value !== '?>') {
            this.sendError('unexpected close delimiter', close);
        }
        this.delimiterStack.pop();
        return dec;
    }

    private parseAttributes() {
        let attribute: { key: any, value: any } = { key: null, value: null };
        let attributes: { key: any, value: any }[] = [];
        let equal = null;
        while (this.viewToken().type !== CharacterType.Delimiters) {
            const token = this.getToken();
            const type = token.type;
            const value = token.value;
            const startColumn = token.startColumn;
            const startLine = token.startLine;
            const endColumn = token.endColumn;
            const endLine = token.endLine;
            if (type === CharacterType.Identifier) {
                if (!attribute.key) {
                    attribute.key = {
                        startColumn,
                        startLine,
                        endColumn,
                        endLine,
                        value
                    }
                }
            }
            else if (type === CharacterType.Word) {
                if (!attribute.key) {
                    this.sendError('attribute value needs a key', token);
                }
                else {
                    if (equal) {
                        attribute.value = {
                            startColumn,
                            startLine,
                            endColumn,
                            endLine,
                            value
                        }
                        attributes.push(attribute);
                        attribute = { key: null, value: null };
                        equal = null;
                    }
                    else {
                        this.sendError('attribute needs `=` between key and value', token);
                    }
                }
            }
            else if (type === CharacterType.Equal) {
                if (!attribute.key) {
                    this.sendError('unexpected token 3', token);
                }
                else {
                    equal = token;
                }
            }
            else {
                this.sendError('unexpected token 4', token);
            }
        }
        return attributes;
    }

    private parseElement() {
        let element: {
            name: any,
            elements: any[],
            attributes: { key: any, value: any }[]
        } = {
            name: {},
            elements: [],
            attributes: []
        };
        const name = this.getToken();
        if (name.type !== CharacterType.Identifier) {
            this.sendError('unexpected token 5', name);
        }
        element.name = {
            value: name.value,
            startLine: name.startLine,
            startColumn: name.startColumn,
            endLine: name.endLine,
            endColumn: name.endColumn
        };
        element.attributes = this.parseAttributes();
        const close = this.getToken(); // closeDelimiter
        if (close.type === CharacterType.Delimiters && close.value === '/>') {
            // <  />  without children
            this.delimiterStack.pop();
            return element;
        }

        let start = this.getToken();
        if (start.type !== CharacterType.Delimiters) {
            this.sendError('unexpected token 6', start);
        }
        // children
        else if (start.value === '<') {
            while (start.value === '<') {
                this.delimiterStack.push(start.value);
                const child = this.parseElement();
                element.elements.push(child);
                start = this.getToken();
                if (start.type !== CharacterType.Delimiters) {
                    this.sendError('unexpected token 8', start);
                }
            }
        }

        // </ > end
        if (start.value === '</') {
            const tag = this.getToken();
            if (tag.type !== CharacterType.Identifier) {
                this.sendError('unexpected token 7', name);
            }
            if (tag.value !== name.value) {
                this.sendError('unexpected close tag', tag);
            }
            const next = this.getToken();
            if (next.type !== CharacterType.Delimiters) {
                this.sendError('unexpected token 8', name);
            }
        }
        return element;
    }

    private getToken() {
        return this.tokens.shift();
    }

    private viewToken() {
        return this.tokens[0];
    }

    private viewTop(arr: any[]) {
        return arr[arr.length - 1];
    }

    private sendError(message: string, token: any) {
        console.log(token)
        throw (message)
    }
}