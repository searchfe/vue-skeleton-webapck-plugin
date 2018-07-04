/**
 * @file loader
 * @desc Insert route of skeleton into router.js, so that developer can
 * visit route path in dev mode to debug skeleton components
 * @author panyuqi <panyuqi@baidu.com>
 */

/* eslint-disable fecs-no-require */

var loaderUtils = require('loader-utils');
var ref = require('crypto');
var createHash = ref.createHash;
var insertAt = require('./util').insertAt;

var DEFAULT_LOADER_OPTIONS = {
    // template of importing skeleton component
    importTemplate: 'import [nameHash] from \'@/pages/[nameCap].vue\';',
    // template of route path
    routePathTemplate: '/skeleton-[name]',
    // position to insert route object in router.js file
    insertAfter: 'routes: ['
};

var ENTRY_NAME_HOLDER = /\[name\]/gi;
var ENTRY_NAME_CAP_HOLDER = /\[nameCap\]/gi;
var ENTRY_NAME_HASH_HOLDER = /\[nameHash\]/gi;

module.exports = function (source) {
    var options = Object.assign({}, DEFAULT_LOADER_OPTIONS, loaderUtils.getOptions(this));
    var entry = options.entry;
    var importTemplate = options.importTemplate;
    var routePathTemplate = options.routePathTemplate;
    var insertAfter = options.insertAfter;

    // find position to insert in router.js
    var routesPos = source.indexOf(insertAfter) + insertAfter.length;

    entry = Array.isArray(entry) ? entry : [entry];

    entry.forEach(function (entryName) {
        // capitalize first letter in entryName eg.skeleton -> Skeleton
        var entryCap = entryName.replace(/([a-z])(.*)/, function (w, firstLetter, rest) { return firstLetter.toUpperCase() + rest; });
        var entryHash = "_" + ((new Date()).getTime()) + (createHash('md5').update(entryName + '-skeleton').digest('hex'));

        // replace placeholder in routeTpl and importTpl
        var ref = [routePathTemplate, importTemplate].map(
                function (pathStr) { return pathStr.replace(ENTRY_NAME_HOLDER, entryName)
                    .replace(ENTRY_NAME_CAP_HOLDER, entryCap)
                    .replace(ENTRY_NAME_HASH_HOLDER, entryHash); }
            );
        var skeletonRoutePath = ref[0];
        var importExpression = ref[1];

        // route object to insert
        var routeExpression = "{\n            path: '" + skeletonRoutePath + "',\n            name: 'skeleton-" + entryName + "',\n            component: " + entryHash + "\n        },";

        // insert route object into routes array
        source = insertAt(source, routeExpression, routesPos);

        // insert import sentence in the head
        source += importExpression;
    });

    return source;
};
