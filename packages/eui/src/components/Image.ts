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

/// <reference path="supportClasses/DefaultAssetAdapter.ts" />

import { getAssets, implementUIComponent, UIComponent, UIComponentImpl, UIKeys } from "../core/UIComponent";
import { registerProperty } from "../utils/registerProperty";

export class Image extends egret.Bitmap implements UIComponent {

        /**
         * Constructor.
         *
         * @param source The source used for the bitmap fill. the value can be
         * a string or an instance of <code>egret.Texture</code>
         *
         * @version Egret 2.4
         * @version eui 1.0
         * @platform Web,Native
         * @language en_US
         */
        /**
         * 构造函数。
         *
         * @param source 用于位图填充的源。可以是一个字符串或者 <code>egret.Texture</code> 对象
         *
         * @version Egret 2.4
         * @version eui 1.0
         * @platform Web,Native
         * @language zh_CN
         */
        public constructor(source?: string | egret.Texture) {
            super();
            this.initializeUIValues();
            if (source) {
                this.source = source;
            }
        }

        /**
         * Represent a Rectangle Area that the 9 scale area of Image.
         * Notice: This property is valid only when <code>fillMode</code>
         * is <code>BitmapFillMode.SCALE</code>.
         * @language en_US
         */
        /**
         * 矩形区域，它定义素材对象的九个缩放区域。
         * 注意:此属性仅在<code>fillMode</code>为<code>BitmapFillMode.SCALE</code>时有效。
         * @language zh_CN
         */
        public get scale9Grid(): egret.Rectangle {
            return this.$scale9Grid;
        }

        public set scale9Grid(value: egret.Rectangle) {
            this.$setScale9Grid(value);
            this.invalidateDisplayList();
        }

        /**
         * Determines how the bitmap fills in the dimensions.
         * <p>When set to <code>BitmapFillMode.CLIP</code>, the bitmap
         * ends at the edge of the region.</p>
         * <p>When set to <code>BitmapFillMode.REPEAT</code>, the bitmap
         * repeats to fill the region.</p>
         * <p>When set to <code>BitmapFillMode.SCALE</code>, the bitmap
         * stretches to fill the region.</p>
         *
         * @default <code>BitmapFillMode.SCALE</code>
         * @language en_US
         */
        /**
         * 确定位图填充尺寸的方式。
         * <p>设置为 <code>BitmapFillMode.CLIP</code>时，位图将在边缘处被截断。</p>
         * <p>设置为 <code>BitmapFillMode.REPEAT</code>时，位图将重复以填充区域。</p>
         * <p>设置为 <code>BitmapFillMode.SCALE</code>时，位图将拉伸以填充区域。</p>
         *
         * @default <code>BitmapFillMode.SCALE</code>
         * @language zh_CN
         */
        public get fillMode(): string {
            return this.$fillMode;
        }

        public set fillMode(value: string) {
            if (value == this.$fillMode) {
                return;
            }
            super.$setFillMode(value);
            this.invalidateDisplayList();
        }

        //if egret
        $setFillMode(value: string): boolean {
            let result: boolean = super.$setFillMode(value);
            this.invalidateDisplayList();

            return result;
        }

        //endif*/

        /**
         * @private
         */
        private sourceChanged: boolean = false;
        /**
         * @private
         */
        private _source: string | egret.Texture = null;
        /**
         * The source used for the bitmap fill. the value can be
         * a string or an instance of <code>egret.Texture</code>
         * @language en_US
         */
        /**
         * 用于位图填充的源。可以是一个字符串或者 <code>egret.Texture</code> 对象
         * @language zh_CN
         */
        public get source(): string | egret.Texture {
            return this._source;
        }

        public set source(value: string | egret.Texture) {
            if (value == this._source) {
                return;
            }
            this._source = value;
            if (this.$stage) {
                this.parseSource();
            }
            else {
                this.sourceChanged = true;
                this.invalidateProperties();
            }
        }

        $setTexture(value: egret.Texture): boolean {
            if (value == this.$texture) {
                return false;
            }
            let result: boolean = super.$setTexture(value);
            this.sourceChanged = false;
            this.invalidateSize();
            this.invalidateDisplayList();

            return result;
        }

