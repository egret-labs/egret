export enum CharacterType {
    Delimiters, // 界符 0
    Identifier, // 标识符 1
    Word, // 字符 2
    Equal, // = 3
};

export const DelimiterMapping = {
    '>': '<',
    '>_': '</',
    '/>': '<',
    '?>': '<?',
    '-->': '<!',
    '"': '"',
    '\'': '\''
};

export const space = [
    ' ',
    '\r',
    '\n'
];

export const Delimiters = [
    '<',
    '<?',
    '</',
    '<!',
    '>',
    '/>',
    '?>',
    '-->',
    '"',
    '\''
];

export const Equal = '=';

export const Quotation = ['"', "'"];