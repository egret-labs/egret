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
import { implementUIComponent, UIComponent, UIComponentImpl, UIKeys } from "../core/UIComponent";
import { PropertyEvent } from "../events/PropertyEvent";
import { registerBindable } from "../utils/registerBindable";

export const enum EditableTextKeys {
        promptText,
        textColorUser,
        asPassword
    }
let UIImpl = UIComponentImpl;
export class EditableText extends egret.TextField implements UIComponent, IDisplayText {

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
            this.initializeUIValues();
            this.type = egret.TextFieldType.INPUT;
            this.$EditableText = {
                0: null,         //promptText,
                1: 0xffffff,     //textColorUser,
                2: false         //asPassword
            }
        }
        $EditableText: Object;
        /**
         * @private
         *
         */
        $invalidateTextField(): void {
            super.$invalidateTextField();
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
        $getText(): string {
            let value = super.$getText();
            if (value == this.$EditableText[EditableTextKeys.promptText]) {
                value = "";
            }
            return value;
        }
        /**
         * @private
         *
         * @param value
         */
        $setText(value: string): boolean {
            let promptText = this.$EditableText[EditableTextKeys.promptText];
            if (promptText != value || promptText == null) {
                this.$isShowPrompt = false;
                this.textColor = this.$EditableText[EditableTextKeys.textColorUser];
                this.displayAsPassword = this.$EditableText[EditableTextKeys.asPassword];
            }
            if (!this.$isFocusIn) {
                if (value == "" || value == null) {
                    value = promptText;
                    this.$isShowPrompt = true;
                    super.$setTextColor(this.$promptColor);
                    super.$setDisplayAsPassword(false);
                }
            }
            let result: boolean = super.$setText(value);
            PropertyEvent.dispatchPropertyEvent(this, PropertyEvent.PROPERTY_CHANGE, "text");
            return result;
        }

        /**
         * @private
         */
        private _widthConstraint: number = NaN;
        /**
         * @private
         *
         * @param stage
         * @param nestLevel
         */
        public $onAddToStage(stage: egret.Stage, nestLevel: number): void {
            UIComponentImpl.prototype["$onAddToStage"].call(this, stage, nestLevel);
            this.addEventListener(egret.FocusEvent.FOCUS_IN, this.onfocusIn, this);
            this.addEventListener(egret.FocusEvent.FOCUS_OUT, this.onfocusOut, this);
            this.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.onTouchBegin, this);
            this.addEventListener(egret.TouchEvent.TOUCH_CANCEL, this.onTouchCancle, this);
        }
        /**
         * @private
         *
         */
        public $onRemoveFromStage(): void {
            super.$onRemoveFromStage();
            this.removeEventListener(egret.FocusEvent.FOCUS_IN, this.onfocusIn, this);
            this.removeEventListener(egret.FocusEvent.FOCUS_OUT, this.onfocusOut, this);
            this.removeEventListener(egret.TouchEvent.TOUCH_BEGIN, this.onTouchBegin, this);
            this.removeEventListener(egret.TouchEvent.TOUCH_CANCEL, this.onTouchCancle, this);
        }
        /**
         * @private
         */
        private $isShowPrompt: boolean = false;
        /**
         * When the property of the text is empty, it will show the defalut string.
         * @language en_US
         */
        /**
         * 当text属性为空字符串时要显示的文本内容。
         * 先创建文本控件时将显示提示文本。控件获得焦点时或控件的 text 属性为非空字符串时，提示文本将消失。
         * 控件失去焦点时提示文本将重新显示，但仅当未输入文本时（如果文本字段的值为空字符串）。<p/>
         * 对于文本控件，如果用户输入文本，但随后又将其删除，则控件失去焦点后，提示文本将重新显示。
         * 您还可以通过编程方式将文本控件的 text 属性设置为空字符串使提示文本重新显示。
         * @language zh_CN
         */
        public get prompt(): string {
            return this.$EditableText[EditableTextKeys.promptText];
        }
        public set prompt(value: string) {
            let values = this.$EditableText;
            let promptText = values[EditableTextKeys.promptText];
            if (promptText == value)
                return;
            values[EditableTextKeys.promptText] = value;
            let text = this.text;
            if (!text || text == promptText) {
                this.showPromptText();
            }
        }
        /**
         * @private
         */
        private $promptColor: number = 0x666666;
        /**
         * @private
         */
        private $isFocusIn: boolean = false;
        /**
         * The color of the defalut string.
         * @version Egret 2.5.5
         * @version eui 1.0
         * @platform Web,Native
         * @language en_US
         */
        /**
         * 默认文本的颜色
         * @version Egret 2.5.5
         * @version eui 1.0
         * @platform Web,Native
         * @language zh_CN
         */
        public set promptColor(value: number) {
            value = +value | 0;
            if (this.$promptColor != value) {
                this.$promptColor = value;
                let text = this.text;
                if (!text || text == this.$EditableText[EditableTextKeys.promptText]) {
                    this.showPromptText();
                }
            }
        }
        public get promptColor(): number {
            return this.$promptColor;
        }
        /**
         * @private
         */
        private onfocusOut(): void {
            this.$isFocusIn = false;
            if (!this.text) {
                this.showPromptText();
            }
        }
        /**
         * @private
         */
        private $isTouchCancle: boolean = false;
        /**
         * @private
         */
        private onTouchBegin(): void {
            this.$isTouchCancle = false;
        }
        /**
         * @private
         */
        private onTouchCancle(): void {
            this.$isTouchCancle = true;
        }
        /**
         * @private
         */
        private onfocusIn(): void {
            if (!egret.Capabilities.isMobile && this.$isTouchCancle) {
                this.inputUtils.stageText.$hide();
                return
            }
            this.$isFocusIn = true;
            this.$isShowPrompt = false;
            this.displayAsPassword = this.$EditableText[EditableTextKeys.asPassword];
            let values = this.$EditableText;
            let text = this.text;
            if (!text || text == values[EditableTextKeys.promptText]) {
                this.textColor = values[EditableTextKeys.textColorUser];
                this.text = "";
            }
        }
        /**
         * @private
         */
        private showPromptText(): void {
            let values = this.$EditableText;
            this.$isShowPrompt = true;
            super.$setTextColor(this.$promptColor);
            super.$setDisplayAsPassword(false);
            this.text = values[EditableTextKeys.promptText];
        }
        /**
         * @private
         */
        $setTextColor(value: number): boolean {
            value = +value | 0;
            this.$EditableText[EditableTextKeys.textColorUser] = value;
            if (!this.$isShowPrompt) {
                super.$setTextColor(value);
            }
            return true;
        }
        /**
         * @private
         */
        $setDisplayAsPassword(value: boolean): boolean {
            this.$EditableText[EditableTextKeys.asPassword] = value;
            if (!this.$isShowPrompt) {
                super.$setDisplayAsPassword(value);
            }
            return true;
        }
        //=======================UIComponent接口实现===========================
        /**
         * @private
         * UIComponentImpl 定义的所有变量请不要添加任何初始值，必须统一在此处初始化。
         */
        private initializeUIValues: () => void;

        /**
         * @copy eui.Component#createChildren()
         */
        protected createChildren(): void {
            this.onfocusOut();
        }

        /**
         * @copy eui.Component#childrenCreated()
         */
        protected childrenCreated(): void {

        }

        /**
         * @copy eui.Component#commitProperties()
         */
        protected commitProperties(): void {

        }

        /**
         * @copy eui.Component#measure()
         */
        protected measure(): void {
            let values = this.$UIComponent;
            let textValues = this.$TextField;
            let oldWidth = textValues[egret.sys.TextKeys.textFieldWidth];
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
            this.setMeasuredSize(this.textWidth, this.textHeight);
            super.$setWidth(oldWidth);
        }

        /**
         * @copy eui.Component#updateDisplayList()
         */
        protected updateDisplayList(unscaledWidth: number, unscaledHeight: number): void {
            super.$setWidth(unscaledWidth);
            super.$setHeight(unscaledHeight);
        }

        /**
         * @copy eui.Component#invalidateParentLayout()
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
         * @inheritDoc
         */
        public includeInLayout: boolean;
        /**
         * @inheritDoc
         */
        public left: any;

        /**
         * @inheritDoc
         */
        public right: any;

        /**
         * @inheritDoc
         */
        public top: any;

        /**
         * @inheritDoc
         */
        public bottom: any;

        /**
         * @inheritDoc
         */
        public horizontalCenter: any;

        /**
         * @inheritDoc
         */
        public verticalCenter: any;

        /**
         * @inheritDoc
         */
        public percentWidth: number;

        /**
         * @inheritDoc
         */
        public percentHeight: number;

        /**
         * @inheritDoc
         */
        public explicitWidth: number;

        /**
         * @inheritDoc
         */
        public explicitHeight: number;

        /**
         * @inheritDoc
         */
        public minWidth: number;

        /**
         * @inheritDoc
         */
        public maxWidth: number;

        /**
         * @inheritDoc
         */
        public minHeight: number;

        /**
         * @inheritDoc
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
implementUIComponent(EditableText, egret.TextField);
registerBindable(EditableText.prototype, "text");
