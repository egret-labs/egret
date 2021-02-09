export const enum TextInputKeys {
        prompt,
        displayAsPassword,
        textColor,
        maxChars,
        maxWidth,
        maxHeight,
        text,
        restrict,
        inputType
    }
import { Component } from "./Component";
import { EditableText } from "./EditableText";
import { Label } from "./Label";

import FocusEvent = egret.FocusEvent;
export class TextInput extends Component {
        constructor() {
            super();
            this.$TextInput = {
                0: null,          //prompt,
                1: null,          //displayAsPassword
                2: null,          //textColor
                3: null,          //maxChars
                4: null,          //maxWidth
                5: null,          //maxHeight
                6: "",            //text
                7: null,          //restrict
                8:egret.TextFieldInputType.TEXT //inputType
            }
        }

        /**
         * @private
         */
        $TextInput:Object;
        /**
         * [SkinPart] The TextInput display
         * @skinPart
         * @language en_US
         */
        /**
         * [SkinPart] 实体文本输入组件
         * @skinPart
         * @language zh_CN
         */
        public textDisplay:EditableText;
        /**
         * [SkinPart] When the property of the text is empty, it will show the defalut string.
         * @skinPart
         * @language zh_CN
         */
        /**
         * [SkinPart] 当text属性为空字符串时要显示的文本。
         * @skinPart
         * @language zh_CN
         */
        public promptDisplay:Label;

        /**
         * @copy eui.EditableText#prompt
         */
        public get prompt():string {
            if (this.promptDisplay) {
                return this.promptDisplay.text;
            }
            return this.$TextInput[TextInputKeys.prompt];
        }

        /**
         * @copy eui.EditableText#prompt
         *
         * @version Egret 2.5.7
         * @version eui 1.0
         * @platform Web,Native
         */
        public set prompt(value:string) {
            this.$TextInput[TextInputKeys.prompt] = value;
            if (this.promptDisplay) {
                this.promptDisplay.text = value;
            }
            this.invalidateProperties();
            this.invalidateState();
        }

        /**
         * @copy egret.TextField#displayAsPassword
         */
        public get displayAsPassword(): boolean {
            if (this.textDisplay) {
                return this.textDisplay.displayAsPassword;
            }
            let v = this.$TextInput[TextInputKeys.displayAsPassword];
            return v ? v : false;
        }

        /**
         * @copy egret.TextField#displayAsPassword
         *
         * @version Egret 2.5.7
         * @version eui 1.0
         * @platform Web,Native
         */
        public set displayAsPassword(value: boolean) {
            this.$TextInput[TextInputKeys.displayAsPassword] = value;
            if (this.textDisplay) {
                this.textDisplay.displayAsPassword = value;
            }
            this.invalidateProperties();
        }
        /**
         * @copy egret.TextField#inputType
         *
         * @version Egret 3.1.6
         * @version eui 1.0
         * @platform Web,Native
         */
        public set inputType(value: string) {
            this.$TextInput[TextInputKeys.inputType] = value;
            if (this.textDisplay) {
                this.textDisplay.inputType = value;
            }
            this.invalidateProperties();
        }
        /**
         * @copy egret.TextField#inputType
         */
        public get inputType(): string {
            if (this.textDisplay) {
                return this.textDisplay.inputType;
            }
            return this.$TextInput[TextInputKeys.inputType];
        }


        /**
         * @copy egret.TextField#textColor
         */
        public get textColor():number {
            if (this.textDisplay) {
                return this.textDisplay.textColor;
            }
            return this.$TextInput[TextInputKeys.textColor];
        }

        /**
         * @copy egret.TextField#textColor
         *
         * @version Egret 2.5.7
         * @version eui 1.0
         * @platform Web,Native
         */
        public set textColor(value:number) {
            this.$TextInput[TextInputKeys.textColor] = value;
            if (this.textDisplay) {
                this.textDisplay.textColor = value;
            }
            this.invalidateProperties();
        }

        /**
         * @copy egret.TextField#maxChars
         */
        public get maxChars():number {
            if (this.textDisplay) {
                return this.textDisplay.maxChars;
            }
            let v = this.$TextInput[TextInputKeys.maxChars];
            return v ? v : 0;
        }

        /**
         * @copy egret.TextField#maxChars
         *
         * @version Egret 2.5.7
         * @version eui 1.0
         * @platform Web,Native
         */
        public set maxChars(value:number) {
            this.$TextInput[TextInputKeys.maxChars] = value;
            if (this.textDisplay) {
                this.textDisplay.maxChars = value;
            }
            this.invalidateProperties();
        }

        /**
         * @inheritDoc
         */
        public get maxWidth():number {
            if (this.textDisplay) {
                return this.textDisplay.maxWidth;
            }
            let v = this.$TextInput[TextInputKeys.maxWidth];
            return v ? v : 100000;
        }

        /**
         * @inheritDoc
         *
         * @version Egret 2.5.7
         * @version eui 1.0
         * @platform Web,Native
         */
        public set maxWidth(value:number) {
            this.$TextInput[TextInputKeys.maxWidth] = value;
            if (this.textDisplay) {
                this.textDisplay.maxWidth = value;
            }
            this.invalidateProperties();
        }

        /**
         * @inheritDoc
         */
        public get maxHeight():number {
            if (this.textDisplay) {
                //return this.textDisplay.maxHeight;
            }
            let v = this.$TextInput[TextInputKeys.maxHeight];
            return v ? v : 100000;
        }

