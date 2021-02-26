// @ts-check
/**
 * @type import('@egret/egret-webpack-bundler').WebpackBundleOptions
 */
const config = {
    libraryType: 'debug',
    defines: { DEBUG: true, RELEASE: false, version: 1111 },
    typescript: { mode: 'legacy' },
    exml: {
        watch: true
    },
    html: {
        templateFilePath: './templates/index.ejs'
    },
    devServer: {
        open: true
    },
    parseEgretProperty: true
};
module.exports = config;