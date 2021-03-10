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

namespace egret {

    /**
     * The HorizontalAlign class defines the possible values for the horizontal alignment.
     * @see egret.TextField#textAlign
     * @language en_US
     */
    /**
     * HorizontalAlign 类为水平对齐方式定义可能的值。
     * @see egret.TextField#textAlign
     * @language zh_CN
     */
    export class HorizontalAlign{
        /**
         * Horizontally align content to the left of the container.
         * @language en_US
         */
        /**
         * 将内容与容器的左侧对齐。
         * @language zh_CN
         */
        public static LEFT:string = "left";

        /**
         * Horizontally align content to the right of the container.
         * @language en_US
         */
        /**
         * 将内容与容器的右侧对齐。
         * @language zh_CN
         */
        public static RIGHT:string = "right";

        /**
         * Horizontally align content in the center of the container.
         * @language en_US
         */
        /**
         * 在容器的水平中心对齐内容。
         * @language zh_CN
         */
        public static CENTER: string = "center";

        /**
         * Horizontal alignment with both edges.
         * Note: TextFiled does not support this alignment method.
         * @constant egret.HorizontalAlign.JUSTIFY
         * @language en_US
         */
        /**
         * 水平两端对齐。
         * 注意：TextFiled不支持此对齐方式。
         * @constant egret.HorizontalAlign.JUSTIFY
         * @language zh_CN
         */
        public static JUSTIFY:string = "justify";

        /**
         * Align the content of the child items, relative to the container. This operation will adjust uniformly the size of all the child items to be the Content Width \" of the container \".
         * The Content Width \" of the container \" is the size of the max. child item. If the size of all child items are less than the width of the container, they will be adjusted to the width of the container.
         * Note: TextFiled does not support this alignment method.
         * @constant egret.HorizontalAlign.CONTENT_JUSTIFY
         * @language en_US
         */
        /**
         * 相对于容器对子项进行内容对齐。这会将所有子项的大小统一调整为容器的"内容宽度"。
         * 容器的"内容宽度"是最大子项的大小,如果所有子项都小于容器的宽度，则会将所有子项的大小调整为容器的宽度。
         * 注意：TextFiled不支持此对齐方式。
         * @constant egret.HorizontalAlign.CONTENT_JUSTIFY
         * @language zh_CN
         */
        public static CONTENT_JUSTIFY:string = "contentJustify";

    }
}