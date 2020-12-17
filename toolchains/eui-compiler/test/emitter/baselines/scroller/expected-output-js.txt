skins.MyComponent2 = function (_super) {
    __extends(MyComponent2, _super);
    function MyComponent2() {
        var _this = _super.call(this) || this;
        _this.skinParts = [];
        var a1 = new eui.Scroller();
        a1.width = 500;
        a1.height = 148;
        a1.anchorOffsetX = 0;
        a1.anchorOffsetY = 0;
        a1.scrollPolicyV = "false";
        a1.visible = true;
        a1.x = 70;
        a1.y = 11;
        var a2 = new eui.List();
        a2.width = 500;
        a2.itemRendererSkinName = "skins.GamePetItemRendererSkin";
        a2.x = 70;
        a2.y = 0;
        a2.anchorOffsetY = 0;
        var a3 = new eui.HorizontalLayout();
        a3.verticalAlign = "middle";
        a3.gap = 10;
        a3.paddingLeft = 2;
        a2.layout = a3;
        a1.viewport = a2;
        _this.elementsContent = [a1];
        return _this;
    }
    return MyComponent2;
}(eui.Skin);