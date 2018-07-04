/**
 * @file utils
 * @author panyuqi <panyuqi@baidu.com>
 */

/* eslint-disable fecs-no-require */
var pathToRegexp = require('path-to-regexp');
var uglifyJS = require('uglify-es');

var DEFAULT_PATH = '*';

module.exports = {
    insertAt: function (origin, str, pos) {
        return [
            origin.slice(0, pos),
            str,
            origin.slice(pos)
        ].join('');
    },

    isObject: function (obj) { return Object.prototype.toString.call(obj).match('Object'); },

    routes2Reg: function (routes) {
        var reg;
        if (typeof routes === 'string') {
            reg = pathToRegexp(routes);
        }
        else if (routes instanceof RegExp) {
            return routes;
        }

        return reg;
    },

    generateRouterScript: function (ref,  minimize, isMPA, entryName) {
        var mode = ref.mode; if ( mode === void 0 ) mode = 'history';
        var routes = ref.routes; if ( routes === void 0 ) routes = [];
        if ( minimize === void 0 ) minimize = false;

        // format routes if it's an object
        if (module.exports.isObject(routes)) {
            routes = Object.keys(routes).map(function (key) {
                return {
                    path: key,
                    skeletonId: routes[key]
                };
            });
        }

        var skeletonsClause = [];
        var switchClause = [];

        if (isMPA) {
            routes = routes.filter(function (route) { return route.entryName === entryName; });
        }

        routes.forEach(function (ref, i) {
            var skeletonId = ref.skeletonId;
            var path = ref.path;

            // convert route string to regexp
            path = path === '*'
                ? /^.*$/
                : module.exports.routes2Reg(path);

            skeletonsClause.push(("{\n                id: '" + skeletonId + "',\n                el: document.querySelector('#" + skeletonId + "')\n            }"));

            switchClause.push(("\n                " + (i === 0 ? '' : 'else ') + "if (isMatched(" + path + ", '" + mode + "')) {\n                    showSkeleton('" + skeletonId + "');\n                }\n            "));
        });

        var sourceScript = "\n            var pathname = window.location.pathname;\n            var hash = window.location.hash;\n            var skeletons = [" + (skeletonsClause.join(',')) + "];\n            var isMatched = function(pathReg, mode) {\n                if (mode === 'hash') {\n                    return pathReg.test(hash.replace('#', ''));\n                }\n                else if (mode === 'history') {\n                    return pathReg.test(pathname);\n                }\n                return false;\n            };\n            var showSkeleton = function(skeletonId) {\n                for (var i = 0; i < skeletons.length; i++) {\n                    var skeleton = skeletons[i];\n                    if (skeletonId === skeleton.id) {\n                        skeleton.el.style = 'display:block;';\n                    }\n                    else {\n                        skeleton.el.style = 'display:none;';\n                    }\n                }\n            };\n            " + (switchClause.join('')) + "\n        ";

        // use uglify to minimize source code maybe in prod mode
        if (minimize) {
            var ref$1 = uglifyJS.minify(sourceScript);
            var error = ref$1.error;
            var code = ref$1.code;
            if (!error) {
                sourceScript = code.toString();
            }
            else {
                console.error(error);
            }
        }
        return ("<script>" + sourceScript + "</script>");
    }
}
