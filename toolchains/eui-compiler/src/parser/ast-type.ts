export interface RootExmlElement {

    declaration: {
        attributes: Attribute[]
    };

    elements: Element[];
}

export interface Token {
    startColumn: number;
    startLine: number;
    endColumn: number;
    endLine: number;
    value: string;
    type?: number
}

export interface Element {
    name: Token | null;
    elements: Element[];
    attributes: Attribute[];
}

export interface Attribute {
    key: Token | null;
    value: Token | null;
}

export type Mapping = {
    [key: string]: Token
}
