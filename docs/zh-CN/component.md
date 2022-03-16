# 组件库

每个组件库由一个或者多个 Symbol 构成，每个 Symbol 按照一定的格式命名后，插件就能读取并可视化展示在插件中，并可将可视化后的组件直接拖拽到 Sketch 设计稿中且与原库保持关联

## 命名

每个 Symbol 的名称遵循着标准的格式命名，名称以 `/` 连接，比如 `Foundation/Bar/TabBar` ，插件【组件库】可解析的 Symbol 命名必须需要至少包含2 `/` 或以上

<img src="https://img.alicdn.com/imgextra/i2/O1CN01t7Q4Tz1hFdDyiaHAY_!!6000000004248-2-tps-1548-786.png" alt="drawing" width="40%"/>

导入到插件后，可视化展示的效果如下：

<img src="https://img.alicdn.com/imgextra/i3/O1CN01OB8h4P1h9Dg5suVjV_!!6000000004234-2-tps-584-492.png" alt="drawing" width="40%"/>

Foundation 是第一层目录，Bar 是第二层目录，后面部分当成组件的名称展示

## 如何制作一个组件库

每个组件库都是一个 sketch 文件，每个 sketch 文件里有一个或者多个 Symbol，插件遍历组件库中符合命名规则的 Symbol

[组件库示例.sketch](../examples/component.sketch)

## 如何将组件库导入到插件

### 方式一：

1. 选择【组件】Tab

2. 点击右侧的下拉箭头，选择【导入】

3. 在弹出的对话框中选择要导入的本地组件库（.sketch文件），确认后插件会自动解析该本地组件库并可视化展示符合命名规则的组件

<img src="https://img.alicdn.com/imgextra/i3/O1CN01j8aIqX1v6NqYiYoV6_!!6000000006123-2-tps-800-368.png" alt="drawing" width="40%"/>

### 方式二：

1. 选择Sketch菜单项，选择【Sketch】 -> 【首选项...】 -> 【组件库】
   
2. 拖拽.sketch文件到【组件库】中的【本地组件库】

3. 打开插件，选择插件的【组件】Tab，在上方的下拉列表中选择刚导入的组件库

## 如何使用已导入的组件库

1. 选择【组件】Tab

2. 在顶部的下拉组件中选择展示的组件库

3. 在可视化展示的组件页面选择任意一个组件拖拽到Sketch设计稿中使用

## 如何将已导入的组件库从插件中移除

1. 在【组件】tab对应的页面上，点击右上角的下拉图标

2. 点击【移除】

<img src="https://img.alicdn.com/imgextra/i2/O1CN01EsFVPC1eUnUY1LGQ9_!!6000000003875-2-tps-802-398.png" alt="drawing" width="40%"/>
