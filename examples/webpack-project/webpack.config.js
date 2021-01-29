const bundler = require('@egret/egret-webpack-bundler');
const config = bundler.generateConfig(__dirname, {
    libraryType: "debug",
    defines: { DEBUG: true, RELEASE: false },
    typescript: { mode: 'legacy' },
    // exml: {
    //     watch: true
    // },
    html: {
        templateFilePath: "./templates/index.ejs"
    },
    // parseEgretProperty: true,
    // assets: [
    //     { file: "resource/default.res.json" }
    // ]
}, 'web', true);
module.exports = config;