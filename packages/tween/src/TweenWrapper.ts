import { Ease } from './Ease';
import { Tween } from './Tween';

type Props = {
    [index: string]: any
}

export type EaseType =
    'quadIn' | 'quadOut' | 'quadOut' | 'quadInOut' |
    'cubicIn' | 'cubicOut' | 'cubicInOut' |
    'quartIn' | 'quartOut' | 'quartInOut' |
    'quintIn' | 'quintOut' | 'quintInOut' |
    'sineIn' | 'sineOut' | 'sineInOut' |
    'backIn' | 'backOut' | 'backInOut' |
    'circIn' | 'circOut' | 'circInOut' |
    'bounceIn' | 'bounceOut' | 'bounceInOut' |
    'elasticIn' | 'elasticOut' | 'elasticInOut';

/**
 * Abstract class, Indicate the base action.
 * @language en_US
 */
/**
 * 抽象类，表示一个基本动作
 * @language zh_CN
 */
export abstract class BasePath extends egret.EventDispatcher {
    /**
     * the name of this action.
     * @language en_US
     */
    /**
     * 动作的名称
     * @language zh_CN
     */
    public name: string = '';
}

/**
 * Indicate the to action. See <code>Tween.to</code>
 * @language en_US
 */
/**
 * 表示一个to动作，参见<code>Tween.to</code>
 * @language zh_CN
 */
export class To extends BasePath {
    /**
     * Property set of an object
     * @language en_US
     */
    /**
     * 对象的属性集合
     * @language zh_CN
     */
    public props: Props | undefined = undefined;

    /**
     * Duration
     * @language en_US
     */
    /**
     * 持续时间
     * @language zh_CN
     */
    public duration: number = 500;

    /**
     * Easing algorithm
     * @language en_US
     */
    /**
     * 缓动算法
     * @language zh_CN
     */
    public ease: EaseType | Function | undefined = undefined;
}

/**
 * Indicate the wait action. See <code>Tween.wait</code>
 * @language en_US
 */
/**
 * 表示一个wait动作，参见<code>Tween.wait</code>
 * @language zh_CN
 */
export class Wait extends BasePath {
    /**
     * Duration
     * @language en_US
     */
    /**
     * 持续时间
     * @language zh_CN
     */
    public duration: number = 500;

    /**
     * Whether properties are updated during the waiting time
     * @language en_US
     */
    /**
     * 等待期间属性是否会更新
     * @language zh_CN
     */
    public passive: boolean = false;
}

/**
 * Indicate the set action. See <code>Tween.set</code>
 * @language en_US
 */
/**
 * 表示一个set动作，参见<code>Tween.set</code>
 * @language zh_CN
 */
export class Set extends BasePath {
    /**
     * Property set of an object
     * @language en_US
     */
    /**
     * 对象的属性集合
     * @language zh_CN
     */
    public props!: Props;
}

/**
 * Indicate the tick action. See <code>Tween.tick</code>
 * @language en_US
 */
/**
 * 表示一个tick动作，参见<code>Tween.tick</code>
 * @language zh_CN
 */
export class Tick extends BasePath {
    /**
     * Delta time
     * @language en_US
     */
    /**
     * 增加的时间
     * @language zh_CN
     */
    public delta: number = 0;
}

function convertEase(ease: EaseType | Function): Function {
    if (typeof ease === 'function') {
        return ease;
    } else {
        const func: Function = Ease[ease];
        if (typeof func === 'function') {
            return func;
        }
    }
    throw new Error();
}

/**
 * TweenItem is a wrapper for Tween, which can set the behavior of Tween by setting attributes and adding Path.
 *
 * @event pathComplete Dispatched when some Path has complete.
 * @event complete Dispatched when all Paths has complete.
 * 
 * @defaultProperty props
 * @language en_US
 */
/**
 * TweenItem是对Tween的包装器，能通过设置属性和添加Path的方式设置Tween的行为。
 * 通常用于使用在EXML中定义组件的动画。
 *
 * @event pathComplete 当某个Path执行完毕时会派发此事件。
 * @event complete 当所有Path执行完毕时会派发此事件。
 *
 * @defaultProperty props
 * @language zh_CN
 */
/**
 * Use in exml:
 * ```
 * 	<tween:TweenItem target="{this.button}">
 * 		<tween:props>
 * 			<e:Object loop="{true}"/>
 * 		</tween:props>
 * 		<tween:paths>
 * 			<e:Array>
 * 				<tween:To duration="500">
 * 					<tween:props>
 * 						<e:Object x="{100}" y="{200}" />
 * 					</tween:props>
 * 				</tween:To>
 * 				<tween:Wait duration="1000" />
 * 				<tween:To duration="1000">
 * 					<tween:props>
 * 						<e:Object x="{200}" y="{100}" />
 * 					</tween:props>
 * 				</tween:To>
 * 			</e:Array>
 * 		</tween:paths>
 * 	</tween:TweenItem>
 * ```
 */
export class TweenItem extends egret.EventDispatcher {

    private tween!: Tween;

    /**
     * @private
     */
    private _props: any;
    /**
     * The Tween's props.
     * @language en_US
     */
    /**
     * Tween的props参数。
     * @language zh_CN
     */
    public get props(): any {
        return this._props;
    }

    public set props(value: any) {
        this._props = value;
    }

    /**
     * @private
     */
    private _target: any;
    /**
     * The Tween's target.
     * @language en_US
     */
    /**
     * Tween的target参数。
     * @language zh_CN
     */
    public get target(): any {
        return this._target;
    }

    public set target(value: any) {
        this._target = value;
    }

    /**
     * @private
     */
    private _paths!: BasePath[];
    /**
     * The Actions in Tween.
     * @language en_US
     */
    /**
     * TweenItem中添加的行为。
     * @language zh_CN
     */
    public get paths(): BasePath[] {
        return this._paths;
    }

