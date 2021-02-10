import { Component } from "../components/Component";

export class Context {

    private $styles: any = {};

    private skinMap: { [key: string]: string } = {};

    public mapSkin(hostComponentKey: string, skinName: string): void {
        if (DEBUG) {
            if (!hostComponentKey) {
                egret.$error(1003, "hostComponentKey");
            }
            if (!skinName) {
                egret.$error(1003, "skinName");
            }
        }
        this.skinMap[hostComponentKey] = skinName;
    }

    async initialize() {
        const data = await this.getTheme();
        if (data && data.skins) {
            let skinMap = this.skinMap
            let skins = data.skins;
            let keys = Object.keys(skins);
            let length = keys.length;
            for (let i = 0; i < length; i++) {
                let key = keys[i];
                if (!skinMap[key]) {
                    this.mapSkin(key, skins[key]);
                }
            }
        }

        if (data.styles) {
            this.$styles = data.styles;
        }
        let paths = data.paths;
        for (let path in paths) {
            // exmlUpdate(path, paths[path])
        }

        //commonjs|commonjs2
        if (!data.exmls || data.exmls.length == 0) {

        }
        else {
            // EXML.$loadAll(<string[]>data.exmls, this.onLoaded, this, true);
        }
    }

    public getSkinName(client: Component): string {
        let skinMap = this.skinMap;
        let skinName: string = skinMap[client.hostComponentKey];
        if (!skinName) {
            skinName = this.findSkinName(client);
        }
        return skinName;
    }

    private findSkinName(prototype: any): string {
        if (!prototype) {
            return "";
        }
        let key = prototype["__class__"];
        if (key === void 0) {
            return "";
        }
        let skinName = this.skinMap[key];
        if (skinName || key == "eui.Component") {
            return skinName;
        }
        return this.findSkinName(Object.getPrototypeOf(prototype));
    }

    // getAssets(source: string, callback: (content: any) => void, thisObject: any) {
    //     let adapter: IAssetAdapter = egret.getImplementation("eui.IAssetAdapter");
    //     if (!adapter) {
    //         adapter = new DefaultAssetAdapter();
    //     }
    //     adapter.getAsset(source, content => {
    //         callback.call(thisObject, content);
    //     }, this);
    // }

    getTheme: () => Promise<any>


    getAssets: (source: string) => Promise<any>

    static getInstance() {
        if (!this._instance) {
            this._instance = new Context();
        }
        return this._instance;
    }

    private static _instance: Context;
}


