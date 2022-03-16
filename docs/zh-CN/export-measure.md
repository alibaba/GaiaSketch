# 导出标注

【导出标注】功能能够将sketch源文件中的画板导出为标注文件供开发使用，导出的【标注文件】具有更好的兼容性、更易用的界面、以及完善的Design Token的支持

<img src="https://img.alicdn.com/imgextra/i4/O1CN01XvnBIq1EL11XjO4TE_!!6000000000334-2-tps-3486-2292.png" alt="drawing" width="80%"/>

## 功能

### 入口

一：

【菜单栏】-【导出标注】

二：

【工具条】-【导出标注】

### 界面

<img src="https://img.alicdn.com/imgextra/i1/O1CN01DY3Wci1oe5gi1tBki_!!6000000005249-2-tps-806-1244.png" alt="drawing" width="30%"/>

#### 选择要导出的画板

支持多个【页面】和多个【画板】的导出，导出的单位为【画板】

#### 单位

支持直接输入单位名称，默认`px`

#### Design Token

如果已经按照[文档](./server.md)配置了【Design Token】服务，下拉框中会展示出已有的Design Token库，也可以在下拉选项中选择【点击此处选择本地选择Deign Token库】然后在对话框中选择本地的Deign Token库

## 产物

<img src="https://img.alicdn.com/imgextra/i3/O1CN013st0JC1T9J8QDbIp1_!!6000000002339-2-tps-1592-842.png" alt="drawing" width="80%"/>

生成的产物中主要包含两个部分，一部分是通过`gaia-measure`项目生成的标注模板文件，另一部分包括设计稿相关数据信息，比如画板截图，图层数据、切图等

### 数据

#### data.js

data.js主要包括设计稿中的【页面】和【画板】相关信息，包括名称、ID、【页面】和【画板】间的关系，如果导出时选择了Design Token，解析后的Design Token数据也会在此文件中

#### artboards

包括每个【画板】的截图（.png文件）以及尺寸、图层层级和样式信息（.js文件）

#### slices

主要包括两个文件夹或者其中之一，【auto】和【preset】

【auto】文件夹内包含了插件在遍历图层时，认为可能是图片的图层或者可以当初图片的图层集合，可以在设计师没有预设切图时自动生成切图，包含两种尺寸 `@2x` 和` @3x`

【preset】文件夹内包含了设计师在设计稿中预设的切图，比如通过Sketch软件创建的Slice图层，或者在设计稿的相关图层上设置了【导出项】

### 标注模板

标注模板包括index.html、asset-manifest.json、src/、static目录中的内容，由`gaia-measure`项目生成，具体内容可以参考该项目的相关介绍