    public set paths(value: BasePath[]) {
        this._paths = value || [];
    }

    /**
     * Play the Tween
     * @param position The starting position, the default is from the last position to play
     * @language en_US
     */
    /**
     * 播放Tween
     * @param position 播放的起始位置, 默认为从上次位置继续播放
     * @language zh_CN
     */
    public play(position?: number): void {
        if (!this.tween) {
            this.createTween(position);
        } else {
            this.tween.setPaused(false);
            if (this.isStop && position == undefined) {
                position = 0;
                this.isStop = false;
            }
            if (position !== undefined && position !== null) {
                this.tween.setPosition(position);
            }
        }
    }

    /**
     * Pause the Tween
     * @language en_US
     */
    /**
     * 暂停Tween
     * @language zh_CN
     */
    public pause(): void {
        if (this.tween) {
            this.tween.setPaused(true);
        }
    }

    private isStop: boolean = false;

    /**
     * Stop the Tween
     * @language en_US
     */
    /**
     * 停止Tween
     * @language zh_CN
     */
    public stop(): void {
        this.pause();
        this.isStop = true;
    }

    private createTween(position?: number): void {
        this.tween = Tween.get(this._target, this._props);

        if (this._paths) {
            this.applyPaths();
        }
        if (position !== undefined && position !== null) {
            this.tween.setPosition(position);
        }
    }

    private applyPaths(): void {
        for (let i = 0; i < this._paths.length; i++) {
            const path = this._paths[i];
            this.applyPath(path);
        }
    }

    private applyPath(path: BasePath): void {
        if (path instanceof To) {
            if (path.ease) {
                this.tween.to(path.props!, path.duration, convertEase(path.ease));
            }
            else {
                this.tween.to(path.props!, path.duration);
            }
        } else if (path instanceof Wait) {
            this.tween.wait(path.duration, path.passive);
        } else if (path instanceof Set) {
            this.tween.set(path.props);
        } else if (path instanceof Tick) {
            this.tween.$tick(path.delta);
        }

        this.tween.call(() => this.pathComplete(path));
    }

    private pathComplete(path: BasePath): void {
        path.dispatchEventWith('complete');
        this.dispatchEventWith('pathComplete', false, path);

        const index = this._paths.indexOf(path);
        if (index >= 0 && index === this._paths.length - 1) {
            this.dispatchEventWith('complete');
        }
    }
}

registerProperty(TweenItem, 'paths', 'Array', true);

/**
 * TweenGroup is a collection of TweenItem that can be played in parallel with each Item
 * 
 * @event itemComplete Dispatched when some TweenItem has complete.
 * @event complete Dispatched when all TweenItems has complete.
 * @includeExample extension/tween/TweenWrapper.ts
 * @language en_US
 */
/**
 * TweenGroup是TweenItem的集合，可以并行播放每一个Item
 * @includeExample extension/tween/TweenWrapper.ts
 * @language zh_CN
 */
export class TweenGroup extends egret.EventDispatcher {

    private completeCount: number = 0;

    /**
     * @private
     */
    private _items!: TweenItem[];
    /**
     * The Array that TweenItems in TweenGroup.
     * @language en_US
     */
    /**
     * TweenGroup要控制的TweenItem集合。
     * @language zh_CN
     */
    public get items(): TweenItem[] {
        return this._items;
    }

    public set items(value: TweenItem[]) {
        this.completeCount = 0;
        this.registerEvent(false);
        this._items = value;
        this.registerEvent(true);
    }

    private registerEvent(add: boolean): void {
        this._items && this._items.forEach((item) => {
            if (add) {
                item.addEventListener('complete', this.itemComplete, this);
            } else {
                item.removeEventListener('complete', this.itemComplete, this);
            }
        });
    }

    /**
     * Play the all TweenItems
     * @param time The starting position, the default is from the last position to play。If use 0, the group will play from the start position.
     * @language en_US
     */
    /**
     * 播放所有的TweenItem
     * @param time 播放的起始位置, 默认为从上次位置继续播放。如果为0，则从起始位置开始播放。
     * @language zh_CN
     */
    public play(time?: number): void {
        if (!this._items) {
            return;
        }
        for (let i = 0; i < this._items.length; i++) {
            const item = this._items[i];
            item.play(time);
        }
    }

    /**
     * Pause the all TweenItems
     * @language en_US
     */
    /**
     * 暂停播放所有的TweenItem
     * @language zh_CN
     */
    public pause(): void {
        if (!this._items) {
            return;
        }
        for (let i = 0; i < this._items.length; i++) {
            const item = this._items[i];
            item.pause();
        }
    }

    /**
     * Stop the all TweenItems
     * @language en_US
     */
    /**
     * 停止所有的TweenItem
     * @language zh_CN
     */
    public stop(): void {
        if (!this._items) {
            return;
        }
        for (let i = 0; i < this._items.length; i++) {
            const item = this._items[i];
            item.stop();
        }
    }

    private itemComplete(e: Event): void {
        const item = e.currentTarget as any as TweenItem;
        this.completeCount++;
        this.dispatchEventWith('itemComplete', false, item);
        if (this.completeCount === this.items.length) {
            this.dispatchEventWith('complete');
            this.completeCount = 0;
        }
    }
}

registerProperty(TweenGroup, 'items', 'Array', true);

function registerProperty(classDefinition: any, property: string, type: string, asDefault?: boolean): void {
    const prototype: any = classDefinition.prototype;
    prototype.__meta__ = prototype.__meta__ || {};
    prototype.__meta__[property] = type;
    if (asDefault) {
        prototype.__defaultProperty__ = property;
    }
}