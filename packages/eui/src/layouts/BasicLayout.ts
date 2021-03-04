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

import { Component } from "../components/Component";
import { Group } from "../components/Group";
import { UIComponent, UIKeys } from "../core/UIComponent";
import { LayoutBase } from "./supportClasses/LayoutBase";

export class BasicLayout extends LayoutBase {

        /**
         * Constructor.
         * @version Egret 2.4
         * @version eui 1.0
         * @platform Web,Native
         * @language en_US
         */
        /**
         * 构造函数。
         * @version Egret 2.4
         * @version eui 1.0
         * @platform Web,Native
         * @language zh_CN
         */
        public constructor() {
            super();
        }


        /**
         * BasicLayout does not support virtual layout, setting this property is invalid.
         * @language en_US
         */
        /**
         * BasicLayout不支持虚拟布局，设置这个属性无效。
         * @language zh_CN
         */
        public useVirtualLayout:boolean;

        /**
         * @inheritDoc
         */
        public measure():void {
            super.measure();
            measure(this.$target);
        }


        /**
         * @inheritDoc
         */
        public updateDisplayList(unscaledWidth:number, unscaledHeight:number):void {
            super.updateDisplayList(unscaledWidth, unscaledHeight);
            let target = this.$target;
            let pos = updateDisplayList(target, unscaledWidth, unscaledHeight);
            target.setContentSize(Math.ceil(pos.x), Math.ceil(pos.y));
        }
    }
if (DEBUG) {
        Object.defineProperty(BasicLayout.prototype, "useVirtualLayout", {
            /**
             * 此布局不支持虚拟布局，设置这个属性无效
             */
            get: function () {
                return this.$useVirtualLayout;
            },
            set: function (value) {
                egret.$error(2201);
            },
            enumerable: true,
            configurable: true
        });
    }
let UIComponentClass = "eui.UIComponent";
function formatRelative(value:number|string, total:number):number {
        if (!value || typeof value == "number") {
            return <number>value;
        }
        let str = <string>value;
        let index = str.indexOf("%");
        if (index == -1) {
            return +str;
        }
        let percent = +str.substring(0, index);
        return percent * 0.01 * total;
    }
export function measure(target:Group|Component):void {
        if (!target) {
            return;
        }
        let width = 0;
        let height = 0;
        let bounds = egret.$TempRectangle;
        let count = target.numChildren;
        for (let i = 0; i < count; i++) {
            let layoutElement = <UIComponent> (target.getChildAt(i));
            if (!egret.is(layoutElement, UIComponentClass) || !layoutElement.$includeInLayout) {
                continue;
            }

            let values = layoutElement.$UIComponent;
            let hCenter = +values[UIKeys.horizontalCenter];
            let vCenter = +values[UIKeys.verticalCenter];
            let left = +values[UIKeys.left];
            let right = +values[UIKeys.right];
            let top = +values[UIKeys.top];
            let bottom = +values[UIKeys.bottom];

            let extX:number;
            let extY:number;

            layoutElement.getPreferredBounds(bounds);

            if (!isNaN(left) && !isNaN(right)) {
                extX = left + right;
            }
            else if (!isNaN(hCenter)) {
                extX = Math.abs(hCenter) * 2;
            }
            else if (!isNaN(left) || !isNaN(right)) {
                extX = isNaN(left) ? 0 : left;
                extX += isNaN(right) ? 0 : right;
            }
            else {
                extX = bounds.x;
            }

            if (!isNaN(top) && !isNaN(bottom)) {
                extY = top + bottom;
            }
            else if (!isNaN(vCenter)) {
                extY = Math.abs(vCenter) * 2;
            }
            else if (!isNaN(top) || !isNaN(bottom)) {
                extY = isNaN(top) ? 0 : top;
                extY += isNaN(bottom) ? 0 : bottom;
            }
            else {
                extY = bounds.y;
            }

            let preferredWidth = bounds.width;
            let preferredHeight = bounds.height;
            width = Math.ceil(Math.max(width, extX + preferredWidth));
            height = Math.ceil(Math.max(height, extY + preferredHeight));
        }

        target.setMeasuredSize(width, height);
    }
export function updateDisplayList(target:Group|Component,
                                      unscaledWidth:number, unscaledHeight:number):egret.Point {
        if (!target)
            return;

        let count = target.numChildren;

        let maxX = 0;
        let maxY = 0;
        let bounds = egret.$TempRectangle;
        for (let i = 0; i < count; i++) {
            let layoutElement = <UIComponent> (target.getChildAt(i));
            if (!egret.is(layoutElement, UIComponentClass) || !layoutElement.$includeInLayout) {
                continue;
            }

            let values = layoutElement.$UIComponent;
            let hCenter = formatRelative(values[UIKeys.horizontalCenter], unscaledWidth*0.5);
            let vCenter = formatRelative(values[UIKeys.verticalCenter], unscaledHeight*0.5);
            let left = formatRelative(values[UIKeys.left], unscaledWidth);
            let right = formatRelative(values[UIKeys.right], unscaledWidth);
            let top = formatRelative(values[UIKeys.top], unscaledHeight);
            let bottom = formatRelative(values[UIKeys.bottom], unscaledHeight);
            let percentWidth = values[UIKeys.percentWidth];
            let percentHeight = values[UIKeys.percentHeight];

            let childWidth = NaN;
            let childHeight = NaN;

            if (!isNaN(left) && !isNaN(right)) {
                childWidth = unscaledWidth - right - left;
            }
            else if (!isNaN(percentWidth)) {
                childWidth = Math.round(unscaledWidth * Math.min(percentWidth * 0.01, 1));
            }

            if (!isNaN(top) && !isNaN(bottom)) {
                childHeight = unscaledHeight - bottom - top;
            }
            else if (!isNaN(percentHeight)) {
                childHeight = Math.round(unscaledHeight * Math.min(percentHeight * 0.01, 1));
            }

            layoutElement.setLayoutBoundsSize(childWidth, childHeight);
            layoutElement.getLayoutBounds(bounds);
            let elementWidth = bounds.width;
            let elementHeight = bounds.height;


            let childX = NaN;
            let childY = NaN;

            if (!isNaN(hCenter))
                childX = Math.round((unscaledWidth - elementWidth) / 2 + hCenter);
            else if (!isNaN(left))
                childX = left;
            else if (!isNaN(right))
                childX = unscaledWidth - elementWidth - right;
            else
                childX = bounds.x;

            if (!isNaN(vCenter))
                childY = Math.round((unscaledHeight - elementHeight) / 2 + vCenter);
            else if (!isNaN(top))
                childY = top;
            else if (!isNaN(bottom))
                childY = unscaledHeight - elementHeight - bottom;
            else
                childY = bounds.y;

            layoutElement.setLayoutBoundsPosition(childX, childY);

            maxX = Math.max(maxX, childX + elementWidth);
            maxY = Math.max(maxY, childY + elementHeight);
        }
        return egret.$TempPoint.setTo(maxX, maxY);
    }