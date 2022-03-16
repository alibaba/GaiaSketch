# Design Token library

When developing a UI, the usual process is that the designer exports the annotation file, and then the development gets the annotation file and selects a layer to view the coordinates or style information. Usually, these information are presented in the form of numerical values. For example, the color of the title is `#00ff00`, the developer also writes the corresponding text color in the code as `#00ff00`. When a certain time, if you need to modify the color of this text, you need to manually check whether this color is used by each developer. When it arrives, modify it manually. At this time, there will be omissions or workload required.

The role of Design Token is to symbolize and semantically characterize the style value, so that when the developer assigns the color of the main title, instead of writing the color value directly, the Token corresponding to the color value is written, so that when changing the color of the main title later, it will be You only need to change the value corresponding to the underlying Token, and you don't need to check and modify `#00ff00` in every place you use

For example, we define the Token of the color of the main title scene

| Scenario | Design Token | Value |
| ---------- | ------------ | ------- |
| Main title color | titleColor | #00ff00 |

In the code we assign the color of the main title scene

Take iOS as an example:

````objc
title.textColor = [UIColor titleColor];
````

> The UIColor of the system does not have the titleColor attribute, and the client needs to write a set of underlying SDK in advance to support this assignment method

## Format

For plugin, we define the Design Token library as a .xlsx file, which contains the correspondence between Tokens and values, and then make the .xlsx file programmable through some definitions to realize complex logical relationships

[Design Token library example (.xlsx)](../examples/design-token.xlsx)

Each .xlsx file consists of several worksheets, and the first worksheet must be the [Definition] worksheet, as shown in the following figure:

<img src="https://img.alicdn.com/imgextra/i3/O1CN018HnI1z1WQCat5VdBj_!!6000000002782-2-tps-1180-136.png" alt="drawing" width="40%"/>

### [Definition] Worksheet

<img src="https://img.alicdn.com/imgextra/i4/O1CN01MjDttW268dZW8O7CR_!!6000000007617-2-tps-2022-620.png" alt="drawing" width="70%"/>

The first column in the worksheet represents the name of the style we want to describe. They are also the names of other worksheets except [Definition] at the bottom. For example, we write the worksheet classification in the first column: color, second column, third column And the following column refers to the css property that the color may correspond to, and the relationship between them is ` or `, that is to say, when any of the following css properties is encountered, it will go to the [Color] worksheet to find the corresponding Token:

* color: text color

* background-color: background color (solid color)

* border-color: border color (solid color)

* background-image: background (linear gradient)

* border-image: border (linear gradient)

> When the developer clicks the layer on the annotation file, the corresponding style will be displayed on the right side of the annotation file, each style corresponds to the css name, but the annotation file will be presented in a natural way, rather than directly written on css name

<img src="https://img.alicdn.com/imgextra/i3/O1CN01OlaQVF20kIRPcPJxX_!!6000000006887-2-tps-1258-104.png" alt="drawing" width="70%"/>

The above describes a scenario in which a CSS property corresponds to a worksheet classification. Another case is that multiple CSS properties correspond to a worksheet classification. For example, a text may be determined by multiple properties, such as the one below is determined by `font-size ( Font size)` and `font-weight (word weight)` together determine a text, `font-size` and `font-weight` between them is the relationship between `and`, of course, you can also add a dimension or reduce a dimension , such as adding a `color` property to determine a text together with the above two css properties

<img src="https://img.alicdn.com/imgextra/i2/O1CN01Tx0XJS20UGa4A2Ojn_!!6000000006852-2-tps-628-174.png" alt="drawing" width="40%"/>

> Please pay attention to the order of these dimensions, they are in the same order as the values ​​in the [Text] worksheet

### Other worksheets

The following uses [color], [rounded corners] and [text] as examples to explain the content. The principles of other worksheets are similar.

The first column is [Attribute Value], the second column is the name of [Token], the third column is [Platform], and the fourth column is the [Sample Code] corresponding to the platform in the third column.

#### Correspondence

There are two types of correspondence between attribute values ​​and tokens, one-to-one and one-to-many

##### 1. One-to-one

One-to-one means that one attribute value corresponds to one token

##### 2. One-to-many

One-to-many means that one attribute value corresponds to multiple Tokens, that is to say, the same attribute value is used in different scenarios. In order to enable the annotation file to correctly display the Token of the corresponding scenario, we need to create a [style library] , and then format the visual draft to correspond the relationship between the layer and the Token. For the specific operation steps, please refer to [Style Library Document](./style.md)

【Color】Worksheet

<img src="https://img.alicdn.com/imgextra/i3/O1CN01rS17NH1Dz20rIMXFb_!!6000000000286-2-tps-2272-506.png" alt="drawing" width="100%"/>

The three tokens `primaryColor`, `primaryColorAlpha`, and `linearGradientColor` in the above figure represent `#00ff00`, `rgba(255,0,0,0.3)`, `linear gradient (0-0->1) -1->#fb00aa-100%->#fb0000-100%)`, they have a one-to-one relationship

`Scenario 1: Fill color/primaryFillColor', `Scene 2: Fill color/secondaryFillColor', `Scene 3: Other (other_2)` in the above figure are tokens of different scenes in 3, respectively. And they all correspond to the same attribute value `#fafafa`, described in the format in the above figure in Excel, the attribute value occupies 3 rows and is a merged cell

> When the attribute value is color, we use decimal format to represent the color without alpha: #RRGGBB, if there is alpha, we use rgba format to represent: rgba(r,g,b,a), in case of different platforms Develop an inconsistent understanding of the position of the alpha channel of a color

#### 【Round Corners】Worksheet

<img src="https://img.alicdn.com/imgextra/i2/O1CN01B90scg1zo88sEiJgX_!!6000000006760-2-tps-738-174.png" style="zoom:50%;" />

`circle` and `avator_radius` correspond to the rounded attribute values ​​`50%` and `5` respectively

> For [Round Corners] worksheet, 50% represents a circle

#### [text] worksheet

<img src="/Users/ronghui/Desktop/screenshot 2022-02-09 2.40.46 pm.png" style="zoom:50%;" />

Previously in the [Definition] worksheet, we have defined a [Text] to be determined by [Font Size] + [Word Weight], that is to say, only if the font size of a certain text is 15 and the font weight is 500, we will It is considered that the current text is the token `main_title`, and the order of [font size] and [word weight] here is also consistent with the previous [Definition] worksheet

> When the attribute value is a numerical value, such as font size: 12, we agree that the attribute value cannot have a unit, and the same rule applies to rounded corners, spacing, size, etc.

## How to display Design Token in the annotation file

color:

<img src="https://img.alicdn.com/imgextra/i3/O1CN019XFV8Z1lq3BKxi5jO_!!6000000004869-2-tps-640-324.png" style="zoom:50%;" />

text:

<img src="https://img.alicdn.com/imgextra/i2/O1CN01nJcz2l1IDSxXbcZJC_!!6000000000859-2-tps-640-456.png" style="zoom:50%;" />

For more information, please refer to the documentation of `gaia-measure`
