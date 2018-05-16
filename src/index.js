/**
 * @file generate skeleton
 * @author panyuqi <panyuqi@baidu.com>
 */

/* eslint-disable no-console, fecs-no-require */

const ssr = require('./ssr');
const {insertAt, isObject, generateRouterScript} = require('./util');

const DEFAULT_PLUGIN_OPTIONS = {
    webpackConfig: {},
    insertAfter: '<div id="app">',
    quiet: false
};

const DEFAULT_ENTRY_NAME = 'main';

class SkeletonPlugin {

    constructor(options = {}) {
        this.options = Object.assign({}, DEFAULT_PLUGIN_OPTIONS, options);
    }

    apply(compiler) {

        let {webpackConfig, insertAfter, quiet, router, minimize} = this.options;
        let entry = webpackConfig.entry;
        // cache entries
        let skeletonEntries;

        if (isObject(entry)) {
            skeletonEntries = Object.assign({}, entry);
        }
        else {
            let entryName = DEFAULT_ENTRY_NAME;
            let parentEntry = compiler.options.entry;

            if (isObject(parentEntry)) {
                entryName = Object.keys(parentEntry)[0];
            }
            skeletonEntries = {
                [entryName]: entry
            };
        }

        compiler.plugin('compilation', compilation => {

            // add listener for html-webpack-plugin
            compilation.plugin('html-webpack-plugin-before-html-processing', (htmlPluginData, callback) => {

                let usedChunks = Object.keys(htmlPluginData.assets.chunks);
                let entryKey;

                // find current processing entry
                if (Array.isArray(usedChunks)) {
                    entryKey = Object.keys(skeletonEntries).find(v => usedChunks.indexOf(v) > -1);
                }
                else {
                    entryKey = DEFAULT_ENTRY_NAME;
                }

                // set current entry & output in webpack config
                webpackConfig.entry = skeletonEntries[entryKey];
                if (!webpackConfig.output) {
                    webpackConfig.output = {};
                }
                webpackConfig.output.filename = `skeleton-${entryKey}.js`;

                ssr(webpackConfig, {
                    quiet, compilation, context: compiler.context
                }).then(({skeletonHtml, skeletonCSS, watching}) => {
                    // insert inlined styles into html
                    let headTagEndPos = htmlPluginData.html.lastIndexOf('</head>');
                    htmlPluginData.html = insertAt(htmlPluginData.html, `<style>${skeletonCSS}</style>`, headTagEndPos);

                    // replace mounted point with ssr result in html
                    let appPos = htmlPluginData.html.lastIndexOf(insertAfter) + insertAfter.length;

                    // inject router code in SPA mode
                    let routerScript = '';
                    if (router) {
                        let isMPA = !!(Object.keys(skeletonEntries).length > 1);
                        routerScript = generateRouterScript(router, minimize, isMPA, entryKey);
                    }
                    htmlPluginData.html = insertAt(htmlPluginData.html, skeletonHtml + routerScript, appPos);
                    callback(null, htmlPluginData);
                }).catch((e) => {
                    console.log(e);
                });
            });
        });
    }

    static loader(ruleOptions = {}) {
        return Object.assign(ruleOptions, {
            loader: require.resolve('./loader'),
            options: Object.assign({}, ruleOptions.options)
        });
    }
}

module.exports = SkeletonPlugin;
