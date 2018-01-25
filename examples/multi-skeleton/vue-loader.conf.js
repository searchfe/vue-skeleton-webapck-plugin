/**
 * @file vue-loader conf
 * @author panyuqi (pyqiverson@gmail.com)
 */

'use strict';

const utils = require('./utils');

module.exports = {
    loaders: utils.cssLoaders({
        sourceMap: false,
        extract: true
    })
};
