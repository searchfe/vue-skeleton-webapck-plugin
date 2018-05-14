/**
 * @file skeleton conf
 * @author panyuqi (pyqiverson@gmail.com)
 */

/* eslint-disable fecs-no-require */

'use strict';

const path = require('path');
const utils = require('./utils');
const merge = require('webpack-merge');
const baseWebpackConfig = require('./webpack.base.conf');
const MultipageWebpackPlugin = require('multipage-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const SkeletonWebpackPlugin = require('../../lib');

function resolve(dir) {
    return path.join(__dirname, dir);
}

let webpackConfig = merge(baseWebpackConfig, {
    module: {
        rules: utils.styleLoaders({
            sourceMap: false,
            extract: true
        }).concat(SkeletonWebpackPlugin.loader({
            include: [
                resolve('src/pages/page1/entry.js'),
                resolve('src/pages/page2/entry.js')
            ],
            options: {
                entry: ['page1', 'page2'],
                routePathTemplate: '/[name]-skeleton',
                insertAfter: 'routes: [',
                importTemplate: 'import [name] from \'./[name].skeleton.vue\';'
            }
        }))
    },
    devtool: false,
    plugins: [

        new ExtractTextPlugin({
            filename: utils.assetsPath('css/[name].css')
        }),

        new SkeletonWebpackPlugin({
            webpackConfig: {
                entry: {
                    page1: resolve('./src/pages/page1/entry-skeleton.js'),
                    page2: resolve('./src/pages/page2/entry-skeleton.js')
                }
            }
        }),

        new MultipageWebpackPlugin({
            bootstrapFilename: 'manifest',
            templateFilename: '[name].html',
            templatePath: resolve('dist'),
            htmlTemplatePath: resolve('./index.html'),
            htmlWebpackPluginOptions: {
                inject: true
            }
        })
    ]
});

module.exports = webpackConfig;
