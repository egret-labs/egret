namespace egret {
    /**
     * The GradientType class provides values for the type parameter in the beginGradientFill() methods of the egret.Graphics class.
     *
     * @see egret.Graphics#beginGradientFill()
     * @language en_US
     */
    /**
     * GradientType 类为 egret.Graphics 类的 beginGradientFill() 方法中的 type 参数提供值。
     *
     * @see egret.Graphics#beginGradientFill()
     * @language zh_CN
     */
    export class GradientType {
        /**
         * Value used to specify a linear gradient fill.
         * @language en_US
         */
        /**
         * 用于指定线性渐变填充的值
         * @language zh_CN
         */
        public static LINEAR:string = "linear";
        /**
         * Value used to specify a radial gradient fill.
         * @language en_US
         */
        /**
         * 用于指定放射状渐变填充的值
         * @language zh_CN
         */
        public static RADIAL:string = "radial";
    }
}