export class ErrorPrinter {

    private filePath = "";
    private fileText = "";
    private fileTextArr: string[] = [];

    constructor(fileText: string, filePath: string) {
        this.filePath = filePath;
        this.fileText = fileText;
        this.fileTextArr = this.fileText.split('\n');
    }

    printError(message: string, column: number, line: number): void {
        let arr: string[] = [];
        arr[0] = message;
        arr[1] = this.fileTextArr[line - 1];
        arr[2] = '';
        for (let i = 0; i < column - 1; i++) {
            arr[2] += " ";
        }
        arr[2] += '^';
        arr[3] = `at line: ${line}, column: ${column}`;
        arr[4] = `at file: ${this.filePath}`;
        arr[5] = '\n';
        throw(arr.join('\n'));
    }

    _printError(message: string): void {
        const info = this.splitMessage(message);
        let arr: string[] = [];
        arr[0] = info.message;
        arr[1] = this.fileTextArr[info.line - 1];
        arr[2] = '';
        for (let i = 0; i < info.column - 1; i++) {
            arr[2] += " ";
        }
        arr[2] += '^';
        arr[3] = `at line: ${info.line}, column: ${info.column}`;
        arr[4] = `at file: ${this.filePath}`;
        console.error(arr.join('\n'));
    }

    private splitMessage(message: string) {
        const arr = message.split('\n');
        let result: any = {};
        for (const item of arr) {
            if (item.indexOf('Char') > -1) {
                continue;
            }
            else if (item.indexOf('Line') > -1) {
                result['line'] = item.split(':')[1].trim();
            }
            else if (item.indexOf('Column') > -1) {
                result['column'] = item.split(':')[1].trim();
            }
            else {
                result['message'] = item;
            }
        }
        return result;
    }
}