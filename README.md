# 设计师插件

> [en-US](./README_en.md)

## 介绍

Gaia Sketch 一款为开发和设计师而设计的一款基于Sketch的插件，对于设计师来说可以通过Gaia Sketch建立起标准库（包括：组件库、样式库、图标库、页面库、Deign Token库），也可以通过Gaia Sketch插件导出更为简单易用的【标注文件】；对于开发来说，可以通过Gaia Sketch插件能将Sketch设计稿中的图层导出为代码（GaiaX、React、Rax、Vue、小程序等）

[语雀知识库地址](https://www.yuque.com/youku-gaia/gaia-sketch)

整体架构基于 [skpm/with-webview](https://github.com/skpm/with-webview)，界面基于 [FluentUI](https://github.com/microsoft/fluentui) 

* 标准库

  * [组件库](./docs/zh-CN/component.md)
  * [样式库](./docs/zh-CN/style.md)
  * [图标库](./docs/zh-CN/iconfont.md)
  * [页面库](./docs/zh-CN/page.md)
  * [Deign Token库](./docs/zh-CN/design-token.md)

  * 配置内部的标准库平台（基于 [Gitlab v3 API](https://gitlab.com/gitlab-org/gitlab-foss/-/tree/8-16-stable)）

    如果你已有内部的Gitlab服务，你就能通过简单的配置搭建自己的标准库平台，无需额外的编码

    * [服务配置](./docs/zh-CN/server.md)
    * [上传](./docs/zh-CN/upload.md)
    * [更新](./docs/zh-CN/update.md)
    * [管理](./docs/zh-CN/management.md)

* [导出标注](./docs/zh-CN/export-measure.md)

* [导出代码](./docs/zh-CN/export-code.md)

## 开发
   
### 安装依赖
```sh
cd gaia-sketch/sketch 

yarn

yarn watch
```

```sh
cd gaia-sketch/app

yarn

yarn start
```

## 打包

```sh
cd gaia-sketch

make
```

### 日志
```js
logger.log()
logger.info()
logger.warn()
logger.error()
// ~/Library/Logs/com.bohemiancoding.sketch3
```


# 行为准则

请参考 [Alibaba Open Source Code of Conduct](https://github.com/AlibabaDR/community/blob/master/CODE_OF_CONDUCT_zh.md)


# 开源协议

Gaia Sketch is licensed under the Apache License, Version 2.0. See LICENSE for the full license text.
