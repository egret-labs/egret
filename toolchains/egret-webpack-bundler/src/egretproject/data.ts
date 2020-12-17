import * as fs from 'fs';
import * as _path from 'path';
import { getApi } from './api';


export type Target_Type = "web" | "native" | "mygame" | "wxgame" | "baidugame" | "qgame" | "oppogame" | "vivogame" | 'bricks' | 'ios' | 'android' | "any" | "none"

export type EgretProperty = {
    "engineVersion": string,
    "compilerVersion"?: string,
    "modules": EgretPropertyModule[],
    "target"?: {
        "current": string
    }
    "template"?: {

    },
    "wasm"?: {

    },
    "native"?: {
        "path_ignore"?: string[];
    },
    "publish"?: {
        "web": number,
        "native": number,
        "path": string;
    },
    "egret_version"?: string;
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


class EgretProjectData {
    private egretProperties: EgretProperty = {
        modules: [],
        target: { current: "web" },
        engineVersion: "1"

    };

    projectRoot = "";
    init(projectRoot: string) {
        this.projectRoot = projectRoot;
        this.reload();
    }

    hasEUI() {
        return this.egretProperties.modules.some(m => m.name == "eui");
    }

    reload() {
        let egretPropertiesPath = this.getFilePath("egretProperties.json");
        if (fs.existsSync(egretPropertiesPath)) {
            const content = fs.readFileSync(egretPropertiesPath, 'utf-8')
            this.egretProperties = JSON.parse(content);
            let useGUIorEUI = 0;
            for (let m of this.egretProperties.modules) {
                //兼容小写
                if (m.name == "dragonbones") {
                    m.name = "dragonBones";
                }
                if (m.name == "gui" || m.name == "eui") {
                    useGUIorEUI++;
                }
            }
            if (useGUIorEUI >= 2) {
                process.exit(1);
            }
        }
    }

    /**
     * 获取项目的根路径
     */
    getProjectRoot() {
        return this.projectRoot;
    }

    getFilePath(fileName: string) {
        return _path.resolve(this.getProjectRoot(), fileName);
    }

    getReleaseRoot() {
        var p = "bin-release";
        return p;
        //return file.joinPath(egret.args.projectDir, p);
    }

    getVersionCode() {
        return 1;
    }

    getVersion() {
        return this.egretProperties.egret_version || this.egretProperties.compilerVersion;
    }

    getIgnorePath(): Array<any> {

        return [];
    }

    getCurrentTarget() {
        return "web"
        // if (globals.hasKeys(this.egretProperties, ["target", "current"])) {
        //     return this.egretProperties.target.current;
        // }
        // else {

        // }
    }

    getCopyExmlList(): Array<string> {

        return [];
    }

    private getModulePath2(m: EgretPropertyModule) {
        let p = m.path;
        if (!p) {
            const engineVersion = m.version || this.egretProperties.engineVersion
            const versions = launcher.getEgretToolsInstalledByVersion(engineVersion);
            return _path.join(versions, 'build', m.name);
        }
        return p;

    }

    private getAbsolutePath(p: string) {
        if (_path.isAbsolute(p)) {
            return p.split("\\").join("/")
        }
        return _path.join(this.projectRoot, p).split("\\").join("/");
    }

    private getModulePath(m: EgretPropertyModule) {
        let modulePath = this.getModulePath2(m)
        modulePath = this.getAbsolutePath(modulePath);
        let name = m.name;
        if (this.isWasmProject()) {
            if (name == "egret" || name == "eui" || name == "dragonBones" || name == "game") {
                name += "-wasm";
            }
        }
        let searchPaths = [
            _path.join(modulePath, "bin", name),
            _path.join(modulePath, "bin"),
            _path.join(modulePath, "build", name),
            _path.join(modulePath)
        ];
        // if (m.path) {
        //     searchPaths.push(modulePath)
        // }
        if (this.isWasmProject()) {
            searchPaths.unshift(_path.join(modulePath, "bin-wasm"));
            searchPaths.unshift(_path.join(modulePath, "bin-wasm", name));
        }
        let dir = searchPath(searchPaths)!;
        return dir;
    }

    getLibraryFolder() {
        return this.getFilePath('libs/modules');
    }

    getModulesConfig(platform: Target_Type) {
        if (platform == 'ios' || platform == 'android') {
            platform = 'web';
        }
        let result = this.egretProperties.modules.map(m => {
            let name = m.name;
            let sourceDir = this.getModulePath(m);
            let targetDir = _path.join(this.getLibraryFolder(), name);
            let relative = _path.relative(this.getProjectRoot(), sourceDir);
            if (relative.indexOf("..") == -1 && !_path.isAbsolute(relative)) { // source 在项目中
                targetDir = sourceDir;
            }
            targetDir = ((_path.relative(this.getProjectRoot(), targetDir)) + _path.sep).split("\\").join("/");
            let source = [
                _path.join(sourceDir, name + ".js").split("\\").join("/"),
                _path.join(sourceDir, name + "." + platform + ".js").split("\\").join("/")
            ].filter(fs.existsSync);

            let target: SourceCode[] = source.map(s => {
                let debug = _path.join(targetDir, _path.basename(s)).split("\\").join("/");
                let release = _path.join(targetDir, _path.basename(s, '.js') + '.min.js').split("\\").join("/");
                return {
                    debug,
                    release,
                    platform
                }
            });
            return { name, target, sourceDir, targetDir };
        })
        return result;
    }

    isWasmProject(): boolean {
        return false;
    }

    getResources(): string[] {
        return ["resource"];
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

export var launcher = new EgretLauncherProxy();
function searchPath(searchPaths: string[]): string | null {
    for (let s of searchPaths) {
        if (fs.existsSync(s)) {
            return s;
        }
    }
    return null;
}