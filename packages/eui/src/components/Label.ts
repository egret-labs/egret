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

namespace eui {

    let UIImpl = sys.UIComponentImpl;
    /**
     * Label is an UIComponent that can render one or more lines of text.
     * The text to be displayed is determined by the <code>text</code> property.
     * The formatting of the text is specified by the styles，
     * such as <code>fontFamily</code> and <code>size</code>.
     *
     * <p>Because Label is fast and lightweight, it is especially suitable
     * for use cases that involve rendering many small pieces of non-interactive
     * text, such as item renderers and labels in Button skins.</p>
     *
     * <p>In Label, three character sequences are recognized
     * as explicit line breaks: CR (<code>"\r"</code>), LF (<code>"\n"</code>),
     * and CR+LF (<code>"\r\n"</code>).</p>
     *
     * <p>If you don't specify any kind of width for a Label,
     * then the longest line, as determined by these explicit line breaks,
     * determines the width of the Label.</p>
     *
     * <p>If you do specify some kind of width, then the specified text is
     * word-wrapped at the right edge of the component's bounds.
     * If the text extends below the bottom of the component,
     * it is clipped.</p>
     * @includeExample  extension/eui/components/LabelExample.ts
     * @language en_US
     */
    /**
     * Label 是可以呈示一行或多行统一格式文本的UI组件。要显示的文本由 text 属性确定。文本格式由样式属性指定，例如 fontFamily 和 size。
     * 因为 Label 运行速度快且占用内存少，所以它特别适合用于显示多个小型非交互式文本的情况，例如，项呈示器和 Button 外观中的标签。
     * 在 Label 中，将以下三个字符序列识别为显式换行符：CR（“\r”）、LF（“\n”）和 CR+LF（“\r\n”）。
     * 如果没有为 Label 指定宽度，则由这些显式换行符确定的最长行确定 Label 的宽度。
     * 如果指定了宽度，则指定文本将在组件边界的右边缘换行，如果文本扩展到低于组件底部，则将被剪切。
     * @includeExample  extension/eui/components/LabelExample.ts
     * @language zh_CN
     */
    export class Label extends egret.TextField implements UIComponent,IDisplayText {

        /**
         * Constructor.
         *
         * @param text The text displayed by this text component.
         *
         * @version Egret 2.4
         * @version eui 1.0
         * @platform Web,Native
         * @language en_US
         */
        /**
         * 构造函数。
         *
         * @param text 此文本组件所显示的文本。
         *
         * @version Egret 2.4
         * @version eui 1.0
         * @platform Web,Native
         * @language zh_CN
         */
        public constructor(text?:string) {
            super();
            this.initializeUIValues();
            this.text = text;
        }

        /**
         * style中属性是否允许被赋值，当主动赋值过属性之后将不允许被赋值
         */
        private $styleSetMap = {
            "fontFamily": true,
            "size": true,
            "bold": true,
            "italic": true,
            "textAlign": true,
            "verticalAlign": true,
            "lineSpacing": true,
            "textColor": true,
            "wordWrap": true,
            "displayAsPassword": true,
            "strokeColor": true,
            "stroke": true,
            "maxChars": true,
            "multiline": true,
            "border": true,
            "borderColor": true,
            "background": true,
            "backgroundColor": true
        };
        private $revertStyle = {};
        private $style: string = null;

        private $changeFromStyle:boolean = false;

        /**
         * The style of text.
         * @language en_US
         */
        /**
         * 文本样式。
         * @language zh_CN
         */
        public get style(): string {
            return this.$style;
        }

        public set style(value: string) {
            this.$setStyle(value);
        }

        $setStyle(value: string) {
            if (this.$style == value) {
                return;
            }
            this.$style = value;
            let theme: Theme = egret.getImplementation("eui.Theme");
            if (theme) {
                this.$changeFromStyle = true;
                for (let key in this.$revertStyle) {
                    this[key] = this.$revertStyle[key];
                }
                this.$revertStyle = {};
                if (value == null) {
                    this.$changeFromStyle = false;
                    return;
                }
                let styleList = value.split(",");
                for (let i = 0; i < styleList.length; i++) {
                    let config = theme.$getStyleConfig(styleList[i]);
                    if (config) {
                        for (let key in config) {
                            if (this.$styleSetMap[key]) {
                                let revertValue = this[key];
                                this[key] = config[key];
                                this.$revertStyle[key] = revertValue;
                            }
                        }
                    }
                }
                this.$changeFromStyle = false;
            }
        }

        $setFontFamily(value: string): boolean {
            if (!this.$changeFromStyle) {
                delete this.$revertStyle["fontFamily"];
                this.$styleSetMap["fontFamily"] = false;
            }
            return super.$setFontFamily(value);
        }

        $setSize(value: number): boolean {
            if (!this.$changeFromStyle) {
                delete this.$revertStyle["size"];
                this.$styleSetMap["size"] = false;
            }
            return super.$setSize(value);
        }

