import * as transformer from '@egret/ts-minify-transformer';
import * as fs from 'fs';
import * as ts from 'typescript';

export function build() {
    const x = ts.parseCommandLine(process.argv.slice(2));
    const content = fs.readFileSync(x.options.project!, 'utf-8');
    const options = ts.parseJsonConfigFileContent(JSON.parse(content), ts.sys, process.cwd());
    const program = ts.createProgram(options.fileNames, options.options);
    const emitResult = program.emit(undefined, (filename, data) => {
        ts.sys.writeFile(filename, data);
    }, undefined, undefined, {
        before: [transformer.emitClassName()],
        after: []
    });

    const allDiagnostics = ts
        .getPreEmitDiagnostics(program)
        .concat(emitResult.diagnostics);

    allDiagnostics.forEach((diagnostic) => {
        if (diagnostic.file) {
            const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
            const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
            console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
        } else {
            console.log(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
        }
    });
    const exitCode = emitResult.emitSkipped ? 1 : 0;
    console.log(`Process exiting with code '${exitCode}'.`);
    // eslint-disable-next-line no-process-exit
    process.exit(exitCode);
}

export function watch() {

}