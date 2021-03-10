import { linkNodeModules } from '@egret/link-node-modules';
import * as fs from 'fs-extra-promise';
import * as _path from 'path';
import { validate } from 'schema-utils';
import { getApi } from './api';
import schema from './egret-properties-schema.json';
import { EgretProperties } from './typings';

export type Target_Type = 'web' | 'native' | 'mygame' | 'wxgame' | 'baidugame' | 'qgame' | 'oppogame' | 'vivogame' | 'bricks' | 'ios' | 'android' | 'any' | 'none'

export type EgretPropertyModule = EgretProperties['modules'][0];

type SourceCode = {

    debug: string,
    release: string,
    platform: Target_Type
}

export function createProject(projectRoot: string) {
    const project = new EgretProject();
    project.init(projectRoot);
    return project;
}

export class EgretProject {
    private egretProperties: EgretProperties = {
        modules: [],
        target: { current: 'web' },
        engineVersion: '1',
        compilerVersion: '1'

    };

    projectRoot = '';
    init(projectRoot: string) {
        this.projectRoot = projectRoot;
        this.reload();
    }

    initialize(projectRoot: string, content: string) {
        this.projectRoot = projectRoot;
        this.parse(content);
    }

    hasEUI() {
        return this.egretProperties.modules.some((m) => m.name == 'eui');
    }

    private parse(content: string) {
        this.egretProperties = JSON.parse(content);
        validate(schema as any, this.egretProperties);
        for (const m of this.egretProperties.modules) {
            //兼容小写
            if (m.name == 'dragonbones') {
                m.name = 'dragonBones';
            }
        }
    }

    private reload() {
        const egretPropertiesPath = this.getFilePath('egretProperties.json');
        if (fs.existsSync(egretPropertiesPath)) {
            const content = fs.readFileSync(egretPropertiesPath, 'utf-8');
            this.parse(content);
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
        const searchPaths = [
            _path.join(modulePath, 'bin', m.name),
            _path.join(modulePath, 'bin'),
            _path.join(modulePath, 'build', m.name),
            _path.join(modulePath)
        ];
        const dir = searchPath(searchPaths)!;
        return dir;
    }

    private getLibraryFolder() {
        return this.getFilePath('libs/modules');
    }

    private getConfigByModule(m: EgretPropertyModule, platform: Target_Type) {
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

    async copy() {
        const egretModules = this.getModulesConfig('web');
        for (const m of egretModules) {
            await fs.ensureDirAsync(_path.dirname(m.targetDir));
            await fs.copyAsync(m.sourceDir, m.targetDir);
        }
    }

    async link() {
        const packages = this.egretProperties.packages || [];
        const packageRoot = _path.resolve(__dirname, '../../../../packages/');
        for (const p of packages) {
            const packageDir = _path.join(packageRoot, p.name);
            await linkNodeModules(packageDir, this.projectRoot);
        }
    }
}

class EgretLauncherProxy {

    getEgretToolsInstalledByVersion(checkVersion: string) {
        const egretjs = getApi();
        const data = egretjs.getAllEngineVersions();
        const versions: { version: string, path: string }[] = [];
        const result = data[checkVersion];
        if (!result) {
            // eslint-disable-next-line no-throw-literal
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