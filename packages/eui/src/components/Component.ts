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
/// <reference path="../utils/registerProperty.ts" />

import { implementUIComponent, UIComponent, UIComponentImpl, UIKeys } from "../core/UIComponent";
import { measure, updateDisplayList } from "../layouts/BasicLayout";
import { registerProperty } from "../utils/registerProperty";
import { Skin } from "./Skin";

export const enum ComponentKeys {
    hostComponentKey,
    skinName,
    explicitState,
    enabled,
    stateIsDirty,
    skinNameExplicitlySet,
    explicitTouchChildren,
    explicitTouchEnabled,
    skin
}
export class Component extends egret.DisplayObjectContainer implements UIComponent {
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
        this.$Component = {
            0: null,         //hostComponentKey,
            1: null,         //skinName,
            2: "",           //explicitState,
            3: true,         //enabled,
            4: false,        //stateIsDirty,
            5: false,        //skinNameExplicitlySet,
            6: true,        //explicitTouchChildren,
            7: true,        //explicitTouchEnabled
            8: null          //skin
        };
        //if egret
        this.$touchEnabled = true;
        //endif*/
    }

    $Component: Object;

    /**
     * A identifier of host component which can determine only one component names.
     * Usually used for quering a default skin name in theme.
     * @default null
     * @see eui.Theme#getSkinName()
     * @language en_US
     */
    /**
     * 主机组件标识符。用于唯一确定一个组件的名称。通常用于在主题中查询默认皮肤名。
     *
     * @default null
     * @see eui.Theme#getSkinName()
     * @language zh_CN
     */
    public get hostComponentKey(): string {
        return this.$Component[ComponentKeys.hostComponentKey];
    }

    public set hostComponentKey(value: string) {
        this.$Component[ComponentKeys.hostComponentKey] = value;
    }

    /**
     * Identifier of skin. Valid values: class definition of skin,
     * class name of skin, instance of skin, EXML or external EXML file path.
     * @language en_US
     */
    /**
     * 皮肤标识符。有效值可为：皮肤类定义,皮肤类名,皮肤实例,EXML文件内容,或外部EXML文件路径，
     * @language zh_CN
     */
    public get skinName(): any {
        return this.$Component[ComponentKeys.skinName];
    }

    public set skinName(value: any) {
        let values = this.$Component;
        values[ComponentKeys.skinNameExplicitlySet] = true;
        if (values[ComponentKeys.skinName] == value)
            return;
        if (value) {
            values[ComponentKeys.skinName] = value;
        } else {
            let theme = egret.getImplementation("eui.Theme");
            if (theme) {
                let skinName = theme.getSkinName(this);
                if (skinName) {
                    values[ComponentKeys.skinName] = skinName;
                }
            }
        }
        this.$parseSkinName();
    }

    /**
     * @private
     * 解析skinName
     */
    $parseSkinName(): void {
        let skinName = this.skinName;
        let skin: any;
        if (skinName) {
            if (skinName.prototype) {
                skin = new skinName();
            }
            else {
                skin = skinName;
            }
        }
        this.setSkin(skin);
    }

    /**
     * @private
     * @param clazz
     * @param url
     */
    private onExmlLoaded(clazz: any, url: string): void {
        if (this.skinName != url) {
            return;
        }
        let skin = new clazz();
        this.setSkin(skin)
    }

    /**
     * The instance of the skin class for this component instance.
     * @language en_US
     */
    /**
     * 皮肤对象实例。
     * @language zh_CN
     */
    public get skin(): Skin {
        return this.$Component[ComponentKeys.skin];
    }

    /**
     * Setter for the skin instance.
     * @language en_US
     */
    /**
     * 设置皮肤实例
     * @language zh_CN
     */
    protected setSkin(skin: Skin): void {
        if (skin && !(skin instanceof Skin)) {
            skin = null;
            DEBUG && egret.$error(2202);
        }
        let values = this.$Component;
        let oldSkin: Skin = values[ComponentKeys.skin];
        if (oldSkin) {
            let skinParts: string[] = oldSkin.skinParts;
            let length = skinParts.length;
            for (let i = 0; i < length; i++) {
                let partName = skinParts[i];
                if (this[partName]) {
                    this.setSkinPart(partName, null);
                }
            }
            let children = oldSkin.$elementsContent;
            if (children) {
                length = children.length;
                for (let i = 0; i < length; i++) {
                    let child = children[i];
                    if (child.$parent == this) {
                        this.removeChild(child);
                    }
                }
            }
            oldSkin.hostComponent = null;
        }
        values[ComponentKeys.skin] = skin;
        if (skin) {
            let skinParts: string[] = skin.skinParts;
            let length = skinParts.length;
            for (let i = 0; i < length; i++) {
                let partName = skinParts[i];
                let instance = skin[partName];
                if (instance) {
                    this.setSkinPart(partName, instance);
                }
            }
            let children = skin.$elementsContent;
            if (children) {
                for (let i = children.length - 1; i >= 0; i--) {
                    this.addChildAt(children[i], 0);
                }
            }
            skin.hostComponent = this;
        }
        this.invalidateSize();
        this.invalidateDisplayList();
        this.dispatchEventWith(egret.Event.COMPLETE);
    }


    /**
     * Find the skin parts in the skin class and assign them to the properties of the component.
     * You do not call this method directly. This method will be invoked automatically when using a EXML as skin.
     * The ID for a tag in an EXML will be passed in as <code>partName</code>, and the instance of the tag will be
     * passed in as <code>instance</code>.
     * @param partName name of a skin part
     * @param instance instance of a skin part
     * @language en_US
     */
    /**
     * 关联一个对象到逻辑组件的指定皮肤部件上。通常您不需要手动调用此方法，当使用EXML文件作为组件皮肤，此方法将会被自动调用。
     * 在运行时，EXML文件内声明的id名称将作为此方法的partName参数，而id所对应的节点对象，将作为此方法的instance参数被依次传入。
     * @param partName 皮肤部件名称
     * @param instance 皮肤部件实例
     * @language zh_CN
     */
    public setSkinPart(partName: string, instance: any): void {
        let oldInstance = this[partName];
        if (oldInstance) {
            this.partRemoved(partName, oldInstance);
        }
        this[partName] = instance;
        if (instance) {
            this.partAdded(partName, instance);
        }
    }

    /**
     * Called when a skin part is added.
     * You do not call this method directly.
     * EUI calls it automatically when it calls the <code>setSkinPart()</code> method.<p/>
     *
     * Override this function to attach behavior to the part, such as add event listener or
     * assign property values cached.
     * @param partName name of a skin part to add.
     * @param instance instance of a skin part to add.
     * @language en_US
     */
    /**
     * 添加皮肤部件时调用。
     * 您无需直接调用此方法。
     * EUI 会在调用 setSkinPart()方法时自动调用此方法。<p/>
     *
     * 子类覆盖此方法，以在皮肤部件第一次附加时对其执行一些初始化操作，例如添加事件监听，赋值缓存的属性值等。
     * @param partName 要附加的皮肤部件名称。
     * @param instance 要附加的皮肤部件实例。
     * @language zh_CN
     */
    protected partAdded(partName: string, instance: any): void {

    }

    /**
     * Called when an instance of a skin part is being removed.
     * You do not call this method directly.
     * EUI calls it automatically when it calls the <code>setSkinPart()</code> method.<p/>
     *
     * Override this function to clean behavior of the part, such as remove event listener or
     * disconnect the cache reference
     * @param partName name of a skin part to remove.
     * @param instance instance of a skin part to remove.
     * @language en_US
     */
    /**
     * 正删除外观部件的实例时调用。
     * 您无需直接调用此方法。
     * EUI 会在调用 setSkinPart()方法时自动调用此方法。<p/>
     *
     * 子类覆盖此方法，以在皮肤部件从逻辑组件卸载时对其执行一些清理操作，例如移除事件监听，断开缓存的引用等。
     * @param partName 要卸载的皮肤部件名称
     * @param instance 要卸载的皮肤部件实例
     * @language zh_CN
     */
    protected partRemoved(partName: string, instance: any): void {

    }

    /**
     * @private
     *
     * @param value
     */
    $setTouchChildren(value: boolean): boolean {
        value = !!value;
        let values = this.$Component;
        values[ComponentKeys.explicitTouchChildren] = value;
        if (values[ComponentKeys.enabled]) {
            values[ComponentKeys.explicitTouchChildren] = value;
            return super.$setTouchChildren(value);
        }
        else {
            return true;
        }
    }

    /**
     * @private
     *
     * @param value
     */
    $setTouchEnabled(value: boolean): void {
        value = !!value;
        let values = this.$Component;
        values[ComponentKeys.explicitTouchEnabled] = value;
        if (values[ComponentKeys.enabled]) {
            super.$setTouchEnabled(value);
        }
    }

    /**
     * Whether the component can accept user interaction.
     * After setting the <code>enabled</code> property to <code>false</code>, components will disabled touch event
     * (set <code>touchEnabled</code> and <code>touchChildren</code> to false) and set state of skin to "disabled".
     *
     * @default true
     * @language en_US
     */
    /**
     * 组件是否可以接受用户交互。
     * 将 enabled 属性设置为 false 后，
     * 组件会自动禁用触摸事件(将 touchEnabled 和 touchChildren 同时设置为 false)，
     * 部分组件可能还会将皮肤的视图状态设置为"disabled",使其所有子项的颜色变暗。
     *
     * @default true
     * @language zh_CN
     */
    public get enabled(): boolean {
        return this.$Component[ComponentKeys.enabled];
    }

    public set enabled(value: boolean) {
        value = !!value;
        this.$setEnabled(value);
    }

    /**
     * @private
     *
     * @param value
     */
    $setEnabled(value: boolean): boolean {

        let values = this.$Component;
        if (value === values[ComponentKeys.enabled]) {
            return false;
        }
        values[ComponentKeys.enabled] = value;
        if (value) {
            this.$touchEnabled = values[ComponentKeys.explicitTouchEnabled];
            this.$touchChildren = values[ComponentKeys.explicitTouchChildren];
        }
        else {
            this.$touchEnabled = false;
            this.$touchChildren = false;
        }
        this.invalidateState();

        return true;
    }

    //========================皮肤视图状态=====================start=======================

    /**
     * The current view state of the component. When you use this property to set a component's state,
     * EUI will explicit update state of skin and ignore the return of <code>getCurrentState()</code>.
     *
     * Set to <code>""</code> or <code>null</code> to reset the component back to its base state.
     * @language en_US
     */
    /**
     * 组件的当前视图状态。显式设置此属性，
     * 将采用显式设置的值去更新皮肤状态，而忽略组件内部 getCurrentState() 方法返回的值。
     *
     * 将其设置为 "" 或 null 可将取消组件外部显式设置的视图状态名称，从而采用内部 getCurrentState() 方法返回的状态。
     * @language zh_CN
     */
    public get currentState(): string {
        let values = this.$Component;
        return values[ComponentKeys.explicitState] ?
            values[ComponentKeys.explicitState] : this.getCurrentState();
    }

    public set currentState(value: string) {
        let values = this.$Component;
        if (value == values[ComponentKeys.explicitState]) {
            return;
        }
        values[ComponentKeys.explicitState] = value;
        this.invalidateState();
    }

    /**
     * Marks the component so that the new state of the skin is set during a later screen update.
     * A subclass of SkinnableComponent must override <code>getCurrentState()</code> to return a value.
     * @language en_US
     */
    /**
     * 标记组件当前的视图状态失效，调用此方法后，子类应该覆盖 <code>getCurrentState()</code> 方法来返回当前的视图状态名称。
     * @language zh_CN
     */
    public invalidateState(): void {
        let values = this.$Component;
        if (values[ComponentKeys.stateIsDirty])
            return;

        values[ComponentKeys.stateIsDirty] = true;
        this.invalidateProperties();
    }

    /**
     * Returns the name of the state to be applied to the skin.<p/>
     * A subclass of SkinnableComponent must override this method to return a value.
     * @language en_US
     */
    /**
     * 返回组件当前的皮肤状态名称,子类覆盖此方法定义各种状态名
     * @language zh_CN
     */
    protected getCurrentState(): string {
        return "";
    }

    //========================皮肤视图状态===================end========================


    //=======================UIComponent接口实现===========================
    /**
     * @private
     * UIComponentImpl 定义的所有变量请不要添加任何初始值，必须统一在此处初始化。
     */
    private initializeUIValues: () => void;

    /**
     * Create child objects of the component. This is an advanced method that you might override
     * when creating a subclass of Component. This method will be called once it be added to stage.
     * You must invoke <code>super.createChildren()</code> to complete initialization of the parent class
     * @language en_US
     */
    /**
     * 子类覆盖此方法可以执行一些初始化子项操作。此方法仅在组件第一次添加到舞台时回调一次。
     * 请务必调用super.createChildren()以完成父类组件的初始化
     * @language zh_CN
     */
    protected createChildren(): void {
        let values = this.$Component;
        if (!values[ComponentKeys.skinName]) {
            let theme = egret.getImplementation("eui.Theme");
            if (theme) {
                let skinName = theme.getSkinName(this);
                if (skinName) {
                    values[ComponentKeys.skinName] = skinName;
                    this.$parseSkinName();
                }
            }
        }
    }

    /**
     * Performs any final processing after child objects are created.
     * This is an advanced method that you might override
     * when creating a subclass of Component.
     * @language en_US
     */
    /**
     * 创建子对象后执行任何最终处理。此方法在创建 Component 的子类时覆盖。
     * @language zh_CN
     */
    protected childrenCreated(): void {

    }

    /**
     * Processes the properties set on the component.
     * You can override this method when creating a subclass of Component.
     * @language en_US
     */
    /**
     * 提交属性，子类在调用完invalidateProperties()方法后，应覆盖此方法以应用属性
     * @language zh_CN
     */
    protected commitProperties(): void {
        UIComponentImpl.prototype["commitProperties"].call(this);
        let values = this.$Component;
        if (values[ComponentKeys.stateIsDirty]) {
            values[ComponentKeys.stateIsDirty] = false;
            if (values[ComponentKeys.skin]) {
                values[ComponentKeys.skin].currentState = this.currentState;
            }
        }
    }

    /**
     * Calculates the default size.
     * @language en_US
     */
    /**
     * 测量组件尺寸
     * @language zh_CN
     */
    protected measure(): void {
        measure(this);
        let skin = this.$Component[ComponentKeys.skin];
        if (!skin) {
            return;
        }
        let values = this.$UIComponent;
        if (!isNaN(skin.width)) {
            values[UIKeys.measuredWidth] = skin.width;
        }
        else {
            if (values[UIKeys.measuredWidth] < skin.minWidth) {
                values[UIKeys.measuredWidth] = skin.minWidth;
            }
            if (values[UIKeys.measuredWidth] > skin.maxWidth) {
                values[UIKeys.measuredWidth] = skin.maxWidth;
            }
        }

        if (!isNaN(skin.height)) {
            values[UIKeys.measuredHeight] = skin.height;
        }
        else {
            if (values[UIKeys.measuredHeight] < skin.minHeight) {
                values[UIKeys.measuredHeight] = skin.minHeight;
            }
            if (values[UIKeys.measuredHeight] > skin.maxHeight) {
                values[UIKeys.measuredHeight] = skin.maxHeight;
            }
        }
    }

    /**
     * Draws the object and/or sizes and positions its children.
     * @language en_US
     */
    /**
     * 更新显示列表
     * @language zh_CN
     */
    protected updateDisplayList(unscaledWidth: number, unscaledHeight: number): void {
        updateDisplayList(this, unscaledWidth, unscaledHeight);
    }

    /**
     * Method to invalidate parent size and display list if
     * this object affects its layout (includeInLayout is true).
     * @language en_US
     */
    /**
     * 此对象影响其布局时（includeInLayout 为 true），使父代大小和显示列表失效的方法。
     * @language zh_CN
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
registerProperty(Component, "skinName", "Class");
implementUIComponent(Component, egret.DisplayObjectContainer, true);