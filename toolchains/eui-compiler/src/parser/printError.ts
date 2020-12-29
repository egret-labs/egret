import { Token } from "./ast-type";

export class ErrorPrinter {

    static shouldPrint = true;
    static func = (mes: string, startColumn: number, startLine: number, endColumn: number, endLine: number) => { };

    private filePath = '';
    private fileText = '';
    private fileTextArr: string[] = [];

    constructor(fileText: string, filePath: string) {
        this.filePath = filePath;
        this.fileText = fileText;
        this.fileTextArr = this.fileText.split('\n');
    }

    printError(message: string, token: Token): void {
        const startColumn = token.startColumn;
        const startLine = token.startLine;
        const endColumn = token.endColumn;
        const endLine = token.endLine;

        const arr: string[] = [];
        arr[0] = `Error: ${message}`;
        arr[1] = this.fileTextArr[startLine - 1];
        arr[2] = '';
        for (let i = 0; i < startColumn - 1; i++) {
            arr[2] += ' ';
        }
        arr[2] += '^';
        arr[3] = `at line: ${startLine}, column: ${startColumn}`;
        arr[4] = `at file: ${this.filePath}`;
        arr[5] = '\n';
        const mes = arr.join('\n');

        if (ErrorPrinter.shouldPrint) {
            throw (mes);
        }
        else {
            ErrorPrinter.func(mes, startColumn, startLine, endColumn, endLine);
            // throw ('ErrorPrinter.shouldPrint = false');
        }
    }

    _printError(message: string): void {
        const info = this.splitMessage(message);
        const arr: string[] = [];
        arr[0] = info.message;
        arr[1] = this.fileTextArr[info.line - 1];
        arr[2] = '';
        for (let i = 0; i < info.column - 1; i++) {
            arr[2] += ' ';
        }
        arr[2] += '^';
        arr[3] = `at line: ${info.line}, column: ${info.column}`;
        arr[4] = `at file: ${this.filePath}`;
        console.error(arr.join('\n'));
    }

    private splitMessage(message: string) {
        const arr = message.split('\n');
        const result: any = {};
        for (const item of arr) {
            if (item.indexOf('Char') > -1) {
                continue;
            }
            else if (item.indexOf('Line') > -1) {
                result.line = item.split(':')[1].trim();
            }
            else if (item.indexOf('Column') > -1) {
                result.column = item.split(':')[1].trim();
            }
            else {
                result.message = item;
            }
        }
        return result;
    }
}
