/**
 * @file generate skeleton
 * @author panyuqi <panyuqi@baidu.com>
 */

/* eslint-disable no-console, fecs-no-require */

var ssr = require('./ssr');
var ref = require('./util');
var insertAt = ref.insertAt;
var isObject = ref.isObject;
var generateRouterScript = ref.generateRouterScript;

var DEFAULT_PLUGIN_OPTIONS = {
    webpackConfig: {},
    insertAfter: '<div id="app">',
    quiet: false
};

var DEFAULT_ENTRY_NAME = 'main';

var SkeletonPlugin = function SkeletonPlugin(options) {
    if ( options === void 0 ) options = {};

    this.options = Object.assign({}, DEFAULT_PLUGIN_OPTIONS, options);
};

SkeletonPlugin.prototype.apply = function apply (compiler) {

    var ref = this.options;
        var webpackConfig = ref.webpackConfig;
        var insertAfter = ref.insertAfter;
        var quiet = ref.quiet;
        var router = ref.router;
        var minimize = ref.minimize;
    var entry = webpackConfig.entry;
    // cache entries
    var skeletonEntries;

    if (isObject(entry)) {
        skeletonEntries = Object.assign({}, entry);
    }
    else {
        var entryName = DEFAULT_ENTRY_NAME;
        var parentEntry = compiler.options.entry;

        if (isObject(parentEntry)) {
            entryName = Object.keys(parentEntry)[0];
        }
        skeletonEntries = {};
            skeletonEntries[entryName] = entry;
    }

    compiler.plugin('compilation', function (compilation) {

        // add listener for html-webpack-plugin
        compilation.plugin('html-webpack-plugin-before-html-processing', function (htmlPluginData, callback) {

            var usedChunks = Object.keys(htmlPluginData.assets.chunks);
            var entryKey;

            // find current processing entry
            if (Array.isArray(usedChunks)) {
                entryKey = Object.keys(skeletonEntries).find(function (v) { return usedChunks.indexOf(v) > -1; });
            }
            else {
                entryKey = DEFAULT_ENTRY_NAME;
            }

            // set current entry & output in webpack config
            webpackConfig.entry = skeletonEntries[entryKey];
            if (!webpackConfig.output) {
                webpackConfig.output = {};
            }
            webpackConfig.output.filename = "skeleton-" + entryKey + ".js";
                
            if(entryKey){
                ssr(webpackConfig, {
                    quiet: quiet, compilation: compilation, context: compiler.context
                }).then(function (ref) {
                        var skeletonHtml = ref.skeletonHtml;
                        var skeletonCSS = ref.skeletonCSS;
                        var watching = ref.watching;

                    // insert inlined styles into html
                    var headTagEndPos = htmlPluginData.html.lastIndexOf('</head>');
                    htmlPluginData.html = insertAt(htmlPluginData.html, ("<style>" + skeletonCSS + "</style>"), headTagEndPos);
    
                    // replace mounted point with ssr result in html
                    var appPos = htmlPluginData.html.lastIndexOf(insertAfter) + insertAfter.length;
    
                    // inject router code in SPA mode
                    var routerScript = '';
                    if (router) {
                        var isMPA = !!(Object.keys(skeletonEntries).length > 1);
                        routerScript = generateRouterScript(router, minimize, isMPA, entryKey);
                    }
                    htmlPluginData.html = insertAt(htmlPluginData.html, skeletonHtml + routerScript, appPos);
                    callback(null, htmlPluginData);
                }).catch(function (e) {
                    console.log(e);
                });
            }else{
                callback(null, htmlPluginData);
            }
        });
    });
};

SkeletonPlugin.loader = function loader (ruleOptions) {
        if ( ruleOptions === void 0 ) ruleOptions = {};

    return Object.assign(ruleOptions, {
        loader: require.resolve('./loader'),
        options: Object.assign({}, ruleOptions.options)
    });
};

module.exports = SkeletonPlugin;
