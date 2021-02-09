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

import { ICollection } from "../collections/ICollection";
import { CollectionEvent } from "../events/CollectionEvent";
import { CollectionEventKind } from "../events/CollectionEventKind";
import { PropertyEvent } from "../events/PropertyEvent";
import { LayoutBase } from "../layouts/supportClasses/LayoutBase";
import { registerBindable } from "../utils/registerBindable";
import { Group } from "./Group";
import { ListBase } from "./supportClasses/ListBase";

export class ViewStack extends Group implements ICollection {
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
        }

        /**
         * The layout object for this container.
         * This object is responsible for the measurement and layout of
         * the visual elements in the container.
         *
         * @default eui.BasicLayout
         * @language en_US
         */
        /**
         * 此容器的 layout 对象。此对象负责容器中可视元素的测量和布局。
         *
         * @default eui.BasicLayout
         * @language zh_CN
         */
        public get layout():LayoutBase {
            return this.$layout;
        }

        /**
         * @private
         */
        private _selectedChild:egret.DisplayObject = null;
        /**
         * A reference to the currently visible child container.
         * The default is a reference to the first child.
         * If there are no children, this property is <code>null</code>.
         * @language en_US
         */
        /**
         * 对当前可见子容器的引用。默认设置为对第一个子容器的引用。如果没有子项，则此属性为 <code>null</code>。
         * @language zh_CN
         */
        public get selectedChild():egret.DisplayObject {
            let index = this.selectedIndex;
            if (index >= 0 && index < this.numChildren)
                return this.getChildAt(index);
            return null;
        }

        public set selectedChild(value:egret.DisplayObject) {
            let index = this.getChildIndex(value);
            if (index >= 0 && index < this.numChildren)
                this.setSelectedIndex(index);
        }

        /**
         * @private
         * 在属性提交前缓存选中项索引
         */
        private proposedSelectedIndex:number = ListBase.NO_PROPOSED_SELECTION;

        /**
         * @private
         */
        public _selectedIndex:number = -1;
        /**
         * The zero-based index of the currently visible child container.
         * Child indexes are in the range 0, 1, 2, ..., n - 1,
         * where <code>n</code> is the number of children.
         * The default value is 0, corresponding to the first child.
         * If there are no children, the value of this property is <code>-1</code>.
         * @language en_US
         */
        /**
         * 当前可见子容器的从零开始的索引。子索引的范围是 0、1、2、...、n - 1，其中 <code>n</code> 是子项的数目。
         * 默认值是 0，对应于第一个子项。如果不存在子容器，则此属性的值为 -1。
         * @language zh_CN
         */
        public get selectedIndex():number {
            return this.proposedSelectedIndex != ListBase.NO_PROPOSED_SELECTION ? this.proposedSelectedIndex : this._selectedIndex;
        }

        public set selectedIndex(value:number) {
            value = +value|0;
            this.setSelectedIndex(value);
        }

        /**
         * @private
         * 设置选中项索引
         */
        private setSelectedIndex(value:number):void {
            if (value == this.selectedIndex) {
                return;
            }
            this.proposedSelectedIndex = value;
            this.invalidateProperties();
            PropertyEvent.dispatchPropertyEvent(this,PropertyEvent.PROPERTY_CHANGE,"selectedIndex");
        }

        /**
         * @private
         * 一个子项被添加到容器内，此方法不仅在操作addChild()时会被回调，在操作setChildIndex()或swapChildren时也会回调。
         * 当子项索引发生改变时，会先触发$childRemoved()方法，然后触发$childAdded()方法。
         */
        $childAdded(child:egret.DisplayObject, index:number):void {
            super.$childAdded(child, index);
            this.showOrHide(child, false);
            let selectedIndex = this.selectedIndex;
            if (selectedIndex == -1) {
                this.setSelectedIndex(index);
            }
            else if (index <= this.selectedIndex && this.$stage) {
                this.setSelectedIndex(selectedIndex + 1);
            }
            CollectionEvent.dispatchCollectionEvent(this, CollectionEvent.COLLECTION_CHANGE,
                CollectionEventKind.ADD, index, -1, [child.name]);
        }

        /**
         * @private
         * 一个子项从容器内移除，此方法不仅在操作removeChild()时会被回调，在操作setChildIndex()或swapChildren时也会回调。
         * 当子项索引发生改变时，会先触发$childRemoved()方法，然后触发$childAdded()方法。
         */
        $childRemoved(child:egret.DisplayObject, index:number):void {
            super.$childRemoved(child, index);
            this.showOrHide(child, true);
            let selectedIndex = this.selectedIndex;
            if (index == selectedIndex) {
                if (this.numChildren > 0) {
                    if (index == 0) {
                        this.proposedSelectedIndex = 0;
                        this.invalidateProperties();
                    }
                    else
                        this.setSelectedIndex(0);
                }
                else
                    this.setSelectedIndex(-1);
            }
            else if (index < selectedIndex) {
                this.setSelectedIndex(selectedIndex - 1);
            }
            CollectionEvent.dispatchCollectionEvent(this, CollectionEvent.COLLECTION_CHANGE,
                CollectionEventKind.REMOVE, index, -1, [child.name]);
        }

        /**
         * @inheritDoc
         */
        protected commitProperties():void {
            super.commitProperties();
            if (this.proposedSelectedIndex != ListBase.NO_PROPOSED_SELECTION) {
                this.commitSelection(this.proposedSelectedIndex);
                this.proposedSelectedIndex = ListBase.NO_PROPOSED_SELECTION;
            }
        }

        /**
         * @private
         * 
         * @param newIndex 
         */
        private commitSelection(newIndex:number):void {
            if (newIndex >= 0 && newIndex < this.numChildren) {
                this._selectedIndex = newIndex;
                if (this._selectedChild) {
                    this.showOrHide(this._selectedChild, false);
                }
                this._selectedChild = this.getElementAt(this._selectedIndex);
                this.showOrHide(this._selectedChild, true);
            }
            else {
                this._selectedChild = null;
                this._selectedIndex = -1;
            }
            this.invalidateSize();
            this.invalidateDisplayList();
        }

        /**
         * @private
         * 
         * @param child 
         * @param visible 
         */
        private showOrHide(child:egret.DisplayObject, visible:boolean):void {
            if (egret.is(child, "eui.UIComponent")) {
                (<eui.UIComponent><any>child).includeInLayout = visible;
            }
            child.visible = visible;
        }

        /**
         * number of children
         * @language en_US
         */
        /**
         * 子项数量
         * @language zh_CN
         */
        public get length():number {
            return this.$children.length;
        }

        /**
         * @inheritDoc
         */
        public getItemAt(index:number):any {
            let element:egret.DisplayObject = this.$children[index];
            return element ? element.name : "";
        }

        /**
         * @inheritDoc
         */
        public getItemIndex(item:any):number {
            let list = this.$children;
            let length = list.length;
            for (let i = 0; i < length; i++) {
                if (list[i].name == item) {
                    return i;
                }
            }
            return -1;
        }
    }
registerBindable(ViewStack.prototype,"selectedIndex");