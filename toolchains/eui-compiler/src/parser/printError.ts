import { AST_Skin, Error } from "../exml-ast";
import { EuiParser } from "../util/parser";
import { Token } from "./ast-type";

export class ErrorPrinter {

    static shouldPrint = true;
    static func = (mes: string, startColumn: number, startLine: number, endColumn: number, endLine: number) => { };

    private filePath = '';
    private fileText = '';
    private fileTextArr: string[] = [];

    // public errors: Error[] = [];
    private parser: EuiParser;

    constructor(fileText: string, filePath: string, parser: EuiParser) {
        this.filePath = filePath;
        this.fileText = fileText;
        this.fileTextArr = this.fileText.split('\n');
        this.parser = parser;
    }

    printError(_message: string, token: Token): void {
        const startColumn = token.startColumn;
        const startLine = token.startLine;
        const endColumn = token.endColumn;
        const endLine = token.endLine;

        const arr: string[] = [];
        arr[0] = `Error: ${_message}`;
        arr[1] = this.fileTextArr[startLine - 1];
        arr[2] = '';
        for (let i = 0; i < startColumn - 1; i++) {
            arr[2] += ' ';
        }
        arr[2] += '^';
        arr[3] = `at line: ${startLine}, column: ${startColumn}`;
        arr[4] = `at file: ${this.filePath}`;
        arr[5] = '\n';
        const message = arr.join('\n');

        if (ErrorPrinter.shouldPrint) {
            throw (message);
        }
        else {
            const err = { message, startColumn, startLine, endColumn, endLine };
            this.parser.errors.push(err);
            // ErrorPrinter.func(mes, startColumn, startLine, endColumn, endLine);
            // throw ('ErrorPrinter.shouldPrint = false');
        }
    }


}