        /**
         * @inheritDoc
         *
         * @version Egret 2.5.7
         * @version eui 1.0
         * @platform Web,Native
         */
        public set maxHeight(value:number) {
            this.$TextInput[TextInputKeys.maxHeight] = value;
            if (this.textDisplay) {
                this.textDisplay.maxHeight = value;
            }
            this.invalidateProperties();
        }

        /**
         * @copy egret.TextField#text
         */
        public get text():string {
            if (this.textDisplay) {
                return this.textDisplay.text;
            }
            return this.$TextInput[TextInputKeys.text];
        }

        /**
         * @copy egret.TextField#text
         *
         * @version Egret 2.5.7
         * @version eui 1.0
         * @platform Web,Native
         */
        public set text(value:string) {
            this.$TextInput[TextInputKeys.text] = value;
            if (this.textDisplay) {
                this.textDisplay.text = value;
            }
            this.invalidateProperties();
            this.invalidateState();
        }

        /**
         * @copy egret.TextField#restrict
         */
        public get restrict():string {
            if (this.textDisplay) {
                return this.textDisplay.restrict;
            }
            return this.$TextInput[TextInputKeys.restrict];
        }

        /**
         * @copy egret.TextField#restrict
         *
         * @version Egret 2.5.7
         * @version eui 1.0
         * @platform Web,Native
         */
        public set restrict(value:string) {
            this.$TextInput[TextInputKeys.restrict] = value;
            if (this.textDisplay) {
                this.textDisplay.restrict = value;
            }
            this.invalidateProperties();
        }

        /**
         * @private
         */
        private isFocus:boolean = false;

        /**
         * @private
         * 焦点移入
         */
        private focusInHandler(event:FocusEvent):void {
            this.isFocus = true;
            this.invalidateState();
        }

        /**
         * @private
         * 焦点移出
         */
        private focusOutHandler(event:FocusEvent):void {
            this.isFocus = false;
            this.invalidateState();
        }

        /**
         * @inheritDoc
         */
        protected getCurrentState():string {
            let skin = this.skin;
            if (this.prompt && !this.isFocus && !this.text) {
                if (this.enabled && skin.hasState("normalWithPrompt")) {
                    return "normalWithPrompt";
                }
                else if (!this.enabled && skin.hasState("disabledWithPrompt")) {
                    return "disabledWithPrompt";
                }
            }
            else {
                if (this.enabled) {
                    return "normal";
                }
                else {
                    return "disabled";
                }
            }
        }

        /**
         * @inheritDoc
         */
        protected partAdded(partName:string, instance:any):void {
            super.partAdded(partName, instance);
            let values = this.$TextInput;
            if (instance == this.textDisplay) {
                this.textDisplayAdded();
                if (this.textDisplay instanceof EditableText) {
                    this.textDisplay.addEventListener(FocusEvent.FOCUS_IN, this.focusInHandler, this);
                    this.textDisplay.addEventListener(FocusEvent.FOCUS_OUT, this.focusOutHandler, this);
                }
            }
            else if (instance == this.promptDisplay) {
                if (values[TextInputKeys.prompt]) {
                    this.promptDisplay.text = values[TextInputKeys.prompt];
                }
            }
        }

        /**
         * @inheritDoc
         */
        protected partRemoved(partName:string, instance:any):void {
            super.partRemoved(partName, instance);
            if (instance == this.textDisplay) {
                this.textDisplayRemoved();
                if (this.textDisplay instanceof EditableText) {
                    this.textDisplay.removeEventListener(FocusEvent.FOCUS_IN, this.focusInHandler, this);
                    this.textDisplay.removeEventListener(FocusEvent.FOCUS_OUT, this.focusOutHandler, this);
                }
            }
            else if (instance == this.promptDisplay) {
                this.$TextInput[TextInputKeys.prompt] = this.promptDisplay.text
            }
        }

        /**
         * @private
         */
        private textDisplayAdded():void {
            let values = this.$TextInput;
            if (values[TextInputKeys.displayAsPassword]) {
                this.textDisplay.displayAsPassword = values[TextInputKeys.displayAsPassword];
            }
            if (values[TextInputKeys.textColor]) {
                this.textDisplay.textColor = values[TextInputKeys.textColor];
            }
            if (values[TextInputKeys.maxChars]) {
                this.textDisplay.maxChars = values[TextInputKeys.maxChars];
            }
            if (values[TextInputKeys.maxWidth]) {
                this.textDisplay.maxWidth = values[TextInputKeys.maxWidth];
            }
            if (values[TextInputKeys.maxHeight]) {
                this.textDisplay.maxHeight = values[TextInputKeys.maxHeight];
            }
            if (values[TextInputKeys.text]) {
                this.textDisplay.text = values[TextInputKeys.text];
            }
            if (values[TextInputKeys.restrict]) {
                this.textDisplay.restrict = values[TextInputKeys.restrict];
            }
            if (values[TextInputKeys.inputType]) {
                this.textDisplay.inputType = values[TextInputKeys.inputType];
            }
        }
        /**
         * @private
         */
        private textDisplayRemoved() {
            let values = this.$TextInput;
            values[TextInputKeys.displayAsPassword] = this.textDisplay.displayAsPassword;
            values[TextInputKeys.textColor] = this.textDisplay.textColor;
            values[TextInputKeys.maxChars] = this.textDisplay.maxChars;
            values[TextInputKeys.maxWidth] = this.textDisplay.maxWidth;
            values[TextInputKeys.maxHeight] = this.textDisplay.maxHeight;
            values[TextInputKeys.text] = this.textDisplay.text;
            values[TextInputKeys.restrict] = this.textDisplay.restrict;
            values[TextInputKeys.inputType] = this.textDisplay.inputType;
        }
    }
