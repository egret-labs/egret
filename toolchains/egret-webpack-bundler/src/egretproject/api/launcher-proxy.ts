import { LauncherAPI } from ".";
import * as _path from 'path';
import * as fs from 'fs';

type LauncherAPI_MinVersion = { [P in keyof LauncherAPI]: string }

function getMinVersion(): LauncherAPI_MinVersion {

    return {
        getAllEngineVersions: '1.0.24',
        getInstalledTools: '1.0.24',
        getTarget: "1.0.45",
        getUserID: "1.0.46",
        sign: "1.0.46"
    }
}

export function createLauncherLibrary(): LauncherAPI {
    const egretjspath = _path.join(getEgretLauncherPath(), "egret.js");
    const minVersions = getMinVersion() as any;
    const m = require(egretjspath);
    const selector: LauncherAPI = m.selector;
    return new Proxy(selector, {
        get: (target: any, p: string, receiver) => {
            const result = target[p];
            if (!result) {
                const minVersion = minVersions[p];
                throw `找不到 LauncherAPI:${p},请安装最新的白鹭引擎启动器客户端解决此问题,最低版本要求:${minVersion},下载地址:https://egret.com/products/engine.html`//i18n
            }
            return result.bind(target)
        }
    });
}


function getEgretLauncherPath() {
    let npmEgretPath;
    if (process.platform === 'darwin') {
        let basicPath = '/usr/local';
        if (!fs.existsSync(basicPath)) {//some mac doesn't have path '/usr/local'
            basicPath = '/usr';
        }
        npmEgretPath = _path.join(basicPath, 'lib/node_modules/egret/EgretEngine');
    }
    else {
        npmEgretPath = _path.join(getAppDataPath(), 'npm/node_modules/egret/EgretEngine');

    }
    if (!fs.existsSync(npmEgretPath)) {
        throw `找不到  ${npmEgretPath}，请在 Egret Launcher 中执行修复引擎`;//todo i18n
    }
    const launcherPath = _path.join(fs.readFileSync(npmEgretPath, 'utf-8'), "../");
    return launcherPath;

}

function getAppDataPath(): string {
    var result: string = ""
    switch (process.platform) {
        case 'darwin':
            var home = process.env.HOME || ("/Users/" + (process.env.NAME || process.env.LOGNAME));
            if (!home)
                return '';
            result = `${home}/Library/Application Support/`;//Egret/engine/`;
            break;
        case 'win32':
            var appdata = process.env.AppData || `${process.env.USERPROFILE}/AppData/Roaming/`;
            result = appdata.split("\\").join("/")
            break;
        default:
            ;
    }

    if (!fs.existsSync(result)) {
        throw 'missing appdata path'
    }
    return result;
}
