const fs = require('fs');
const assert = require('assert');
const lib = require('../../');
const mock = require('mock-fs');
const path = require('path');

const standardEgretProperties = { "eui": { "themes": ['resource/default.thm.json'] } };

const standardTheme = {
    "skins": {
        "eui.Button": "resource/eui_skins/ButtonSkin.exml",
        "eui.CheckBox": "resource/eui_skins/CheckBoxSkin.exml",
        "eui.HScrollBar": "resource/eui_skins/HScrollBarSkin.exml",
        "eui.HSlider": "resource/eui_skins/HSliderSkin.exml",
        "eui.Panel": "resource/eui_skins/PanelSkin.exml",
        "eui.TextInput": "resource/eui_skins/TextInputSkin.exml",
        "eui.ProgressBar": "resource/eui_skins/ProgressBarSkin.exml",
        "eui.RadioButton": "resource/eui_skins/RadioButtonSkin.exml",
        "eui.Scroller": "resource/eui_skins/ScrollerSkin.exml",
        "eui.ToggleSwitch": "resource/eui_skins/ToggleSwitchSkin.exml",
        "eui.VScrollBar": "resource/eui_skins/VScrollBarSkin.exml",
        "eui.VSlider": "resource/eui_skins/VSliderSkin.exml",
        "eui.ItemRenderer": "resource/eui_skins/ItemRendererSkin.exml"
    },
    "autoGenerateExmlsList": true,
    "exmls": [
        "resource/eui_skins/input.exml"
    ],
    "path": "resource/default.thm.json"
}

const inputFile = `
<?xml version='1.0' encoding='utf-8'?>
<e:Skin class="skins.MyComponent1" width="400"
	xmlns:e="http://ns.egret.com/eui">
	<e:Group>
	<e:Image id="image" width="100" source="a_png" includeInLayout="true"  scale9Grid="1,1,1,1">
	</e:Image>
	</e:Group>
</e:Skin>
`

describe('完整工程', () => {

    it('最简单的Demo', () => {

        const property = path.join(process.cwd(), 'property.json');
        const propertyContent = fs.readFileSync(property);
        mock({

            './a/': {
                "egretProperties.json": JSON.stringify(standardEgretProperties),
                "resource": {
                    "default.thm.json": JSON.stringify(standardTheme),
                    'eui_skins': {
                        "input.exml": inputFile
                    }
                }
            },
            [property]: propertyContent
        });
        const compiler = new lib.EuiCompiler('./a');
        compiler.emit();
        mock.restore();
    });
})

