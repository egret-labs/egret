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
    /**
     * Linear layout base class, usually as the parent class of
     * <code>HorizontalLayout</code> and <code>VerticalLayout</code>.
     * @language en_US
     */
    /**
     * 线性布局基类，通常作为 <code>HorizontalLayout</code> 和 <code>VerticalLayout</code> 的父类。
     * @language zh_CN
     */
    export class LinearLayoutBase extends LayoutBase {

        /**
         * @private
         */
        $horizontalAlign:string = "left";

        /**
         * The horizontal alignment of layout elements.
         * <p>The <code>egret.HorizontalAlign</code> and <code>eui.JustifyAlign</code> class
         * defines the possible values for this property.</p>
         *
         * @default "left"
         * @language en_US
         */
        /**
         * 布局元素的水平对齐策略。
         * <p><code>egret.HorizontalAlign</code> 和
         * <code>eui.JustifyAlign</code>类定义此属性的可能值。<p>
         *
         * @default "left"
         * @language zh_CN
         */
        public get horizontalAlign():string {
            return this.$horizontalAlign;
        }

        public set horizontalAlign(value:string) {
            if (this.$horizontalAlign == value)
                return;
            this.$horizontalAlign = value;
            if (this.$target)
                this.$target.invalidateDisplayList();
        }

        /**
         * @private
         */
        $verticalAlign:string = "top";

        /**
         * The vertical alignment of layout elements.
         * <p>The <code>egret.VerticalAlign</code> and <code>eui.JustifyAlign</code> class
         * defines the possible values for this property.</p>
         *
         * @default "top"
         * @language en_US
         */
        /**
         * 布局元素的垂直对齐策略。请使用 VerticalAlign 定义的常量。
         * <p><code>egret.VerticalAlign</code> 和
         * <code>eui.JustifyAlign</code>类定义此属性的可能值。<p>
         *
         * @default "top"
         * @language zh_CN
         */
        public get verticalAlign():string {
            return this.$verticalAlign;
        }

        public set verticalAlign(value:string) {
            if (this.$verticalAlign == value)
                return;
            this.$verticalAlign = value;
            if (this.$target)
                this.$target.invalidateDisplayList();
        }

        /**
         * @private
         */
        $gap:number = 6;

        /**
         * The space between layout elements, in pixels.
         *
         * @default 6
         * @language en_US
         */
        /**
         * 布局元素之间的间隔（以像素为单位）。
         *
         * @default 6
         * @language zh_CN
         */
        public get gap():number {
            return this.$gap;
        }

        public set gap(value:number) {
            value = +value || 0;
            if (this.$gap === value)
                return;
            this.$gap = value;
            this.invalidateTargetLayout();
        }

        /**
         * @private
         */
        $paddingLeft:number = 0;

        /**
         * Number of pixels between the container's left edge
         * and the left edge of the first layout element.
         *
         * @default 0
         * @language en_US
         */
        /**
         * 容器的左边缘与第一个布局元素的左边缘之间的像素数。
         *
         * @default 0
         * @language zh_CN
         */
        public get paddingLeft():number {
            return this.$paddingLeft;
        }

        public set paddingLeft(value:number) {
            value = +value || 0;
            if (this.$paddingLeft === value)
                return;

            this.$paddingLeft = value;
            this.invalidateTargetLayout();
        }

        /**
         * @private
         */
        $paddingRight:number = 0;

        /**
         * Number of pixels between the container's right edge
         * and the right edge of the last layout element.
         *
         *  @default 0
         * @language en_US
         */
        /**
         * 容器的右边缘与最后一个布局元素的右边缘之间的像素数。
         *
         * @default 0
         * @language zh_CN
         */
        public get paddingRight():number {
            return this.$paddingRight;
        }

        public set paddingRight(value:number) {
            value = +value || 0;
            if (this.$paddingRight === value)
                return;

            this.$paddingRight = value;
            this.invalidateTargetLayout();
        }

        /**
         * @private
         */
        $paddingTop:number = 0;

        /**
         * The minimum number of pixels between the container's top edge and
         * the top of all the container's layout elements.
         *
         * @default 0
         * @language en_US
         */
        /**
         * 容器的顶边缘与所有容器的布局元素的顶边缘之间的最少像素数。
         *
         * @default 0
         * @language zh_CN
         */
        public get paddingTop():number {
            return this.$paddingTop;
        }

        public set paddingTop(value:number) {
            value = +value || 0;
            if (this.$paddingTop === value)
                return;

            this.$paddingTop = value;
            this.invalidateTargetLayout();
        }

        /**
         * @private
         */
        $paddingBottom:number = 0;

        /**
         * The minimum number of pixels between the container's bottom edge and
         * the bottom of all the container's layout elements.
         *
         * @default 0
         * @language en_US
         */
        /**
         * 容器的底边缘与所有容器的布局元素的底边缘之间的最少像素数。
         *
         * @default 0
         * @language zh_CN
         */
        public get paddingBottom():number {
            return this.$paddingBottom;
        }

        public set paddingBottom(value:number) {
            value = +value || 0;
            if (this.$paddingBottom === value)
                return;

            this.$paddingBottom = value;
            this.invalidateTargetLayout();
        }

        /**
         * Convenience function for subclasses that invalidates the
         * target's size and displayList so that both layout's <code>measure()</code>
         * and <code>updateDisplayList</code> methods get called.
         * @language en_US
         */
        /**
         * 失效目标容器的尺寸和显示列表的简便方法，调用目标容器的
         * <code>measure()</code>和<code>updateDisplayList</code>方法
         * @language zh_CN
         */
        protected invalidateTargetLayout():void {
            let target = this.$target;
            if (target) {
                target.invalidateSize();
                target.invalidateDisplayList();
            }
        }

        /**
         * @inheritDoc
         */
        public measure():void {
            if (!this.$target)
                return;
            if (this.$useVirtualLayout) {
                this.measureVirtual();
            }
            else {
                this.measureReal();
            }
        }

        /**
         * Compute exact values for measuredWidth and measuredHeight.
         * @language en_US
         */
        /**
         * 计算目标容器 measuredWidth 和 measuredHeight 的精确值
         * @language zh_CN
         */
        protected measureReal():void {

        }

        /**
         * Compute potentially approximate values for measuredWidth and measuredHeight.
         * @language en_US
         */
        /**
         * 计算目标容器 measuredWidth 和 measuredHeight 的近似值
         * @language zh_CN
         */
        protected measureVirtual():void {

        }

        /**
         * @inheritDoc
         */
        public updateDisplayList(width:number, height:number):void {
            let target = this.$target;
            if (!target)
                return;

            if (target.numElements == 0) {
                target.setContentSize(Math.ceil(this.$paddingLeft + this.$paddingRight),
                    Math.ceil(this.$paddingTop + this.$paddingBottom));
                return;
            }

            if (this.$useVirtualLayout) {
                this.updateDisplayListVirtual(width, height);
            }
            else {
                this.updateDisplayListReal(width, height);
            }
        }


        /**
         * An Array of the virtual layout elements size cache.
         * @language en_US
         */
        /**
         * 虚拟布局使用的尺寸缓存。
         * @language zh_CN
         */
        protected elementSizeTable:number[] = [];

        /**
         * Gets the starting position of the specified index element
         * @language en_US
         */
        /**
         * 获取指定索引元素的起始位置
         * @language zh_CN
         */
        protected getStartPosition(index:number):number {
            return 0;
        }

        /**
         * Gets the size of the specified index element
         * @language en_US
         */
        /**
         * 获取指定索引元素的尺寸
         * @language zh_CN
         */
        protected getElementSize(index:number):number {
            return 0;
        }

        /**
         * Gets the sum of the size of cached elements
         * @language en_US
         */
        /**
         * 获取缓存的子对象尺寸总和
         * @language zh_CN
         */
        protected getElementTotalSize():number {
            return 0;
        }

        /**
         * @inheritDoc
         * 
         * @param index
         */
        public elementRemoved(index:number):void {
            if (!this.$useVirtualLayout)
                return;
            super.elementRemoved(index);
            this.elementSizeTable.splice(index, 1);
        }

        /**
         * @inheritDoc
         */
        public clearVirtualLayoutCache():void {
            if (!this.$useVirtualLayout)
                return;
            this.elementSizeTable = [];
            this.maxElementSize = 0;
        }


        /**
         * The binary search to find the specified index position of the display object
         * @language en_US
         */
        /**
         * 折半查找法寻找指定位置的显示对象索引
         * @language zh_CN
         */
        protected findIndexAt(x:number, i0:number, i1:number):number {
            let index = ((i0 + i1) * 0.5)|0;
            let elementX = this.getStartPosition(index);
            let elementWidth = this.getElementSize(index);
            if ((x >= elementX) && (x < elementX + elementWidth + this.$gap))
                return index;
            else if (i0 == i1)
                return -1;
            else if (x < elementX)
                return this.findIndexAt(x, i0, Math.max(i0, index - 1));
            else
                return this.findIndexAt(x, Math.min(index + 1, i1), i1);
        }

        /**
         * The first element index in the view of the virtual layout
         * @language en_US
         */
        /**
         * 虚拟布局使用的当前视图中的第一个元素索引
         * @language zh_CN
         */
        protected startIndex:number = -1;
        /**
         * The last element index in the view of the virtual layout
         * @language en_US
         */
        /**
         * 虚拟布局使用的当前视图中的最后一个元素的索引
         * @language zh_CN
         */
        protected endIndex:number = -1;
        /**
         * A Flag of the first element and the end element has been calculated.
         * @language en_US
         */
        /**
         * 视图的第一个和最后一个元素的索引值已经计算好的标志
         * @language zh_CN
         */
        protected indexInViewCalculated:boolean = false;

        /**
         * @inheritDoc
         */
        public scrollPositionChanged():void {
            super.scrollPositionChanged();
            if (this.$useVirtualLayout) {
                let changed = this.getIndexInView();
                if (changed) {
                    this.indexInViewCalculated = true;
                    this.target.invalidateDisplayList();
                }
            }

        }

        /**
         * Get the index of the first and last element in the view,
         * and to return whether or not to change.
         *
         * @return has the index changed
         * @language en_US
         */
        /**
         * 获取视图中第一个和最后一个元素的索引,返回是否发生改变。
         *
         * @return 索引是否已改变
         * @language zh_CN
         */
        protected getIndexInView():boolean {
            return false;
        }

        /**
         * The maximum size of elements
         * @language en_US
         */
        /**
         * 子元素最大的尺寸
         * @language zh_CN
         */
        protected maxElementSize:number = 0;

        /**
         * Update the layout of the virtualized elements
         * @language en_US
         */
        /**
         * 更新虚拟布局的显示列表
         * @language zh_CN
         */
        protected updateDisplayListVirtual(width:number, height:number):void {

        }


        /**
         * Update the layout of the reality elements
         * @language en_US
         */
        /**
         * 更新真实布局的显示列表
         * @language zh_CN
         */
        protected updateDisplayListReal(width:number, height:number):void {

        }

        /**
         * Allocate blank area for each variable size element.
         * @language en_US
         */
        /**
         * 为每个可变尺寸的子项分配空白区域。
         * @language zh_CN
         */
        protected flexChildrenProportionally(spaceForChildren:number, spaceToDistribute:number,
                                             totalPercent:number, childInfoArray:any[]):void {

            let numElements:number = childInfoArray.length;
            let done:boolean;

            do {
                done = true;

                let unused:number = spaceToDistribute -
                    (spaceForChildren * totalPercent / 100);
                if (unused > 0)
                    spaceToDistribute -= unused;
                else
                    unused = 0;

                let spacePerPercent:number = spaceToDistribute / totalPercent;

                for (let i:number = 0; i < numElements; i++) {
                    let childInfo:sys.ChildInfo = childInfoArray[i];

                    let size:number = childInfo.percent * spacePerPercent;

                    if (size < childInfo.min) {
                        let min:number = childInfo.min;
                        childInfo.size = min;

                        childInfoArray[i] = childInfoArray[--numElements];
                        childInfoArray[numElements] = childInfo;

                        totalPercent -= childInfo.percent;
                        if (unused >= min) {
                            unused -= min;
                        }
                        else {
                            spaceToDistribute -= min - unused;
                            unused = 0;
                        }
                        done = false;
                        break;
                    }
                    else if (size > childInfo.max) {
                        let max:number = childInfo.max;
                        childInfo.size = max;

                        childInfoArray[i] = childInfoArray[--numElements];
                        childInfoArray[numElements] = childInfo;

                        totalPercent -= childInfo.percent;
                        if (unused >= max) {
                            unused -= max;
                        }
                        else {
                            spaceToDistribute -= max - unused;
                            unused = 0;
                        }
                        done = false;
                        break;
                    }
                    else {
                        childInfo.size = size;
                    }
                }
            }
            while (!done);
        }
    }

}

namespace eui.sys {

    /**
     * @private
     */
    export class ChildInfo {


        /**
         * @private
         */
        public layoutElement:eui.UIComponent = null;


        /**
         * @private
         */
        public size:number = 0;


        /**
         * @private
         */
        public percent:number = NaN;


        /**
         * @private
         */
        public min:number = NaN;


        /**
         * @private
         */
        public max:number = NaN;
    }
}