import { createInstallerLibrary } from "./installer-proxy";
import { createLauncherLibrary } from "./launcher-proxy";

export type LauncherAPI = {


    getAllEngineVersions(): { [version: string]: { version: string, root: string } };

    getInstalledTools(): { name: string, version: string, path: string }[];

    getTarget(targetName: string): string

    getUserID(): string;

    sign(templatePath: string, uid: string): void;


}

let api: LauncherAPI;

export function getApi(): LauncherAPI {
    if (!api) {
        api = createAPI();
    }
    return api;
}

function createAPI() {
    try {
        return createLauncherLibrary();
    }
    catch (e) {
        return createInstallerLibrary();
    }
}


