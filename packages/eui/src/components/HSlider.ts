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

import { RangeKeys } from "./supportClasses/Range";
import { SliderBase } from "./supportClasses/SliderBase";

export class HSlider extends SliderBase {

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
         * @inheritDoc
         */
        protected pointToValue(x:number, y:number):number {
            if (!this.thumb || !this.track)
                return 0;
            let values = this.$Range;
            let range = values[RangeKeys.maximum] - values[RangeKeys.minimum];
            let thumbRange = this.getThumbRange();
            return values[RangeKeys.minimum] + (thumbRange != 0 ? (x / thumbRange) * range : 0);
        }

        /**
         * @private
         * 
         * @returns 
         */
        private getThumbRange():number {
            let bounds = egret.$TempRectangle;
            this.track.getLayoutBounds(bounds);
            let thumbRange = bounds.width;
            this.thumb.getLayoutBounds(bounds);
            return thumbRange - bounds.width;
        }

        /**
         * @inheritDoc
         */
        protected updateSkinDisplayList():void {
            if (!this.thumb || !this.track)
                return;
            let values = this.$Range;
            let thumbRange = this.getThumbRange();
            let range = values[RangeKeys.maximum] - values[RangeKeys.minimum];
            let thumbPosTrackX = (range > 0) ? ((this.pendingValue - values[RangeKeys.minimum]) / range) * thumbRange : 0;
            let thumbPos = this.track.localToGlobal(thumbPosTrackX, 0, egret.$TempPoint);
            let thumbPosX = thumbPos.x;
            let thumbPosY = thumbPos.y;
            let thumbPosParentX = this.thumb.$parent.globalToLocal(thumbPosX, thumbPosY, egret.$TempPoint).x;

            let bounds = egret.$TempRectangle;
            this.thumb.getLayoutBounds(bounds);
            this.thumb.setLayoutBoundsPosition(Math.round(thumbPosParentX), bounds.y);
            if (this.trackHighlight && this.trackHighlight.$parent) {
                let trackHighlightX = this.trackHighlight.$parent.globalToLocal(thumbPosX, thumbPosY, egret.$TempPoint).x - thumbPosTrackX;
                this.trackHighlight.x = Math.round(trackHighlightX);
                this.trackHighlight.width = Math.round(thumbPosTrackX);
            }
        }
    }