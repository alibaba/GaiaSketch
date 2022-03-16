# component library

Each component library consists of one or more Symbols. After each Symbol is named according to a certain format, plugin can read and visualize it in the plug-in, and you can drag and drop the visualized components directly into the Sketch design draft. and remain associated with the original library

## Naming

The name of each Symbol follows the standard format naming, the name is connected with `/`, such as `Foundation/Bar/TabBar`, plugin [component library] parseable Symbol name must contain at least 2 `/` or more

<img src="https://img.alicdn.com/imgextra/i2/O1CN01t7Q4Tz1hFdDyiaHAY_!!6000000004248-2-tps-1548-786.png" alt="drawing" width="40%"/>

After importing into plugin, the visual display effect is as follows:

<img src="https://img.alicdn.com/imgextra/i3/O1CN01OB8h4P1h9Dg5suVjV_!!6000000004234-2-tps-584-492.png" alt="drawing" width="40%"/>

Foundation is the first-level directory, Bar is the second-level directory, and the latter part is displayed as the name of the component

## How to make a component library

Each component library is a sketch file, and each sketch file has one or more Symbols. The  plugin traverses the symbols in the component library that conform to the naming rules

[component library example.sketch](../examples/component.sketch)

## How to import component library into plugin

### method one:

1. Select [Components] Tab

2. Click the drop-down arrow on the right and select [Import]

3. Select the local component library (.sketch file) to be imported in the pop-up dialog box. After confirmation, the plugin will automatically parse the local component library and visualize the components that meet the naming rules.

<img src="https://img.alicdn.com/imgextra/i3/O1CN01j8aIqX1v6NqYiYoV6_!!6000000006123-2-tps-800-368.png" alt="drawing" width="40%"/>

### Method 2:

1. Select the Sketch menu item, select [Sketch] -> [Preferences...] -> [Component Library]

2. Drag and drop the .sketch file to [Local Component Library] in [Component Library]

3. Open plugin, select the [Components] Tab of plugin, and select the component library you just imported in the drop-down list above.

## How to use imported component library

1. Select [Components] Tab

2. Select the displayed component library in the drop-down component at the top

3. Select any component on the component page of the visual display and drag it to the Sketch design draft for use

## How to remove imported component library from plugin

1. On the page corresponding to the [Components] tab, click the drop-down icon in the upper right corner

2. Click [Remove]

<img src="https://img.alicdn.com/imgextra/i2/O1CN01EsFVPC1eUnUY1LGQ9_!!6000000003875-2-tps-802-398.png" alt="drawing" width="40%"/>
