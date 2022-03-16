# Design Token库

开发在写UI时，通常的流程是设计师导出标注文件，然后开发拿到标注文件后选择某个图层查看坐标或者样式信息，通常这些信息都是以数值的形式呈现，比如标题的颜色是`#00ff00`，开发在代码中也写上对应的文本颜色为`#00ff00`，当某个时候，如果需要修改这个文本的颜色，就需要每个开发手动检查是否用到了这个颜色，如果用到了就手动修改，这个时候就会有遗漏的情况或者需要工作量

Design Token的作用就是将样式数值符号化、语义化，这样开发在赋值主标题的颜色时，就不是直接写色值，而是写色值对应的Token，这样以后再改主标题颜色时，就只需要改底层Token对应的值，无需使用的每个地方挨个检查修改`#00ff00`

比如我们定义主标题这个场景的颜色的Token

| 场景       | Design Token | 值      |
| ---------- | ------------ | ------- |
| 主标题颜色 | titleColor   | #00ff00 |

在代码中我们对主标题场景的颜色赋值

以iOS为例：

```objc
title.textColor = [UIColor titleColor];
```

> 系统的UIColor没有titleColor属性，需要客户端事先写一套底层SDK支持这种赋值方式

## 格式

对于插件来说，我们定义Design Token库是一个.xlsx文件,里面包含了Token和值的对应关系，然后通过一些定义，让.xlsx文件可编程化，实现复杂的逻辑关系

[Design Token库示例（.xlsx）](../examples/design-token.xlsx)

每个.xlsx文件由若干个工作表构成，且第一个工作表必须是【定义】工作表，如下图所示：

<img src="https://img.alicdn.com/imgextra/i3/O1CN018HnI1z1WQCat5VdBj_!!6000000002782-2-tps-1180-136.png" alt="drawing" width="40%"/>

### 【定义】工作表

<img src="https://img.alicdn.com/imgextra/i4/O1CN01MjDttW268dZW8O7CR_!!6000000007617-2-tps-2022-620.png" alt="drawing" width="70%"/>

工作表内的第一列代表我们要描述的样式名称，他们也是底部除了【定义】外，其他工作表的名称，比如我们第一列写上工作表分类：颜色，第二列、第三列以及后面的列是指的颜色可能对应的css属性，他们之间是 `或` 的关系，就是说碰到下面任意一个css属性时，都会去【颜色】工作表中找对应的Token：

* color： 文本颜色
  
* background-color：背景色（纯色）
  
* border-color：边框颜色（纯色）
  
* background-image：背景（线性渐变）
  
* border-image：边框（线性渐变）

> 当开发在点击标注文件上的图层后，在标注文件的右侧会展示出对应的样式，每个样式和css名称对应，只不过标注文件会通过自然的展示方式呈现，而不是直接写上css名称

<img src="https://img.alicdn.com/imgextra/i3/O1CN01OlaQVF20kIRPcPJxX_!!6000000006887-2-tps-1258-104.png" alt="drawing" width="70%"/>

以上介绍了一个css属性对应一个工作表分类的场景，还有一种情况是多个css属性对应一个工作表分类，比如一个文本可能由多个属性来决定，比如下方的就是由 `font-size（字号）` 和 `font-weight（字重）` 共同决定一个文本，`font-size` 和 `font-weight` 他们之间是 `与` 的关系，当然你也可以增加一个维度或者减少一个维度，比如增加一个`color`属性来和上述两个css属性共同决定一个文本

<img src="https://img.alicdn.com/imgextra/i2/O1CN01Tx0XJS20UGa4A2Ojn_!!6000000006852-2-tps-628-174.png" alt="drawing" width="40%"/>

> 请注意这几个维度的先后顺序，他们和【文本】工作表的值的先后顺序一致

### 其他的工作表

下面以【颜色】、【圆角】和【文本】举例解释内容，其他的工作表原理类似

第一列为【属性值】，第二列是【Token】的名称，第三列是【平台】，第四列是第三列平台对应的【示例代码】

#### 对应关系

属性值和Token之间的对应关系分为两种，一对一和一对多

##### 1. 一对一

一对一是指一个属性值对应一个token

##### 2. 一对多

一对多是指一个属性值对应了多个Token，也就是说同一个属性值，分别用在了不同场景，为了能让标注文件能够正确展示对应场景的Token，我们就需要制作【样式库】，然后格式化视觉稿，将图层和Token的关系对应起来，具体的操作步骤可参考[样式库文档](./style.md)

【颜色】工作表

<img src="https://img.alicdn.com/imgextra/i3/O1CN01rS17NH1Dz20rIMXFb_!!6000000000286-2-tps-2272-506.png" alt="drawing" width="100%"/>

上图的`primaryColor`、`primaryColorAlpha`、`linearGradientColor`这3个token就分别代表了`#00ff00`,`rgba(255,0,0,0.3)`,`线性渐变(0-0->1-1->#fb00aa-100%->#fb0000-100%)`,他们是一对一的关系

上图中的`场景1：填充色/一级(primaryFillColor)` 、`场景2：填充色/二级(secondaryFillColor)`、`场景3：其他（other_2）`分别是3中不同场景的token，并且他们都是对应同一个属性值`#fafafa`,在Excel中按照上图中的格式描述，属性值占用3行且是合并后的单元格

> 属性值是颜色时，对于没有alpha的颜色我们采用十进制格式来表示：#RRGGBB，如果有alpha，我们采用rgba格式来表示：rgba(r,g,b,a)，以防出现不同平台的开发对颜色的alpha通道位置理解不一致的问题

#### 【圆角】工作表

<img src="https://img.alicdn.com/imgextra/i2/O1CN01B90scg1zo88sEiJgX_!!6000000006760-2-tps-738-174.png" style="zoom:50%;" />

`circle`和`avator_radius`分别对应了圆角属性值`50%`和`5`

> 对于【圆角】工作表来说，50%代表了圆形

#### 【文本】工作表

<img src="/Users/ronghui/Desktop/截屏2022-02-09 下午2.40.46.png" style="zoom:50%;" />

之前在【定义】工作表，我们已经定义了一个【文本】由【字号】+【字重】来确定，也就是说，只有某个文本的字号是15，且字重是500，我们才会认为当前文本是`main_title`这个token，这里的【字号】和【字重】的顺序也和之前的【定义】工作表一致

> 属性值是数值时，比如字号：12，我们约定属性值不能带有单位，同样圆角、间距、尺寸等都适用此规则

## 在标注文件中如何展示Design Token

颜色：

<img src="https://img.alicdn.com/imgextra/i3/O1CN019XFV8Z1lq3BKxi5jO_!!6000000004869-2-tps-640-324.png" style="zoom:50%;" />

文本：

<img src="https://img.alicdn.com/imgextra/i2/O1CN01nJcz2l1IDSxXbcZJC_!!6000000000859-2-tps-640-456.png" style="zoom:50%;" />

更多的介绍请参考`gaia-measure`的文档
