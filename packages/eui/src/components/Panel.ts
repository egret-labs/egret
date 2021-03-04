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

import { IDisplayText } from "../core/IDisplayText";
import { UIEvent } from "../events/UIEvent";
import { registerProperty } from "../utils/registerProperty";
import { Button } from "./Button";
import { Component } from "./Component";

export class Panel extends Component {

        /**
         * Constructor.
         *
         * @version Egret 2.4
         * @version eui 1.0
         * @platform Web,Native
         * @language en_US
         */
        /**
         * 构造函数。
         *
         * @version Egret 2.4
         * @version eui 1.0
         * @platform Web,Native
         * @language zh_CN
         */
        public constructor() {
            super();
            this.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.onWindowTouchBegin, this, false, 100);
        }

        /**
         * @private
         * 在窗体上按下时前置窗口
         */
        private onWindowTouchBegin(event:egret.TouchEvent):void {
            this.$parent.addChild(this);
        }


        /**
         * write-only property,This property is Usually invoked in resolving an EXML for adding multiple children quickly.
         *
         * @version Egret 2.4
         * @version eui 1.0
         * @platform Web,Native
         * @language en_US
         */
        /**
         * 只写属性，此属性通常在 EXML 的解析器中调用，便于快速添加多个子项。
         * @version Egret 2.4
         * @version eui 1.0
         * @platform Web,Native
         * @language zh_CN
         */
        public set elementsContent(value:egret.DisplayObject[]) {
            if (value) {
                let length = value.length;
                for (let i = 0; i < length; i++) {
                    this.addChild(value[i]);
                }
            }
        }

        /**
         * The skin part that defines the appearance of the close button.
         * When taped, the close button dispatches a <code>closing</code> event.
         *
         * @skinPart
         * @language en_US
         */
        /**
         * 关闭按钮
         *
         * @skinPart
         * @language zh_CN
         */
        public closeButton:Button = null;

        /**
         * The area where the user must drag to move the window.
         * @language en_US
         */
        /**
         * 可移动区域
         *
         * @skinPart
         * @language zh_CN
         */
        public moveArea:egret.DisplayObject = null;

        /**
         * The skin part that defines the appearance of the
         * title text in the container.
         *
         * @skinPart
         * @language en_US
         */
        /**
         * 标题显示对象
         *
         * @skinPart
         * @language zh_CN
         */
        public titleDisplay:IDisplayText = null;

        /**
         * @private
         */
        private _title:string = "";

        /**
         * Title or caption displayed in the title bar.
         *
         * @default ""
         * @language en_US
         */
        /**
         * 标题栏中显示的标题。
         *
         * @default ""
         * @language zh_CN
         */
        public get title():string {
            return this._title;
        }

        public set title(value:string) {
            this._title = value;
            if (this.titleDisplay)
                this.titleDisplay.text = this.title;
        }

        /**
         * @inheritDoc
         */
        protected partAdded(partName:string, instance:any):void {
            super.partAdded(partName, instance);
            if (instance == this.titleDisplay) {
                this.titleDisplay.text = this._title;
            }
            else if (instance == this.moveArea) {
                this.moveArea.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.onTouchBegin, this);
            }
            else if (instance == this.closeButton) {
                this.closeButton.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onCloseButtonClick, this);
            }
        }

        /**
         * @inheritDoc
         */
        protected partRemoved(partName:string, instance:any):void {
            super.partRemoved(partName, instance);
            if (instance == this.moveArea) {
                this.moveArea.removeEventListener(egret.TouchEvent.TOUCH_BEGIN, this.onTouchBegin, this);
            }
            else if (instance == this.closeButton) {
                this.closeButton.removeEventListener(egret.TouchEvent.TOUCH_TAP, this.onCloseButtonClick, this);
            }
        }

        /**
         * Dispatch the "closing" event when the closeButton is clicked.
         * @language en_US
         */
        /**
         * 当 closeButton 被点击时派发 “closing” 事件
         * @language zh_CN
         */
        protected onCloseButtonClick(event:egret.TouchEvent):void {
            if (UIEvent.dispatchUIEvent(this, UIEvent.CLOSING, true, true)) {
                this.close();
            }
        }

        /**
         * Close the panel and remove from the parent container.
         * @language en_US
         */
        /**
         * 关闭面板，从父级容器移除自身。
         * @language zh_CN
         */
        public close():void {
            if (!this.$parent) {
                return;
            }
            this.$parent.removeChild(this);
        }

        /**
         * @private
         * 触摸按下时的偏移量
         */
        private offsetPointX:number = 0;
        /**
         * @private
         */
        private offsetPointY:number = 0;

        /**
         * Called when the user starts dragging a Panel.
         * @language en_US
         */
        /**
         * 在可移动区域按下
         * @language zh_CN
         */
        protected onTouchBegin(event:egret.TouchEvent):void {
            this.$includeInLayout = false;
            this.offsetPointX = this.x - event.$stageX;
            this.offsetPointY = this.y - event.$stageY;
            this.$stage.addEventListener(egret.TouchEvent.TOUCH_MOVE, this.onTouchMove, this);
            this.$stage.addEventListener(egret.TouchEvent.TOUCH_END, this.onTouchEnd, this);
        }

        /**
         * Called when the user drags a Panel.
         * @language en_US
         */
        /**
         * 触摸拖拽时的移动事件
         * @language zh_CN
         */
        protected onTouchMove(event:egret.TouchEvent):void {
            this.x = event.$stageX + this.offsetPointX;
            this.y = event.$stageY + this.offsetPointY;
        }

        /**
         * Called when the user releases the Panel.
         * @language en_US
         */
        /**
         * 在舞台上弹起事件
         * @language zh_CN
         */
        protected onTouchEnd(event:egret.TouchEvent):void {
            let stage = event.$currentTarget;
            stage.removeEventListener(egret.TouchEvent.TOUCH_MOVE, this.onTouchMove, this);
            stage.removeEventListener(egret.TouchEvent.TOUCH_END, this.onTouchEnd, this);
        }
    }
registerProperty(Panel, "elementsContent", "Array", true);