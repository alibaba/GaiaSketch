# style library

Each style library is composed of one or more Symbols. After each Symbol is named according to a certain format, plugin can read it and display it visually in the plug-in. Click the visualized style to directly format the Sketch design draft and match it with The original library remains relevant

## Naming

The name of each Symbol follows the standard format naming, the name is connected with `/`, such as `background color/image background color`, plugin [style library] parseable Symbol name must contain at least 1 `/` or more , if the current Symbol represents color, then its child node must be a `rectangle` type layer, if it represents text, then its node must be a `text` type layer, when plugin parses the style library, it will be based on The type of the child node is used to determine whether the current Symbol should be classified in [Text] or [Color]. If the current Symbol wants to be associated with Design Token, the name of the child node can be named Design Token, as shown in the following figure:

<img src="https://img.alicdn.com/imgextra/i2/O1CN01ztr1j31b5euFr4TCt_!!6000000003414-2-tps-1824-326.png" alt="drawing" width="50%"/>

After importing into plugin, the visual display effect is as follows:

<img src="https://img.alicdn.com/imgextra/i4/O1CN01MugvtI1NHeerOo6nA_!!6000000001545-2-tps-726-732.png" alt="drawing" width="20%"/>

[Text] or [Color] is the first-level directory, [Background Color] is the second-level directory, and the latter part is displayed as the name of the style. If the name of the child node is Design Token, it will be displayed as a subtitle

## How to make a style library

Each style library is a sketch file, and each sketch file has one or more symbols. The  plugin traverses the symbols in the style library that meet the naming rules.

[style library example.sketch](../examples/style.sketch)

## How to import the style library into plugin

### method one:

1. Select 【Style】Tab

2. Click the drop-down arrow on the right and select [Import]

3. Select the local style library (.sketch file) to be imported in the pop-up dialog box. After confirmation, the  plugin will automatically parse the local style library and visually display the styles that conform to the naming rules.

<img src="https://img.alicdn.com/imgextra/i4/O1CN01r0UtQz1uwlWpjjwpH_!!6000000006102-2-tps-806-318.png" alt="drawing" width="40%"/>

### Method 2:

1. Select the Sketch menu item, select [Sketch] -> [Preferences...] -> [Component Library]

2. Drag and drop the .sketch file to the [Local Component Library] in [Style Library]

3. Open plugin, select the [Style] Tab of plugin, and select the style library you just imported in the drop-down list above.

## How to use imported style library

1. Select 【Style】Tab

2. Select the displayed style library in the drop-down component at the top

3. First select the layer to be formatted in the Sketch design draft, and then in the visual interface, click the style under [Text] to format the `Text' layer in the Sketch design draft, and click the style under the [Color] category You can format `Text` or `Shape` type layers in Sketch design drafts

> When formatting the layer in the design draft by clicking on the style with Design Token,  plugin will directly associate the Token with the target formatted layer to solve the problem that one color corresponds to multiple Design Tokens. The associated layer can directly display the formatted Design Token in the annotation file exported by plugin's [Export Annotation] function.

## How to remove imported style library from plugin

1. On the page corresponding to the [Style] tab, click the drop-down icon in the upper right corner

2. Click [Remove]

<img src="https://img.alicdn.com/imgextra/i3/O1CN01ZC0Ccf1rH8gbpe1s8_!!6000000005605-2-tps-800-342.png" alt="drawing" width="40%"/>
