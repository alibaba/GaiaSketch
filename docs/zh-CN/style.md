# 样式库

每个样式库由一个或者多个 Symbol 构成，每个 Symbol 按照一定的格式命名后，插件就能读取并可视化展示在插件中，点击可视化后的样式可直接格式化 Sketch 设计稿中且与原库保持关联

## 命名

每个 Symbol 的名称遵循着标准的格式命名，名称以 `/` 连接，比如 `背景色/图片背景色` ，插件【样式库】可解析的 Symbol 命名必须需要至少包含1 `/` 或以上，如果当前Symbol代表颜色，那么他的子节点必须是`矩形`类型的图层，如果代表文字，那么他的节点必须是`文本`类型的图层，插件在解析样式库时，会根据子节点的类型来判断当前Symbol是应该在【文字】分类，还是应该在【颜色】分类, 如果当前Symbol想要和Design Token关联，可以将子节点的名称命名为Design Token，如下图所示：

<img src="https://img.alicdn.com/imgextra/i2/O1CN01ztr1j31b5euFr4TCt_!!6000000003414-2-tps-1824-326.png" alt="drawing" width="50%"/>

导入到插件后，可视化展示的效果如下：

<img src="https://img.alicdn.com/imgextra/i4/O1CN01MugvtI1NHeerOo6nA_!!6000000001545-2-tps-726-732.png" alt="drawing" width="20%"/>

【文字】或者【颜色】 是第一层目录，【背景色】是第二层目录，后面部分当成样式的名称展示，如果子节点的名称是Design Token，会当做副标题展示

## 如何制作一个样式库

每个样式库都是一个 sketch 文件，每个 sketch 文件里有一个或者多个 Symbol，插件遍历样式库中符合命名规则的 Symbol

[样式库示例.sketch](../examples/style.sketch)

## 如何将样式库导入到插件

### 方式一：

1. 选择【样式】Tab

2. 点击右侧的下拉箭头，选择【导入】

3. 在弹出的对话框中选择要导入的本地样式库（.sketch文件），确认后插件会自动解析该本地样式库并可视化展示符合命名规则的样式

<img src="https://img.alicdn.com/imgextra/i4/O1CN01r0UtQz1uwlWpjjwpH_!!6000000006102-2-tps-806-318.png" alt="drawing" width="40%"/>

### 方式二：

1. 选择Sketch菜单项，选择【Sketch】 -> 【首选项...】 -> 【组件库】

2. 拖拽.sketch文件到【样式库】中的【本地组件库】

3. 打开插件，选择插件的【样式】Tab，在上方的下拉列表中选择刚导入的样式库

## 如何使用已导入的样式库

1. 选择【样式】Tab

2. 在顶部的下拉组件中选择展示的样式库

3. 先在Sketch设计稿选择要格式化的图层，然后在可视化的界面，点击【文字】下的样式可以格式化Sketch设计稿中的`Text`图层，点击【颜色】分类下的样式可以格式化Sketch设计稿中的`Text`或者`Shape`类型的图层

> 当通过点击带有Design Token的样式格式化设计稿中的图层时，插件会将此Token直接和目标格式化的图层关联，以解决1个颜色对应多个Design Token的问题，经过关联后的图层在用插件的【导出标注】功能导出的标注文件中可以直接展示格式化后的Design Token

## 如何将已导入的样式库从插件中移除

1. 在【样式】tab对应的页面上，点击右上角的下拉图标

2. 点击【移除】

<img src="https://img.alicdn.com/imgextra/i3/O1CN01ZC0Ccf1rH8gbpe1s8_!!6000000005605-2-tps-800-342.png" alt="drawing" width="40%"/>