        $setBold(value: boolean): boolean {
            if (!this.$changeFromStyle) {
                delete this.$revertStyle["bold"];
                this.$styleSetMap["bold"] = false;
            }
            return super.$setBold(value);
        }

        $setItalic(value: boolean): boolean {
            if (!this.$changeFromStyle) {
                delete this.$revertStyle["italic"];
                this.$styleSetMap["italic"] = false;
            }
            return super.$setItalic(value);
        }

        $setTextAlign(value: string): boolean {
            if (!this.$changeFromStyle) {
                delete this.$revertStyle["textAlign"];
                this.$styleSetMap["textAlign"] = false;
            }
            return super.$setTextAlign(value);
        }

        $setVerticalAlign(value: string): boolean {
            if (!this.$changeFromStyle) {
                delete this.$revertStyle["verticalAlign"];
                this.$styleSetMap["verticalAlign"] = false;
            }
            return super.$setVerticalAlign(value);
        }

        $setLineSpacing(value: number): boolean {
            if (!this.$changeFromStyle) {
                delete this.$revertStyle["lineSpacing"];
                this.$styleSetMap["lineSpacing"] = false;
            }
            return super.$setLineSpacing(value);
        }

        $setTextColor(value: number): boolean {
            if (!this.$changeFromStyle) {
                delete this.$revertStyle["textColor"];
                this.$styleSetMap["textColor"] = false;
            }
            return super.$setTextColor(value);
        }

        $setWordWrap(value: boolean): void {
            if (!this.$changeFromStyle) {
                delete this.$revertStyle["wordWrap"];
                this.$styleSetMap["wordWrap"] = false;
            }
            super.$setWordWrap(value);
        }

        $setDisplayAsPassword(value: boolean): boolean {
            if (!this.$changeFromStyle) {
                delete this.$revertStyle["displayAsPassword"];
                this.$styleSetMap["displayAsPassword"] = false;
            }
            return super.$setDisplayAsPassword(value);
        }

        $setStrokeColor(value: number): boolean {
            if (!this.$changeFromStyle) {
                delete this.$revertStyle["strokeColor"];
                this.$styleSetMap["strokeColor"] = false;
            }
            return super.$setStrokeColor(value);
        }

        $setStroke(value: number): boolean {
            if (!this.$changeFromStyle) {
                delete this.$revertStyle["stroke"];
                this.$styleSetMap["stroke"] = false;
            }
            return super.$setStroke(value);
        }

        $setMaxChars(value: number): boolean {
            if (!this.$changeFromStyle) {
                delete this.$revertStyle["maxChars"];
                this.$styleSetMap["maxChars"] = false;
            }
            return super.$setMaxChars(value);
        }

        $setMultiline(value: boolean): boolean {
            if (!this.$changeFromStyle) {
                delete this.$revertStyle["multiline"];
                this.$styleSetMap["multiline"] = false;
            }
            return super.$setMultiline(value);
        }

        $setBorder(value: boolean): void {
            if (!this.$changeFromStyle) {
                delete this.$revertStyle["border"];
                this.$styleSetMap["border"] = false;
            }
            super.$setBorder(value);
        }

        $setBorderColor(value: number): void {
            if (!this.$changeFromStyle) {
                delete this.$revertStyle["borderColor"];
                this.$styleSetMap["borderColor"] = false;
            }
            super.$setBorderColor(value);
        }

        $setBackground(value: boolean): void {
            if (!this.$changeFromStyle) {
                delete this.$revertStyle["background"];
                this.$styleSetMap["background"] = false;
            }
            super.$setBackground(value);
        }

        $setBackgroundColor(value: number): void {
            if (!this.$changeFromStyle) {
                delete this.$revertStyle["backgroundColor"];
                this.$styleSetMap["backgroundColor"] = false;
            }
            super.$setBackgroundColor(value);
        }

        /**
         * @private
         *
         */
        $invalidateTextField():void {
            super.$invalidateTextField();
            this.invalidateSize();
        }

        /**
         * @private
         *
         * @param value
         */
        $setWidth(value:number):boolean {
            let result1:boolean = super.$setWidth(value);
            let result2:boolean = UIImpl.prototype.$setWidth.call(this, value);
            return result1 && result2;
        }

        /**
         * @private
         *
         * @param value
         */
        $setHeight(value:number):boolean {
            let result1:boolean = super.$setHeight(value);
            let result2:boolean = UIImpl.prototype.$setHeight.call(this, value);
            return result1 && result2;
        }

        /**
         * @private
         *
         * @param value
         */
        $setText(value:string):boolean {
            let result:boolean = super.$setText(value);
            PropertyEvent.dispatchPropertyEvent(this, PropertyEvent.PROPERTY_CHANGE, "text");
            return result;
        }

        /**
         * @private
         */
        private _widthConstraint:number = NaN;


        //=======================UIComponent接口实现===========================
        /**
         * @private
         * UIComponentImpl 定义的所有变量请不要添加任何初始值，必须统一在此处初始化。
         */
        private initializeUIValues:()=>void;

