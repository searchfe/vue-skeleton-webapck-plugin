vue-skeleton-webpack-plugin
===================

[![npm version](https://badge.fury.io/js/vue-skeleton-webpack-plugin.svg)](https://badge.fury.io/js/vue-skeleton-webpack-plugin)
[![Build Status](https://travis-ci.org/lavas-project/vue-skeleton-webpack-plugin.svg?branch=master)](https://travis-ci.org/lavas-project/vue-skeleton-webpack-plugin)

[![NPM](https://nodei.co/npm/vue-skeleton-webpack-plugin.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/vue-skeleton-webpack-plugin/)

这是一个基于 Vue 的 webpack 插件，为单页/多页应用生成骨架屏 skeleton，减少白屏时间，在页面完全渲染之前提升用户感知体验。

支持 webpack@3 和 webpack@4，支持 Hot reload。

## 基本实现

参考了[饿了么的 PWA 升级实践](https://huangxuan.me/2017/07/12/upgrading-eleme-to-pwa/)一文，
使用服务端渲染在构建时渲染 skeleton 组件，将 DOM 和样式内联到最终输出的 html 中。

另外，为了开发时调试方便，会将对应路由写入`router.js`中，可通过`/skeleton`路由访问。

插件具体实现可参考[我的这篇文章](https://xiaoiver.github.io/coding/2017/07/30/%E4%B8%BAvue%E9%A1%B9%E7%9B%AE%E6%B7%BB%E5%8A%A0%E9%AA%A8%E6%9E%B6%E5%B1%8F.html)

## 使用方法

安装：
```bash
npm install vue-skeleton-webpack-plugin
```

运行测试用例：
```bash
npm run test
```

在 webpack 中引入插件：
```js
// webpack.conf.js
import SkeletonWebpackPlugin from 'vue-skeleton-webpack-plugin';

plugins: [
    new SkeletonWebpackPlugin({
        webpackConfig: {
            entry: {
                app: resolve('./src/entry-skeleton.js')
            }
        }
    })
]
```

## 参数说明

### SkeletonWebpackPlugin

- webpackConfig *必填*，渲染 skeleton 的 webpack 配置对象
- insertAfter *选填*，渲染 DOM 结果插入位置，默认值为字符串 `'<div id="app">'`
    - 也可以传入 `Function`，方法签名为 `insertAfter(entryKey: string): string`，返回值为挂载点字符串
- quiet *选填*，在服务端渲染时是否需要输出信息到控制台
- router *选填* SPA 下配置各个路由路径对应的 Skeleton
    - mode *选填* 路由模式，两个有效值 `history|hash`
    - routes *选填* 路由数组，其中每个路由对象包含两个属性：
        - path 路由路径
        - skeletonId Skeleton DOM 的 id
- minimize *选填* SPA 下是否需要压缩注入 HTML 的 JS 代码

### [DEPRECATED] SkeletonWebpackPlugin.loader

开发模式已经支持 hot reload，该参数不再需要。

## 示例

### Lavas 创建的项目

如果你的项目是使用 Lavas 创建的，可参考[Lavas Appshell模版](https://github.com/lavas-project/lavas-template-vue-appshell)和[Lavas MPA模版](https://github.com/lavas-project/lavas-template-vue-mpa) 中的应用。

### vue-cli 创建的项目

如果你的项目是使用 vue-cli 创建的，可以参考基于 Vue Webpack 模板应用这个插件的例子：
SPA 中单个 Skeleton：
* [Github](https://github.com/xiaoiver/skeleton-demo)
* [Online Demo](https://xiaoiver.github.io/skeleton-demo/#/)

SPA 中多个 Skeleton:
* [Github](https://github.com/xiaoiver/multi-skeleton-demo)
* [Online Demo](https://xiaoiver.github.io/multi-skeleton-demo/#/)

### 简单的 Vue + Webpack 应用

或者你可以参考[examples](https://github.com/lavas-project/vue-skeleton-webpack-plugin/tree/master/examples)下的测试用例，其中也包含了单页和多页情况，具体如下：
* `/examples/simple` 最简单的 SPA，使用一个 Skeleton
* `/examples/multi-skeleton` SPA，根据路由使用多个 Skeleton
* `/examples/multipage` MPA，每个页面使用各自的 Skeleton，使用 `multipage-webpack-plugin`
* `/examples/multipage2` MPA，每个页面使用各自的 Skeleton，使用多个 `html-webpack-plugin`
* `/examples/multipage3` MPA，page1 使用 Skeleton，page2 不使用
* `/examples/webpack4` SPA，使用 `webpack@4`

## 常见问题

### Webpack4

插件需要使用与 Webpack 版本配套的插件进行样式分离。

* Webpack 4 中使用 `mini-css-extract-plugin` 而非 `extract-text-webpack-plugin`，因此需要安装。
* 安装 `vue-loader@^15.0.0` 并正确配置，可以参考 [vue-loader 文档](https://vue-loader.vuejs.org/zh/guide/extract-css.html#webpack-4)。

### 未开启样式分离

运行出现如下错误：
> node_modules\memory-fs\lib\MemoryFileSystem.js:114
> throw new MemoryFileSystemError(errors.code.ENOENT, _path);

由于插件使用了 Vue 服务端渲染在构建时渲染 skeleton 组件，将 DOM 和样式内联到最终输出的 html 中。
因此在给 skeleton 使用的 Webpack 配置对象中需要开启**样式分离**，将 skeleton 使用的样式从 JS 中分离出来。

在 Webpack 中样式分离是通过 [extract-text-webpack-plugin](https://doc.webpack-china.org/plugins/extract-text-webpack-plugin) 插件实现的。因此在 `webpack.skeleton.config` 中必须正确配置该插件。

以使用 vue-cli 创建的项目为例，如果你的 `webpack.skeleton.conf` 继承自 `webpack.base.conf`，在开发模式下是默认关闭样式分离的，因此需要修改，可参考[修改方案](https://github.com/lavas-project/vue-skeleton-webpack-plugin/issues/11#issuecomment-377845362)。

### 压缩注入的 HTML 和 CSS

使用 `html-webpack-plugin` 的 `minify` 选项，可以参考 [#36](https://github.com/lavas-project/vue-skeleton-webpack-plugin/issues/36)。