# 页面库


每个页面库由一个或者多个 Symbol 构成，每个 Symbol 按照一定的格式命名后，插件就能读取并可视化展示在插件中，并可将可视化后的页面直接拖拽到 Sketch 设计稿中且与原库保持关联

## 命名

每个 Symbol 的名称遵循着标准的格式命名，名称以 `/` 连接，比如 `首页/页面1` ，插件【页面库】可解析的 Symbol 命名必须需要至少包含1 `/` 或以上

<img src="https://img.alicdn.com/imgextra/i3/O1CN01OfQD9b1EiNDnNG0Ug_!!6000000000385-2-tps-1378-630.png" alt="drawing" width="40%"/>

导入到插件后，可视化展示的效果如下：

<img src="https://img.alicdn.com/imgextra/i3/O1CN01mdT4Zx27SA4NRESWH_!!6000000007795-2-tps-806-576.png" alt="drawing" width="40%"/>

首页 是第一层目录，后面部分当成页面的名称展示

## 如何制作一个页面库

每个页面库都是一个 sketch 文件，每个 sketch 文件里有一个或者多个 Symbol， 插件遍历页面库中符合命名规则的 Symbol

[页面库示例.sketch](../examples/page.sketch)

## 如何将页面库导入到插件

### 方式一：

1. 选择【页面】Tab

2. 点击右侧的下拉箭头，选择【导入】

3. 在弹出的对话框中选择要导入的本地页面库（.sketch文件），确认后插件会自动解析该本地页面库并可视化展示符合命名规则的页面

<img src="https://img.alicdn.com/imgextra/i4/O1CN013NTud71MFzbbprKsK_!!6000000001406-2-tps-806-358.png" alt="drawing" width="40%"/>

### 方式二：

1. 选择Sketch菜单项，选择【Sketch】 -> 【首选项...】 -> 【组件库】
   
2. 拖拽.sketch文件到【组件库库】中的【本地组件库】

3. 打开插件，选择插件的【页面】Tab，在上方的下拉列表中选择刚导入的页面库

## 如何使用已导入的页面库

1. 选择【页面】Tab

2. 在顶部的下拉页面中选择展示的页面库

3. 在可视化展示的页面选择任意一个页面拖拽到Sketch设计稿中使用

## 如何将已导入的页面库从插件中移除

1. 在【页面】tab对应的页面上，点击右上角的下拉图标

2. 点击【移除】

<img src="https://img.alicdn.com/imgextra/i4/O1CN01FZ2IGo1Gh7MoOo6Na_!!6000000000653-2-tps-804-374.png" alt="drawing" width="40%"/>
