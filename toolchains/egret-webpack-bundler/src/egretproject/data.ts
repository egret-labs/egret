import * as fs from 'fs';
import * as _path from 'path';
import { getApi } from './api';

export type Target_Type = 'web' | 'native' | 'mygame' | 'wxgame' | 'baidugame' | 'qgame' | 'oppogame' | 'vivogame' | 'bricks' | 'ios' | 'android' | 'any' | 'none'

export type EgretProperty = {
    engineVersion: string,
    compilerVersion?: string,
    modules: EgretPropertyModule[],
    target?: {
        current: string
    }
    template?: {

    },
    egret_version?: string;
    eui?: {
        exmlRoot?: string[]
        theme?: string[]
    }
}

export type EgretPropertyModule = {
    name: string,
    version?: string,
    path?: string;
}

export type Package_JSON = {

    /**
     * 废弃属性
     */
    modules?: PACKAGE_JSON_MODULE[];

    typings: string | null;

}

export type PACKAGE_JSON_MODULE = {

    files: string[],

    name: string;

    root: string

}

type SourceCode = {

    debug: string,
    release: string,
    platform: Target_Type
}

export class EgretProjectData {
    private egretProperties: EgretProperty = {
        modules: [],
        target: { current: 'web' },
        engineVersion: '1'

    };

    projectRoot = '';
    init(projectRoot: string) {
        this.projectRoot = projectRoot;
        this.reload();
    }

    hasEUI() {
        return this.egretProperties.modules.some((m) => m.name == 'eui');
    }

    reload() {
        const egretPropertiesPath = this.getFilePath('egretProperties.json');
        if (fs.existsSync(egretPropertiesPath)) {
            const content = fs.readFileSync(egretPropertiesPath, 'utf-8');
            this.egretProperties = JSON.parse(content);
            let useGUIorEUI = 0;
            for (const m of this.egretProperties.modules) {
                //兼容小写
                if (m.name == 'dragonbones') {
                    m.name = 'dragonBones';
                }
                if (m.name == 'gui' || m.name == 'eui') {
                    useGUIorEUI++;
                }
            }
            if (useGUIorEUI >= 2) {
            }
        }
    }

    /**
     * 获取项目的根路径
     */
    getProjectRoot() {
        return this.projectRoot;
    }

    private getFilePath(fileName: string) {
        return _path.resolve(this.getProjectRoot(), fileName);
    }

    getVersion() {
        return this.egretProperties.egret_version || this.egretProperties.compilerVersion;
    }

    private getModulePath2(m: EgretPropertyModule) {
        const p = m.path;
        if (!p) {
            const engineVersion = m.version || this.egretProperties.engineVersion;
            const versions = launcher.getEgretToolsInstalledByVersion(engineVersion);
            return _path.join(versions, 'build', m.name);
        }
        return p;

    }

    private getAbsolutePath(p: string) {
        if (_path.isAbsolute(p)) {
            return p.split('\\').join('/');
        }
        return _path.join(this.projectRoot, p).split('\\').join('/');
    }


    getExmlRoots() {
        return this.egretProperties.eui?.exmlRoot || [];
    }

    getModules() {
        return this.egretProperties.modules.map((m) => m.name);
    }

    private getModulePath(m: EgretPropertyModule) {
        let modulePath = this.getModulePath2(m);
        modulePath = this.getAbsolutePath(modulePath);
        let name = m.name;
        if (this.isWasmProject()) {
            if (name == 'egret' || name == 'eui' || name == 'dragonBones' || name == 'game') {
                name += '-wasm';
            }
        }
        const searchPaths = [
            _path.join(modulePath, 'bin', name),
            _path.join(modulePath, 'bin'),
            _path.join(modulePath, 'build', name),
            _path.join(modulePath)
        ];
        // if (m.path) {
        //     searchPaths.push(modulePath)
        // }
        if (this.isWasmProject()) {
            searchPaths.unshift(_path.join(modulePath, 'bin-wasm'));
            searchPaths.unshift(_path.join(modulePath, 'bin-wasm', name));
        }
        const dir = searchPath(searchPaths)!;
        return dir;
    }

    private getLibraryFolder() {
        return this.getFilePath('libs/modules');
    }

    getConfigByModule(m: EgretPropertyModule, platform: Target_Type) {
        const name = m.name;
        const sourceDir = this.getModulePath(m);
        let targetDir = _path.join(this.getLibraryFolder(), name);
        const relative = _path.relative(this.getProjectRoot(), sourceDir);
        if (relative.indexOf('..') == -1 && !_path.isAbsolute(relative)) { // source 在项目中
            targetDir = sourceDir;
        }
        targetDir = ((_path.relative(this.getProjectRoot(), targetDir)) + _path.sep).split('\\').join('/');
        const source = [
            _path.join(sourceDir, name + '.js').split('\\').join('/'),
            _path.join(sourceDir, name + '.' + platform + '.js').split('\\').join('/')
        ].filter(fs.existsSync);

        const target: SourceCode[] = source.map((s) => {
            const debug = _path.join(targetDir, _path.basename(s)).split('\\').join('/');
            const release = _path.join(targetDir, _path.basename(s, '.js') + '.min.js').split('\\').join('/');
            return {
                debug,
                release,
                platform
            };
        });
        return { name, target, sourceDir, targetDir };
    }

    getModulesConfig(platform: Target_Type) {
        if (platform == 'ios' || platform == 'android') {
            platform = 'web';
        }
        const result = this.egretProperties.modules.map((m) => this.getConfigByModule(m, platform));
        return result;
    }

    private isWasmProject(): boolean {
        return false;
    }

    get useTemplate(): boolean {
        return this.egretProperties.template != undefined;
    }

    hasModule(name: string): boolean {
        let result = false;
        this.egretProperties.modules.forEach(function (module: EgretPropertyModule) {
            if (module.name == name || module.name == name) {
                result = true;
            }
        });
        return result;
    }
}

export const projectData = new EgretProjectData();

class EgretLauncherProxy {

    getEgretToolsInstalledByVersion(checkVersion: string) {
        const egretjs = getApi();
        const data = egretjs.getAllEngineVersions();
        const versions: { version: string, path: string }[] = [];
        const result = data[checkVersion];
        if (!result) {
            throw `找不到指定的 egret 版本: ${checkVersion}`;
        }
        return result.root;
    }
}

export const launcher = new EgretLauncherProxy();
function searchPath(searchPaths: string[]): string | null {
    for (const s of searchPaths) {
        if (fs.existsSync(s)) {
            return s;
        }
    }
    return null;
}