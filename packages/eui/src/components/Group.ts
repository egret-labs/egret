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

/// <reference path="../states/State.ts" />
/// <reference path="../core/UIComponent.ts" />
/// <reference path="../utils/registerProperty.ts" />

import { IViewport } from "../core/IViewport";
import { UIKeys, UIComponentImpl, implementUIComponent, mixin } from "../core/UIComponent";
import { PropertyEvent } from "../events/PropertyEvent";
import { BasicLayout } from "../layouts/BasicLayout";
import { LayoutBase } from "../layouts/supportClasses/LayoutBase";
import { State, StateClient, StateValues } from "../states/State";
import { registerProperty } from "../utils/registerProperty";

const enum Keys{
        contentWidth,
        contentHeight,
        scrollH,
        scrollV,
        scrollEnabled,
        touchThrough
    }
export class Group extends egret.DisplayObjectContainer implements IViewport {

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
            this.initializeUIValues();
            this.$Group = {
                0: 0,        //contentWidth,
                1: 0,        //contentHeight,
                2: 0,        //scrollH,
                3: 0,        //scrollV,
                4: false,    //scrollEnabled,
                5: false,    //touchThrough
            };
            this.$stateValues.parent = this;
        }

        $Group:Object;

        /**
         * This property is Usually invoked in resolving an EXML for adding multiple children quickly.
         *
         * @version Egret 2.4
         * @version eui 1.0
         * @platform Web,Native
         * @language en_US
         */
        /**
         * 此属性通常在 EXML 的解析器中调用，便于快速添加多个子项。
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
         * @private
         */
        $layout:LayoutBase = null;

        /**
         * The layout object for this container.
         * This object is responsible for the measurement and layout of
         * the UIcomponent in the container.
         *
         * @default eui.BasicLayout
         * @language en_US
         */
        /**
         * 此容器的布局对象。
         *
         * s@default eui.BasicLayout
         * @language zh_CN
         */
        public get layout():LayoutBase {
            return this.$layout;
        }

        public set layout(value:LayoutBase) {
            this.$setLayout(value);
        }

        /**
         * @private
         *
         * @param value
         */
        $setLayout(value:LayoutBase):boolean {
            if (this.$layout == value)
                return false;
            if (this.$layout) {
                this.$layout.target = null;
            }

            this.$layout = value;

            if (value) {
                value.target = this;
            }
            this.invalidateSize();
            this.invalidateDisplayList();

            return true;
        }

        /**
         * @copy eui.IViewport#contentWidth
         */
        public get contentWidth():number {
            return this.$Group[Keys.contentWidth];
        }

        /**
         * @copy eui.IViewport#contentHeight
         */
        public get contentHeight():number {
            return this.$Group[Keys.contentHeight];
        }

        /**
         *
         * Sets the <code>contentWidth</code> and <code>contentHeight</code>
         * properties.
         *
         * This method is intended for layout class developers who should
         * call it from <code>updateDisplayList()</code> methods.
         *
         * @param width The new value of <code>contentWidth</code>.
         * @param height The new value of <code>contentHeight</code>.
         * @language en_US
         */
        /**
         *
         * 设置 <code>contentWidth</code> 和 <code>contentHeight</code> 属性。
         * 此方法由布局来调用，开发者应该在布局类的 <code>updateDisplayList()</code> 方法中对其进行调用。
         *
         * @param width <code>contentWidth</code> 的新值。
         * @param height <code>contentHeight</code> 的新值。
         * @language zh_CN
         */
        public setContentSize(width:number, height:number):void {
            width = Math.ceil(+width || 0);
            height = Math.ceil(+height || 0);
            let values = this.$Group;
            let wChange = (values[Keys.contentWidth] !== width);
            let hChange = (values[Keys.contentHeight] !== height);
            if (!wChange && !hChange) {
                return;
            }
            values[Keys.contentWidth] = width;
            values[Keys.contentHeight] = height;
            if (wChange) {
                PropertyEvent.dispatchPropertyEvent(this, PropertyEvent.PROPERTY_CHANGE, "contentWidth");
            }
            if (hChange) {
                PropertyEvent.dispatchPropertyEvent(this, PropertyEvent.PROPERTY_CHANGE, "contentHeight");
            }
        }
        /**
         * @copy eui.IViewport#scrollEnabled
         */
        public get scrollEnabled():boolean {
            return this.$Group[Keys.scrollEnabled];
        }

        public set scrollEnabled(value:boolean) {
            value = !!value;
            let values = this.$Group;
            if (value === values[Keys.scrollEnabled])
                return;
            values[Keys.scrollEnabled] = value;
            this.updateScrollRect();
        }

        /**
         * @copy eui.IViewport#scrollH
         */
        public get scrollH():number {
            return this.$Group[Keys.scrollH];
        }

        public set scrollH(value:number) {
            value = +value || 0;
            let values = this.$Group;
            if (value === values[Keys.scrollH])
                return;
            values[Keys.scrollH] = value;
            if (this.updateScrollRect() && this.$layout) {
                this.$layout.scrollPositionChanged();
            }
            PropertyEvent.dispatchPropertyEvent(this, PropertyEvent.PROPERTY_CHANGE, "scrollH");
        }

        /**
         * @copy eui.IViewport#scrollV
         */
        public get scrollV():number {
            return this.$Group[Keys.scrollV];
        }

        public set scrollV(value:number) {
            value = +value || 0;
            let values = this.$Group;
            if (value == values[Keys.scrollV])
                return;
            values[Keys.scrollV] = value;
            if (this.updateScrollRect() && this.$layout) {
                this.$layout.scrollPositionChanged();
            }
            PropertyEvent.dispatchPropertyEvent(this, PropertyEvent.PROPERTY_CHANGE, "scrollV");
        }

        /**
         * @private
         *
         * @returns
         */
        private updateScrollRect():boolean {
            let values = this.$Group;
            let hasClip = values[Keys.scrollEnabled];
            if (hasClip) {
                let uiValues = this.$UIComponent;
                this.scrollRect = egret.$TempRectangle.setTo(values[Keys.scrollH],
                    values[Keys.scrollV],
                    uiValues[UIKeys.width], uiValues[UIKeys.height]);
            }
            else if (this.$scrollRect) {
                this.scrollRect = null;
            }
            return hasClip;
        }

        /**
         * The number of layout element in this container.
         * @language en_US
         */
        /**
         * 布局元素子项的数量。
         * @language zh_CN
         */
        public get numElements():number {
            return this.$children.length;
        }

        /**
         * Returns the layout element at the specified index.
         * @language en_US
         */
        /**
         * 获取一个布局元素子项。
         * @language zh_CN
         */
        public getElementAt(index:number):egret.DisplayObject {
            return this.$children[index];
        }
        public getVirtualElementAt(index:number):egret.DisplayObject{
            return this.getElementAt(index);
        }

        /**
         * Set the index range of the sub Visual element in container which support virtual layout.
         * This method is invalid in container which do not support virtual layout.
         * This method is usually invoked before layout. Override this method to release the invisible elements.
         *
         * @param startIndex the start index of sub visual elements（include）
         * @param endIndex the end index of sub visual elements（include）
         * @language en_US
         */
        /**
         * 在支持虚拟布局的容器中，设置容器内可见的子元素索引范围。此方法在不支持虚拟布局的容器中无效。
         * 通常在即将重新布局子项之前会被调用一次，容器覆盖此方法提前释放已经不可见的子元素。
         *
         * @param startIndex 可视元素起始索引（包括）
         * @param endIndex 可视元素结束索引（包括）
         * @language zh_CN
         */
        public setVirtualElementIndicesInView(startIndex:number, endIndex:number):void {

        }

        /**
         * When <code>true</code>, this property
         * ensures that the entire bounds of the Group respond to
         * touch events such as begin.
         * @language en_US
         */
        /**
         * 触摸组件的背景透明区域是否可以穿透。设置为true表示可以穿透，反之透明区域也会响应触摸事件。默认 false。
         * @language zh_CN
         */
        public get touchThrough():boolean{
            return this.$Group[Keys.touchThrough];
        }

        public set touchThrough(value:boolean){
            this.$Group[Keys.touchThrough] = !!value;
        }

        /**
         * @private
         */
        $hitTest(stageX:number, stageY:number):egret.DisplayObject {
            let target = super.$hitTest(stageX, stageY);
            if (target || this.$Group[Keys.touchThrough]) {
                return target;
            }
            //Bug: 当 group.sacleX or scaleY ==0 的时候，随便点击那里都点击成功
            //虽然 super.$hitTest里面检测过一次 宽高大小，但是没有直接退出这个函数，所以要再判断一次;（width,height可以不判断）
            if (!this.$visible || !this.touchEnabled || this.scaleX === 0 || this.scaleY === 0 || this.width === 0 || this.height === 0) {
                return null;
            }
            let point = this.globalToLocal(stageX, stageY, egret.$TempPoint);
            let values = this.$UIComponent;
            let bounds = egret.$TempRectangle.setTo(0, 0, values[UIKeys.width], values[UIKeys.height]);
            let scrollRect = this.$scrollRect;
            if(scrollRect){
                bounds.x = scrollRect.x;
                bounds.y = scrollRect.y;
            }
            if (bounds.contains(point.x, point.y)) {
                return this;
            }
            return null;
        }


        /**
         * @private
         */
        $stateValues:StateValues = new StateValues();

        /**
         * The list of state for this component.
         * @language en_US
         */
        /**
         * 为此组件定义的视图状态。
         * @language zh_CN
         */
        public states:State[];

        /**
         * @copy eui.Component#currentState
         */
        public currentState:string;

        /**
         * @copy eui.Skin#hasState()
         */
        public hasState:(stateName:string)=>boolean;
        /**
         * @private
         * 初始化所有视图状态
         */
        private initializeStates:(stage:egret.Stage)=>void;
        /**
         * @private
         * 应用当前的视图状态。子类覆盖此方法在视图状态发生改变时执行相应更新操作。
         */
        private commitCurrentState:()=>void;

        /**
         * @copy eui.Component#invalidateState()
         */
        public invalidateState():void {
            let values = this.$stateValues;
            if (values.stateIsDirty) {
                return;
            }
            values.stateIsDirty = true;
            this.invalidateProperties();
        }

        /**
         * @copy eui.Component#getCurrentState()
         */
        protected getCurrentState():string {
            return "";
        }


        //=======================UIComponent接口实现===========================
        /**
         * @private
         * UIComponentImpl 定义的所有变量请不要添加任何初始值，必须统一在此处初始化。
         */
        private initializeUIValues:()=>void;

        /**
         * @copy eui.Component#createChildren()
         */
        protected createChildren():void {
            if (!this.$layout) {
                this.$setLayout(new BasicLayout());
            }
            this.initializeStates(this.$stage);
        }

        /**
         * @copy eui.Component#childrenCreated()
         */
        protected childrenCreated():void {

        }

        /**
         * @copy eui.Component#commitProperties()
         */
        protected commitProperties():void {
            UIComponentImpl.prototype["commitProperties"].call(this);
            let values = this.$stateValues;
            if (values.stateIsDirty) {
                values.stateIsDirty = false;
                if (!values.explicitState) {
                    values.currentState = this.getCurrentState();
                    this.commitCurrentState();
                }
            }
        }

        /**
         * @copy eui.Component#measure()
         */
        protected measure():void {
            if (!this.$layout) {
                this.setMeasuredSize(0, 0);
                return;
            }
            this.$layout.measure();
        }

        /**
         * @copy eui.Component#updateDisplayList()
         */
        protected updateDisplayList(unscaledWidth:number, unscaledHeight:number):void {
            if (this.$layout) {
                this.$layout.updateDisplayList(unscaledWidth, unscaledHeight);
            }
            this.updateScrollRect();
        }


        /**
         * @copy eui.Component#invalidateParentLayout()
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
         * @inheritDoc
         */
        public includeInLayout:boolean;

        /**
         * @inheritDoc
         */
        public left:any;

        /**
         * @inheritDoc
         */
        public right:any;

        /**
         * @inheritDoc
         */
        public top:any;

        /**
         * @inheritDoc
         */
        public bottom:any;

        /**
         * @inheritDoc
         */
        public horizontalCenter:any;

        /**
         * @inheritDoc
         */
        public verticalCenter:any;

        /**
         * @inheritDoc
         */
        public percentWidth:number;

        /**
         * @inheritDoc
         */
        public percentHeight:number;

        /**
         * @inheritDoc
         */
        public explicitWidth:number;

        /**
         * @inheritDoc
         */
        public explicitHeight:number;


        /**
         * @inheritDoc
         */
        public minWidth:number;

        /**
         * @inheritDoc
         */
        public maxWidth:number;

        /**
         * @inheritDoc
         */
        public minHeight:number;

        /**
         * @inheritDoc
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
implementUIComponent(Group, egret.DisplayObjectContainer, true);
mixin(Group, StateClient);
registerProperty(Group, "elementsContent", "Array", true);
registerProperty(Group, "states", "State[]");
