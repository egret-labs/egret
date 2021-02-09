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


let callBackMap: any = {};
let parsedClasses: any = {};


let innerClassCount = 0;

class ExmlParser {


    public $parseCode(codeText: string, classStr: string): { new(): any } {
        //传入的是编译后的js字符串
        let className = classStr ? classStr : "$exmlClass" + innerClassCount++;
        let geval = eval;
        let clazz = geval(codeText);
        let hasClass = true;

        if (hasClass && clazz) {
            egret.registerClass(clazz, className);
            let paths = className.split(".");
            let length = paths.length;
            let definition = __global;
            for (let i = 0; i < length - 1; i++) {
                let path = paths[i];
                definition = definition[path] || (definition[path] = {});
            }
            if (definition[paths[length - 1]]) {
                if (DEBUG && !parsedClasses[className]) {
                    egret.$warn(2101, className, codeText);
                }
            }
            else {
                if (DEBUG) {
                    parsedClasses[className] = true;
                }
                definition[paths[length - 1]] = clazz;
            }
        }
        return clazz;
    }
}

let parser = new ExmlParser();

/**
 * @private
 */
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

export function exmlUpdate(url: string, clazz: any) {
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


/**
 * @private
 * @param url
 * @param text
 */
export function $parseURLContentAsJs(url: string, text: string, className: string) {
    let clazz: any = null;
    if (text) {
        clazz = parser.$parseCode(text, className);
        exmlUpdate(url, clazz)
    }

}
/**
 * @private
 */
export function $parseURLContent(url: string, text: string | any): any {
    let clazz: any = null;
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