        /**
         * @private
         * 解析source
         */
        private parseSource(): void {
            this.sourceChanged = false;
            let source = this._source;
            if (source && typeof source == "string") {

                getAssets(<string>this._source, function (data) {
                    if (source !== this._source)
                        return;
                    if (!egret.is(data, "egret.Texture")) {
                        return;
                    }
                    this.$setTexture(data);
                    if (data) {
                        this.dispatchEventWith(egret.Event.COMPLETE);
                    }
                    else if (DEBUG) {
                        egret.$warn(2301, source);
                    }
                }, this);
            }
            else {
                this.$setTexture(<egret.Texture>source);
            }
        }

        $measureContentBounds(bounds: egret.Rectangle): void {
            let image = this.$texture;
            if (image) {
                let uiValues = this.$UIComponent;
                let width = uiValues[UIKeys.width];
                let height = uiValues[UIKeys.height];
                if (isNaN(width) || isNaN(height)) {
                    bounds.setEmpty();
                    return;
                }
                if (this.$fillMode == "clip") {
                    if (width > image.$getTextureWidth()) {
                        width = image.$getTextureWidth();
                    }
                    if (height > image.$getTextureHeight()) {
                        height = image.$getTextureHeight();
                    }
                }
                bounds.setTo(0, 0, width, height);
            }
            else {
                bounds.setEmpty();
            }
        }

        /**
         * @private
         *
         * @param context
         */
        // $updateRenderNode(): void {
        //     let image = this.$bitmapData;
        //     if (!image) {
        //         return;
        //     }
        //     let uiValues = this.$UIComponent;
        //     let width = uiValues[sys.UIKeys.width];
        //     let height = uiValues[sys.UIKeys.height];
        //     if (width === 0 || height === 0) {
        //         return;
        //     }

        //     let scale9Grid = this.scale9Grid || this.$texture["scale9Grid"];
        //     if (scale9Grid) {
        //         if (this.$renderNode instanceof egret.sys.NormalBitmapNode) {
        //             this.$renderNode = new egret.sys.BitmapNode();
        //         }
        //         egret.sys.BitmapNode.$updateTextureDataWithScale9Grid(<egret.sys.NormalBitmapNode>this.$renderNode, this.$bitmapData, scale9Grid,
        //             this.$bitmapX, this.$bitmapY, this.$bitmapWidth, this.$bitmapHeight,
        //             this.$offsetX, this.$offsetY, this.$textureWidth, this.$textureHeight,
        //             width, height, this.$sourceWidth, this.$sourceHeight, this.$smoothing);
        //     }
        //     else {
        //         if (this.fillMode == egret.BitmapFillMode.REPEAT && this.$renderNode instanceof egret.sys.NormalBitmapNode) {
        //             this.$renderNode = new egret.sys.BitmapNode();
        //         }
        //         egret.sys.BitmapNode.$updateTextureData(<egret.sys.NormalBitmapNode>this.$renderNode, this.$bitmapData,
        //             this.$bitmapX, this.$bitmapY, this.$bitmapWidth, this.$bitmapHeight,
        //             this.$offsetX, this.$offsetY, this.$textureWidth, this.$textureHeight,
        //             width, height, this.$sourceWidth, this.$sourceHeight, this.$fillMode, this.$smoothing);
        //     }
        // }

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
            if (this.sourceChanged) {
                this.parseSource();
            }
        }
        /**
         * @private
         * 设置组件的宽高。此方法不同于直接设置width,height属性，
         * 不会影响显式标记尺寸属性
         */
        protected setActualSize(w: number, h: number): void {
            UIComponentImpl.prototype["setActualSize"].call(this, w, h);
            super.$setWidth(w);
            super.$setHeight(h);
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
            UIComponentImpl.prototype["commitProperties"].call(this);
            if (this.sourceChanged) {
                this.parseSource();
            }
        }

        /**
         * @copy eui.UIComponent#measure
         */
        protected measure(): void {
            let texture = this.$texture;
            if (texture) {
                this.setMeasuredSize(texture.$getTextureWidth(), texture.$getTextureHeight());
            }
            else {
                this.setMeasuredSize(0, 0);
            }
        }

        /**
         * @copy eui.UIComponent#updateDisplayList
         */
        protected updateDisplayList(unscaledWidth: number, unscaledHeight: number): void {
            this.$renderDirty = true;
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
implementUIComponent(Image, egret.Bitmap);
registerProperty(Image, "scale9Grid", "egret.Rectangle");