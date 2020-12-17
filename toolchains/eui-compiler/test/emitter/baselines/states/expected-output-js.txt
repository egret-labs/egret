skins.MyComponent2 = function (_super) {
    __extends(MyComponent2, _super);
    function MyComponent2() {
        var _this = _super.call(this) || this;
        _this.skinParts = ["promptDisplay"];
        _this.width = 400;
        var a1 = new eui.Image();
        _this.a1 = a1;
        a1.width = 100;
        a1.source = "a_png";
        var a2 = new eui.Label();
        _this.promptDisplay = a2;
        _this.a2 = a2;
        _this.elementsContent = [
            a1,
            a2
        ];
        _this.states = [
            new eui.State("up", []),
            new eui.State("down", [
                new eui.SetProperty("a1", "source", "button_down_png")
            ]),
            new eui.State("disabled", [
                new eui.SetProperty("a1", "alpha", 0.5),
                new eui.AddItems("a2", "", 1, "")
            ])
        ];
        return _this;
    }
    return MyComponent2;
}(eui.Skin);