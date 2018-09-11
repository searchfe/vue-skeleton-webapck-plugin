/**
 * @file utils
 * @author panyuqi <panyuqi@baidu.com>
 */

/* eslint-disable fecs-no-require */
const pathToRegexp = require('path-to-regexp');
const uglifyJS = require('uglify-es');

const DEFAULT_PATH = '*';

module.exports = {
    insertAt: (origin, str, pos) => {
        return [
            origin.slice(0, pos),
            str,
            origin.slice(pos)
        ].join('');
    },

    isObject: (obj) => Object.prototype.toString.call(obj).match('Object'),

    isFunction: (func) => func && Object.prototype.toString.call(func) === '[object Function]',

    routes2Reg: (routes) => {
        let reg;
        if (typeof routes === 'string') {
            reg = pathToRegexp(routes);
        }
        else if (routes instanceof RegExp) {
            return routes;
        }

        return reg;
    },

    generateRouterScript: ({mode = 'history', routes = []},  minimize = false, isMPA, entryName) => {
        // format routes if it's an object
        if (module.exports.isObject(routes)) {
            routes = Object.keys(routes).map(key => {
                return {
                    path: key,
                    skeletonId: routes[key]
                };
            });
        }

        let skeletonsClause = [];
        let switchClause = [];

        if (isMPA) {
            routes = routes.filter(route => route.entryName === entryName);
        }

        routes.forEach(({skeletonId, path}, i) => {
            // convert route string to regexp
            path = path === '*'
                ? /^.*$/
                : module.exports.routes2Reg(path);

            skeletonsClause.push(`{
                id: '${skeletonId}',
                el: document.querySelector('#${skeletonId}')
            }`);

            switchClause.push(`
                ${i === 0 ? '' : 'else '}if (isMatched(${path}, '${mode}')) {
                    showSkeleton('${skeletonId}');
                }
            `);
        });

        let sourceScript = `
            var pathname = window.location.pathname;
            var hash = window.location.hash;
            var skeletons = [${skeletonsClause.join(',')}];
            var isMatched = function(pathReg, mode) {
                if (mode === 'hash') {
                    return pathReg.test(hash.replace('#', ''));
                }
                else if (mode === 'history') {
                    return pathReg.test(pathname);
                }
                return false;
            };
            var showSkeleton = function(skeletonId) {
                for (var i = 0; i < skeletons.length; i++) {
                    var skeleton = skeletons[i];
                    if (skeletonId === skeleton.id) {
                        skeleton.el.style = 'display:block;';
                    }
                    else {
                        skeleton.el.style = 'display:none;';
                    }
                }
            };
            ${switchClause.join('')}
        `;

        // use uglify to minimize source code maybe in prod mode
        if (minimize) {
            let {error, code} = uglifyJS.minify(sourceScript);
            if (!error) {
                sourceScript = code.toString();
            }
            else {
                console.error(error);
            }
        }
        return `<script>${sourceScript}</script>`;
    }
}
