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

import { PropertyEvent } from "../events/PropertyEvent";
import { registerBindable } from "../utils/registerBindable";
import { Button } from "./Button";

export class ToggleButton extends Button{

		/**
		 * @private
		 */
		$selected: boolean = false;
		/**
		 * Contains <code>true</code> if the button is in the down state,
		 * and <code>false</code> if it is in the up state.
         * @language en_US
		 */
		/**
		 * 按钮处于按下状态时为 <code>true</code>，而按钮处于弹起状态时为 <code>false</code>。
         * @language zh_CN
		 */
		public get selected():boolean{
			return this.$selected;
		}

		public set selected(value:boolean){
			this.$setSelected(value);
		}

		/**
		 * @private
		 * 
		 * @param value 
		 */
		$setSelected(value:boolean):boolean{
			value = !!value;
			if (value === this.$selected)
				return false;
			this.$selected = value;
			this.invalidateState();
			PropertyEvent.dispatchPropertyEvent(this,PropertyEvent.PROPERTY_CHANGE,"selected");
			return true;
		}

		/**
		 * @inheritDoc
         */
		protected getCurrentState():string{
			let state = super.getCurrentState();
			if (!this.$selected){
				return state;
			}
			else{
				let selectedState = state + "AndSelected";
				let skin = this.skin;
				if(skin&&skin.hasState(selectedState)){
					return selectedState;
				}
				return state=="disabled"?"disabled":"down";
			}
		}
		/**
		 * @private
		 * 是否根据触摸事件自动变换选中状态,默认true。仅框架内使用。
		 */
		$autoSelected:boolean = true;

		/**
		 * @inheritDoc
         */
		protected buttonReleased():void{
			if(!this.$autoSelected)
				return;
			this.selected = !this.$selected;
			this.dispatchEventWith(egret.Event.CHANGE);
		}
	}
registerBindable(ToggleButton.prototype,"selected");