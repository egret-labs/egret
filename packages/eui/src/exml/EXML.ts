//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////

/// <reference path="EXMLParser.ts" />
let parser = new eui.sys.EXMLParser();
let requestPool: egret.HttpRequest[] = [];
let callBackMap: any = {};
let parsedClasses: any = {};
let $prefixURL: string = "";
export let prefixURL: string;
Object.defineProperty(EXML, "prefixURL", {
        get: function (): string { return $prefixURL },
        set: function (value: string) { $prefixURL = value },
        enumerable: true,
        configurable: true
    });
export function parse(text: string): { new(): any } {
        return parser.parse(text);
    }
export function load(url: string, callBack?: (clazz: any, url: string) => void, thisObject?: any, useCache = false): void {
        if (DEBUG) {
            if (!url) {
                egret.$error(1003, "url");
            }
        }
        if (useCache && (url in parsedClasses)) {
            callBack && callBack.call(thisObject, parsedClasses[url], url);
            return;
        }
        let list = callBackMap[url];
        if (list) {
            list.push([callBack, thisObject]);
            return;
        }
        callBackMap[url] = [[callBack, thisObject]];
        request(url, $parseURLContent);
    }
export function $loadAll(urls: string[], callBack?: (clazz: any[], url: string[]) => void, thisObject?: any, useCache = false): void {
        if (!urls || urls.length == 0) {
            callBack && callBack.call(thisObject, [], urls);
            return;
        }
        let exmlContents: string[] = [];

        urls.forEach(url => {

            let loaded = (url: string, text: string) => {
                exmlContents[url] = text;
                exmlContents.push(url);
                if (exmlContents.length == urls.length)
                    onLoadAllFinished(urls, exmlContents, callBack, thisObject);
            };

            if (useCache && (url in parsedClasses)) {
                loaded(url, "");
                return;
            }

            request(url, loaded);
        });

    }
function onLoadAllFinished(urls: string[], exmlContents: any, callBack?: (clazz: any[], url: string[]) => void, thisObject?: any) {
        let clazzes = [];
        urls.forEach((url, i) => {

            if ((url in parsedClasses) && !exmlContents[url]) {
                clazzes[i] = parsedClasses[url];
                return;
            }

            let text = exmlContents[url];
            let clazz = $parseURLContent(url, text);
            clazzes[i] = clazz;

        });

        callBack && callBack.call(thisObject, clazzes, urls);
    }
export function update(url: string, clazz: any) {
        parsedClasses[url] = clazz;
        let list: any[] = callBackMap[url];
        delete callBackMap[url];
        let length = list ? list.length : 0;
        for (let i = 0; i < length; i++) {
            let arr = list[i];
            if (arr[0] && arr[1])
                arr[0].call(arr[1], clazz, url);
        }
    }
export function $parseURLContentAsJs(url: string, text: string, className: string) {
        let clazz: any = null;
        if (text) {
            clazz = parser.$parseCode(text, className);
            update(url, clazz)
        }

    }
export function $parseURLContent(url: string, text: string | any): any {
        let clazz: any = null;
        if (text && typeof (text) == "string") {
            try {
                clazz = parse(text);
            }
            catch (e) {
                console.error(url + "\n" + e.message)
            }
        }
        if (text && text["prototype"]) {
            clazz = text;
        }
        if (url) {
            if (clazz) {
                parsedClasses[url] = clazz;
            }
            let list: any[] = callBackMap[url];
            delete callBackMap[url];
            let length = list ? list.length : 0;
            for (let i = 0; i < length; i++) {
                let arr = list[i];
                if (arr[0] && arr[1])
                    arr[0].call(arr[1], clazz, url);
            }
        }
        return clazz;
    }
function request(url: string, callback: (url: string, text: string) => void) {
        let openUrl = url;
        if (url.indexOf("://") == -1) {
            openUrl = $prefixURL + url;
        }

        let onConfigLoaded = function (str: string) {
            if (!str) {
                str = "";
            }
            callback(url, str);
        };
        eui.getTheme(openUrl, onConfigLoaded);
    }