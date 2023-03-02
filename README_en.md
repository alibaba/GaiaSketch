# Gaia Sketch

## Introduction

Gaia Sketch is a Sketch-based plug-in designed for developers and designers. For designers, standard libraries can be established through Gaia Sketch (including: component library, style library, icon library, page library, Deign Token library ), you can also export a simpler and easier-to-use [markup file] through the Gaia Sketch plug-in; for development, you can use the Gaia Sketch plug-in to export the layers in the Sketch design draft as code (GaiaX, React, Rax, Vue , applet, etc.)

[YuQue](https://www.yuque.com/youku-gaia/gaia-sketch)


The overall architecture is based on [skpm/with-webview](https://github.com/skpm/with-webview), and the interface is built on [FluentUI](https://github.com/microsoft/fluentui)

* Standard library

    * [Component library](./docs/en-US/component.md)
    * [Style Library](./docs/en-US/style.md)
    * [icon library](./docs/en-US/iconfont.md)
    * [Page Library](./docs/en-US/page.md)
    * [Design Token library](./docs/en-US/design-token.md)

    * Configure the internal standard library platform (based on [Gitlab v3 API](https://gitlab.com/gitlab-org/gitlab-foss/-/tree/8-16-stable))

      If you already have an internal Gitlab service, you can build your own standard library platform with simple configuration without additional coding

        * [Service Configuration](./docs/en-US/server.md)
        * [Upload](./docs/en-US/upload.md)
        * [Update](./docs/en-US/update.md)
        * [Management](./docs/en-US/management.md)

* [Export Measure](./docs/en-US/export-measure.md)

* [Export code](./docs/en-US/export-code.md)

## Development

### Install dependencies
````sh
cd gaia-sketch/sketch

yarn

yarn watch
````

````sh
cd gaia-sketch/app

yarn

yarn start
````

## Build

### Excuting an order

````sh
cd gaia-sketch

make
````

# Code of Conduct

Please refer to [Alibaba Open Source Code of Conduct](https://github.com/AlibabaDR/community/blob/master/CODE_OF_CONDUCT.md) 


# LICENSE

Gaia Sketch is licensed under the Apache License, Version 2.0. See LICENSE for the full license text.