        /**
         * @copy eui.UIComponent#createChildren
         */
        protected createChildren():void {

        }

        /**
         * @copy eui.UIComponent#childrenCreated
         */
        protected childrenCreated():void {

        }

        /**
         * @copy eui.UIComponent#commitProperties
         */
        protected commitProperties():void {

        }
        /**
         * @copy eui.UIComponent#measure
         */
        protected measure():void {
            let values = this.$UIComponent;
            let textValues = this.$TextField;
            let oldWidth = textValues[egret.sys.TextKeys.textFieldWidth];
            let availableWidth = NaN;
            if (!isNaN(this._widthConstraint)) {
                availableWidth = this._widthConstraint;
                this._widthConstraint = NaN;
            }
            else if (!isNaN(values[sys.UIKeys.explicitWidth])) {
                availableWidth = values[sys.UIKeys.explicitWidth];
            }
            else if (values[sys.UIKeys.maxWidth] != 100000) {
                availableWidth = values[sys.UIKeys.maxWidth];
            }

            super.$setWidth(availableWidth);
            this.setMeasuredSize(this.textWidth, this.textHeight);
            super.$setWidth(oldWidth);
        }

        /**
         * @copy eui.UIComponent#updateDisplayList
         */
        protected updateDisplayList(unscaledWidth:number, unscaledHeight:number):void {
            super.$setWidth(unscaledWidth);
            super.$setHeight(unscaledHeight);
        }

        /**
         * @copy eui.UIComponent#invalidateParentLayout
         */
        protected invalidateParentLayout():void {
        }

        /**
         * @private
         */
        $UIComponent:Object;

        /**
         * @private
         */
        $includeInLayout:boolean;

        /**
         * @copy eui.UIComponent#includeInLayout
         */
        public includeInLayout:boolean;
        /**
         * @copy eui.UIComponent#left
         */
        public left:any;

        /**
         * @copy eui.UIComponent#right
         */
        public right:any;

        /**
         * @copy eui.UIComponent#top
         */
        public top:any;

        /**
         * @copy eui.UIComponent#bottom
         */
        public bottom:any;

        /**
         * @copy eui.UIComponent#horizontalCenter
         */
        public horizontalCenter:any;

        /**
         * @copy eui.UIComponent#verticalCenter
         */
        public verticalCenter:any;

        /**
         * @copy eui.UIComponent#percentWidth
         */
        public percentWidth:number;

        /**
         * @copy eui.UIComponent#percentHeight
         */
        public percentHeight:number;

        /**
         * @copy eui.UIComponent#explicitWidth
         */
        public explicitWidth:number;

        /**
         * @copy eui.UIComponent#explicitHeight
         */
        public explicitHeight:number;


        /**
         * @copy eui.UIComponent#minWidth
         */
        public minWidth:number;
        /**
         * @copy eui.UIComponent#maxWidth
         */
        public maxWidth:number;

        /**
         * @copy eui.UIComponent#minHeight
         */
        public minHeight:number;
        /**
         * @copy eui.UIComponent#maxHeight
         */
        public maxHeight:number;

        /**
         * @inheritDoc
         */
        public setMeasuredSize(width:number, height:number):void {
        }

        /**
         * @inheritDoc
         */
        public invalidateProperties():void {
        }

        /**
         * @inheritDoc
         */
        public validateProperties():void {
        }

        /**
         * @inheritDoc
         */
        public invalidateSize():void {
        }

        /**
         * @inheritDoc
         */
        public validateSize(recursive?:boolean):void {
        }

        /**
         * @inheritDoc
         */
        public invalidateDisplayList():void {
        }

        /**
         * @inheritDoc
         */
        public validateDisplayList():void {
        }

        /**
         * @inheritDoc
         */
        public validateNow():void {
        }

        /**
         * @inheritDoc
         */
        public setLayoutBoundsSize(layoutWidth:number, layoutHeight:number):void {
            UIImpl.prototype.setLayoutBoundsSize.call(this, layoutWidth, layoutHeight);
            if (isNaN(layoutWidth) || layoutWidth === this._widthConstraint || layoutWidth == 0) {
                this._widthConstraint = layoutWidth;
                return;
            }
            this._widthConstraint = layoutWidth;
            let values = this.$UIComponent;
            if (!isNaN(values[sys.UIKeys.explicitHeight])) {
                return;
            }
            if (layoutWidth == values[sys.UIKeys.measuredWidth]) {
                return;
            }
            this.invalidateSize();
        }

        /**
         * @inheritDoc
         */
        public setLayoutBoundsPosition(x:number, y:number):void {
        }

        /**
         * @inheritDoc
         */
        public getLayoutBounds(bounds:egret.Rectangle):void {
        }

        /**
         * @inheritDoc
         */
        public getPreferredBounds(bounds:egret.Rectangle):void {
        }
    }

    sys.implementUIComponent(Label, egret.TextField);
    registerBindable(Label.prototype, "text");
}