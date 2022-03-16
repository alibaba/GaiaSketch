# page library


Each page library is composed of one or more Symbols. After each Symbol is named according to a certain format, plugin can read it and display it visually in the plug-in, and drag and drop the visualized page directly into the Sketch design draft. and remain associated with the original library

## Naming

The name of each Symbol follows the standard format naming, the name is connected with `/`, such as `Home/Page1` , plugin [page library] parseable Symbol name must contain at least 1 `/` or more

<img src="https://img.alicdn.com/imgextra/i3/O1CN01OfQD9b1EiNDnNG0Ug_!!6000000000385-2-tps-1378-630.png" alt="drawing" width="40%"/>

After importing into plugin, the visual display effect is as follows:

<img src="https://img.alicdn.com/imgextra/i3/O1CN01mdT4Zx27SA4NRESWH_!!6000000007795-2-tps-806-576.png" alt="drawing" width="40%"/>

The home page is the first-level directory, and the latter part is displayed as the name of the page

## How to make a page library

Each page library is a sketch file, and each sketch file has one or more Symbols. The  plugin traverses the symbols in the page library that meet the naming rules.

[page library example.sketch](../examples/page.sketch)

## How to import page library into plugin

### method one:

1. Select [Page] Tab

2. Click the drop-down arrow on the right and select [Import]

3. In the pop-up dialog box, select the local page library (.sketch file) to be imported. After confirmation, the  plugin will automatically parse the local page library and visualize the pages that meet the naming rules.

<img src="https://img.alicdn.com/imgextra/i4/O1CN013NTud71MFzbbprKsK_!!6000000001406-2-tps-806-358.png" alt="drawing" width="40%"/>

### Method 2:

1. Select the Sketch menu item, select [Sketch] -> [Preferences...] -> [Component Library]

2. Drag and drop the .sketch file to [Local Component Library] in [Component Library]

3. Open plugin, select the [Page] Tab of plugin, and select the page library you just imported in the drop-down list above.

## How to use the imported page library

1. Select [Page] Tab

2. Select the displayed page library from the drop-down page at the top

3. Select any page on the visual display page and drag it to the Sketch design draft for use

## How to remove imported page library from plugin

1. On the page corresponding to the [Pages] tab, click the drop-down icon in the upper right corner

2. Click [Remove]

<img src="https://img.alicdn.com/imgextra/i4/O1CN01FZ2IGo1Gh7MoOo6Na_!!6000000000653-2-tps-804-374.png" alt="drawing" width="40%"/>
