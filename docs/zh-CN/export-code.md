# 导出代码

【导出代码】能够将Sketch设计稿中选中的图层导出为选定的语言类型的代码，比如`GaiaX模板`、`React`、`Rax`、`Vue`、`小程序`等，导出的代码布局方式基于盒子模型布局（Flexbox）和绝对布局（Absolute）；对于节点的层级，【导出代码】会在导出的过程中进行不断的优化，使层级尽可能的少且合理

## 功能

### 入口

一：

【菜单栏】-【导出代码】

二：

【工具条】-【导出代码】

[导出代码示例源文件(.sketch)](../examples/export-code&measure.sketch)

### 界面

<img src="https://img.alicdn.com/imgextra/i3/O1CN01nJiKhO1PPYj4KxFz7_!!6000000001833-2-tps-800-1092.png" alt="drawing" width="30%"/>

### 导出代码

步骤

1. 先在设计稿中选择要导出的图层
   
2. 打开【导出代码】功能，在预览区域会展示出已选择的图层的截图，以便确认是否是想要导出的图层，然后要导出的代码的语言类型，目前包括`GaiaX`、`React`、`Rax`、`Vue`、`小程序`等类型，支持多选

3. 点击【导出代码】

> 如果导出的语言类型为GaiaX，在导出成功页面可以直接将GaiaX模板导入到IDE中预览编辑，还没下载IDE，请先下载

<img src="https://img.alicdn.com/imgextra/i3/O1CN01hizRQB1lsnYhoDQss_!!6000000004875-2-tps-578-480.png" alt="drawing" width="30%"/>

4. 产物（以GaiaX为例）

<img src="https://img.alicdn.com/imgextra/i2/O1CN01Q21osl1RGW8c0IiIo_!!6000000002084-2-tps-1448-272.png" alt="drawing" width="70%"/>

* @2x.png：选中图层的截图
* assets：认为是图片的图层或者图层集合生成的截图
* GaiaX：选择导出的语言类型的代码

## 原理

【导出代码】的目标是尽可能的不对设计师有要求，能够在设计师任意的设计稿中使用，一般情况下，我们推荐使用【导出代码】导出可复用的模块，然后再通过搭建系统来通过已导出的可复用模板组装页面

整体流程如下

<img src="https://img.alicdn.com/imgextra/i1/O1CN01P2Zy7X1RuMb1XRQT8_!!6000000002171-2-tps-1093-547.png" alt="drawing" width="100%"/>

## 如何导出自定义的语言

如果要导出自定义类型语言的代码，【预处理】和【虚拟节点生成器】功能可以复用，不用修改，【标签生成器】部分新建个类继承 sketch/src/code/core/Convertor 的基类，然后按照协议实现返回自定义语言类型的信息

