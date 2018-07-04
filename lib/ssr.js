/**
 * @file ssr
 * @desc Use vue ssr to render skeleton components. The result contains html and css.
 * @author panyuqi <panyuqi@baidu.com>
 */

/* eslint-disable no-console, fecs-no-require */

var path = require('path');
var webpack = require('webpack');
var NodeTemplatePlugin = require('webpack/lib/node/NodeTemplatePlugin');
var NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin');
var LoaderTargetPlugin = require('webpack/lib/LoaderTargetPlugin');
var LibraryTemplatePlugin = require('webpack/lib/LibraryTemplatePlugin');
var SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');
var MultiEntryPlugin = require('webpack/lib/MultiEntryPlugin');
var ExternalsPlugin = require('webpack/lib/ExternalsPlugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var createBundleRenderer = require('vue-server-renderer').createBundleRenderer;
var nodeExternals = require('webpack-node-externals');

module.exports = function renderSkeleton (serverWebpackConfig, ref) {
    var quiet = ref.quiet; if ( quiet === void 0 ) quiet = false;
    var compilation = ref.compilation;
    var context = ref.context;

    var ref$1 = compilation.outputOptions;
    var outputPath = ref$1.path;
    var outputPublicPath = ref$1.publicPath;
    // get entry name from webpack.conf
    var outputJSPath = path.join(outputPath, serverWebpackConfig.output.filename);
    var outputBasename = path.basename(outputJSPath, path.extname(outputJSPath));
    var outputCssBasename = outputBasename + ".css";
    var outputCSSPath = path.join(outputPath, outputCssBasename);

    if (!quiet) {
        console.log(("Generate skeleton for " + outputBasename + "..."));
    }

    // if user passed in some special module rules for Skeleton, use it directly
    var originalRules = compilation.options.module.rules;
    if (serverWebpackConfig.module && serverWebpackConfig.module.rules) {
        compilation.options.module.rules = serverWebpackConfig.module.rules;
    }
    else {
        // otherwise use rules from parent compiler
        var vueRule = compilation.options.module.rules.find(function (rule) {
            return rule.test && rule.test.test('test.vue');
        });

        if (vueRule.use && vueRule.use.length) {
            var vueLoader = vueRule.use.find(function (rule) {
                return rule.loader = 'vue-loader';
            });

            vueLoader.options.extractCSS = true;
            delete vueLoader.options.loaders;
        }
    }

    var outputOptions = {
        filename: outputJSPath,
        publicPath: outputPublicPath
    };

    var childCompiler = compilation.createChildCompiler('vue-skeleton-webpack-plugin-compiler', outputOptions);

    childCompiler.context = context;
    new LibraryTemplatePlugin(undefined, 'commonjs2').apply(childCompiler);
    new NodeTargetPlugin().apply(childCompiler);
    if (Array.isArray(serverWebpackConfig.entry)) {
        new MultiEntryPlugin(context, serverWebpackConfig.entry, undefined).apply(childCompiler);
    }
    else {
        new SingleEntryPlugin(context, serverWebpackConfig.entry, undefined).apply(childCompiler);
    }
    new LoaderTargetPlugin('node').apply(childCompiler);
    new ExternalsPlugin('commonjs2', serverWebpackConfig.externals || nodeExternals({
        whitelist: /\.css$/
    })).apply(childCompiler);
    new ExtractTextPlugin({
        filename: outputCSSPath
    }).apply(childCompiler);

    return new Promise(function (resolve, reject) {
        childCompiler.runAsChild(function (err, entries, childCompilation) {
            if (childCompilation && childCompilation.errors && childCompilation.errors.length) {
                var errorDetails = childCompilation.errors.map(function (error) { return error.message + (error.error ? ':\n' + error.error : ''); }).join('\n');
                reject(new Error('Child compilation failed:\n' + errorDetails));
            }
            else if (err) {
                reject(err);
            }
            else {
                var bundle = childCompilation.assets[outputJSPath].source();
                var skeletonCSS = '';
                if (childCompilation.assets[outputCSSPath]) {
                    skeletonCSS = childCompilation.assets[outputCSSPath].source();
                }

                // delete JS & CSS files
                delete compilation.assets[outputJSPath];
                delete compilation.assets[outputCSSPath];
                delete compilation.assets[(outputJSPath + ".map")];
                delete compilation.assets[(outputCSSPath + ".map")];
                // create renderer with bundle
                var renderer = createBundleRenderer(bundle);
                // use vue ssr to render skeleton
                renderer.renderToString({}, function (err, skeletonHtml) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        compilation.options.module.rules = originalRules;
                        resolve({skeletonHtml: skeletonHtml, skeletonCSS: skeletonCSS});
                    }
                });
            }
        });
    });
};
