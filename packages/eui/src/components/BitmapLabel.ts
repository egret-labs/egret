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

/// <reference path="../core/UIComponent.ts" />

import { IDisplayText } from "../core/IDisplayText";
import { UIComponent, getAssets, implementUIComponent, UIComponentImpl, UIKeys } from "../core/UIComponent";
import { PropertyEvent } from "../events/PropertyEvent";
import { registerBindable } from "../utils/registerBindable";

let UIImpl = UIComponentImpl;
export class BitmapLabel extends egret.BitmapText implements UIComponent, IDisplayText {
        public constructor(text?: string) {
            super();
            this.initializeUIValues();
            this.text = text;
        }
        /**
         * @private
         */
        $invalidateContentBounds(): void {
            super.$invalidateContentBounds();
            this.invalidateSize();
        }
        /**
         * @private
         *
         * @param value
         */
        $setWidth(value: number): boolean {
            let result1: boolean = super.$setWidth(value);
            let result2: boolean = UIImpl.prototype.$setWidth.call(this, value);
            return result1 && result2;
        }
        /**
         * @private
         *
         * @param value
         */
        $setHeight(value: number): boolean {
            let result1: boolean = super.$setHeight(value);
            let result2: boolean = UIImpl.prototype.$setHeight.call(this, value);
            return result1 && result2;
        }
        /**
         * @private
         *
         * @param value
         */
        $setText(value: string): boolean {
            let result: boolean = super.$setText(value);
            PropertyEvent.dispatchPropertyEvent(this, PropertyEvent.PROPERTY_CHANGE, "text");
            return result;
        }
        private $fontForBitmapLabel: string | egret.BitmapFont;
        $setFont(value: any): boolean {
            if (this.$fontForBitmapLabel == value) {
                return false;
            }
            this.$fontForBitmapLabel = value;
            if (this.$createChildrenCalled) {
                this.$parseFont();
            } else {
                this.$fontChanged = true;
            }
            this.$fontStringChanged = true;
            return true;
        }
        private $createChildrenCalled: boolean = false;
        private $fontChanged: boolean = false;
        /**
         * 解析source
         */
        private $parseFont(): void {
            this.$fontChanged = false;
            let font = this.$fontForBitmapLabel;
            if (typeof font == "string") {
                getAssets(font, function (bitmapFont) {
                    this.$setFontData(bitmapFont, <string>font);
                }, this);
            } else {
                this.$setFontData(font);
            }
        }

        $setFontData(value: egret.BitmapFont, font?: string): boolean {
            if (font && font != this.$fontForBitmapLabel) {
                return;
            }
            if (value == this.$font) {
                return false;
            }
            this.$font = value;
            this.$invalidateContentBounds();
            return true;
        }
        /**
         * @private
         */
        private _widthConstraint: number = NaN;
        /**
         * @private
         */
        private _heightConstraint: number = NaN;
        //=======================UIComponent接口实现===========================
        /**
         * @private
         * UIComponentImpl 定义的所有变量请不要添加任何初始值，必须统一在此处初始化。
         */
        private initializeUIValues: () => void;
        /**
         * @copy eui.UIComponent#createChildren
         */
        protected createChildren(): void {
            if (this.$fontChanged) {
                this.$parseFont();
            }
            this.$createChildrenCalled = true;
        }

        /**
         * @copy eui.UIComponent#childrenCreated
         */
        protected childrenCreated(): void {

        }

        /**
         * @copy eui.UIComponent#commitProperties
         */
        protected commitProperties(): void {

        }

        /**
         * @copy eui.UIComponent#measure
         */
        protected measure(): void {
            let values = this.$UIComponent;
            let oldWidth = this.$textFieldWidth;
            let oldHeight = this.$textFieldHeight;
            let availableWidth = NaN;
            if (!isNaN(this._widthConstraint)) {
                availableWidth = this._widthConstraint;
                this._widthConstraint = NaN;
            }
            else if (!isNaN(values[UIKeys.explicitWidth])) {
                availableWidth = values[UIKeys.explicitWidth];
            }
            else if (values[UIKeys.maxWidth] != 100000) {
                availableWidth = values[UIKeys.maxWidth];
            }
            super.$setWidth(availableWidth);
            let availableHeight = NaN;
            if (!isNaN(this._heightConstraint)) {
                availableHeight = this._heightConstraint;
                this._heightConstraint = NaN;
            }
            else if (!isNaN(values[UIKeys.explicitHeight])) {
                availableHeight = values[UIKeys.explicitHeight];
            }
            else if (values[UIKeys.maxHeight] != 100000) {
                availableHeight = values[UIKeys.maxHeight];
            }
            super.$setHeight(availableHeight);
            this.setMeasuredSize(this.textWidth, this.textHeight);
            super.$setWidth(oldWidth);
            super.$setHeight(oldHeight);
        }
        /**
         * @copy eui.UIComponent#updateDisplayList
         */
        protected updateDisplayList(unscaledWidth: number, unscaledHeight: number): void {
            super.$setWidth(unscaledWidth);
            super.$setHeight(unscaledHeight);
        }

