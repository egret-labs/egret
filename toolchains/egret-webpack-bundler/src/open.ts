import * as cp from 'child_process';
import * as path from 'path';

export function openUrl(url: string, browserName?: string) {
    var command;

    switch (process.platform) {
        case 'darwin':
            if (browserName) {
                command = 'open -a "' + escape(browserName) + '"';
            } else {
                command = 'open';
            }
            break;
        case 'win32':
            // if the first parameter to start is quoted, it uses that as the title
            // so we pass a blank title so we can quote the file we are opening
            if (browserName) {
                command = 'start "" "' + escape(browserName) + '"';
            } else {
                command = 'start ""';
            }
            break;
        default:
            if (browserName) {
                command = escape(browserName);
            } else {
                // use Portlands xdg-open everywhere else
                command = path.join(__dirname, '../vendor/xdg-open');
            }
            break;
    }
    executeCommand(command + ' "' + url + '"')
}

export async function executeCommand(command: string, options = {}) {
    return new Promise<void>((resolve, reject) => {
        cp.exec(command, options, (error, stdout, stderr) => {
            resolve();
        });
    })
}