        /**
         * @copy eui.UIComponent#invalidateParentLayout
         */
        protected invalidateParentLayout(): void {
        }

        /**
         * @private
         */
        $UIComponent: Object;

        /**
         * @private
         */
        $includeInLayout: boolean;

        /**
         * @copy eui.UIComponent#includeInLayout
         */
        public includeInLayout: boolean;
        /**
         * @copy eui.UIComponent#left
         */
        public left: any;

        /**
         * @copy eui.UIComponent#right
         */
        public right: any;

        /**
         * @copy eui.UIComponent#top
         */
        public top: any;

        /**
         * @copy eui.UIComponent#bottom
         */
        public bottom: any;

        /**
         * @copy eui.UIComponent#horizontalCenter
         */
        public horizontalCenter: any;

        /**
         * @copy eui.UIComponent#verticalCenter
         */
        public verticalCenter: any;

        /**
         * @copy eui.UIComponent#percentWidth
         */
        public percentWidth: number;

        /**
         * @copy eui.UIComponent#percentHeight
         */
        public percentHeight: number;

        /**
         * @copy eui.UIComponent#explicitWidth
         */
        public explicitWidth: number;

        /**
         * @copy eui.UIComponent#explicitHeight
         */
        public explicitHeight: number;


        /**
         * @copy eui.UIComponent#minWidth
         */
        public minWidth: number;
        /**
         * @copy eui.UIComponent#maxWidth
         */
        public maxWidth: number;

        /**
         * @copy eui.UIComponent#minHeight
         */
        public minHeight: number;
        /**
         * @copy eui.UIComponent#maxHeight
         */
        public maxHeight: number;

        /**
         * @inheritDoc
         */
        public setMeasuredSize(width: number, height: number): void {
        }

        /**
         * @inheritDoc
         */
        public invalidateProperties(): void {
        }

        /**
         * @inheritDoc
         */
        public validateProperties(): void {
        }

        /**
         * @inheritDoc
         */
        public invalidateSize(): void {
        }

        /**
         * @inheritDoc
         */
        public validateSize(recursive?: boolean): void {
        }

        /**
         * @inheritDoc
         */
        public invalidateDisplayList(): void {
        }

        /**
         * @inheritDoc
         */
        public validateDisplayList(): void {
        }

        /**
         * @inheritDoc
         */
        public validateNow(): void {
        }

        /**
         * @inheritDoc
         */
        public setLayoutBoundsSize(layoutWidth: number, layoutHeight: number): void {
            UIImpl.prototype.setLayoutBoundsSize.call(this, layoutWidth, layoutHeight);
            if (isNaN(layoutWidth) || layoutWidth === this._widthConstraint || layoutWidth == 0) {
                return;
            }
            let values = this.$UIComponent;
            if (!isNaN(values[UIKeys.explicitHeight])) {
                return;
            }
            if (layoutWidth == values[UIKeys.measuredWidth]) {
                return;
            }
            this._widthConstraint = layoutWidth;
            this._heightConstraint = layoutHeight;
            this.invalidateSize();
        }

        /**
         * @inheritDoc
         */
        public setLayoutBoundsPosition(x: number, y: number): void {
        }

        /**
         * @inheritDoc
         */
        public getLayoutBounds(bounds: egret.Rectangle): void {
        }

        /**
         * @inheritDoc
         */
        public getPreferredBounds(bounds: egret.Rectangle): void {
        }
    }
implementUIComponent(BitmapLabel, egret.BitmapText);
registerBindable(BitmapLabel.prototype, "text");
