# Server

## configure

### Prerequisites

Requires an internal Gitlab service

### steps

1. Add the configuration file

> Path: sketch/assets/server.config.json

Example:
````json
{
  "type": "gitlab", //Currently supports gitlab service
  "domain": "https://gitlab.xxxxxx.com", //domain name address
  "version": "v3", // API version number, currently supports V3 version
  "token": "xxxxxx", //private_token of gitlab public account
  "groups": [
    // The name field corresponds to the group on gitlab, and the group name configured below needs to be pre-created on gitlab
    {
      "type": "components", //components: component library type
      "name": "xxxxxx" // The name of the component library, such as xxx-component-libraries,
      "interval": 30 //The plug-in regularly checks the update interval, unit: s
    },
    {
      "type": "styles", //styles: style library type
      "name": "xxxxxx" // The name of the style library, such as xxx-style-libraries,
      "interval": 40 //The plugin regularly checks the update interval, unit: s
    },
    {
      "type": "iconfonts", //iconfonts: icon library type
      "name": "xxxxxx" // The name of the icon library, such as xxx-iconfont-libraries,
      "interval": 50 //The plug-in regularly checks the update interval, unit: s
    },
    {
      "type": "pages", //pages: page library type
      "name": "xxxxxx" // The name of the page library, such as xxx-page-libraries,
      "interval": 60 //The plugin regularly checks the update interval, unit: s
    },
    {
      "type": "tokens", //tokens: Design Token library type
      "name": "xxxxxx" // The name of the Design Token library, such as xxx-token-libraries,
      "interval": 70 //The plug-in regularly checks the update interval, unit: s
    }
  ]
}
````

2. Repackage the plugin

3. Install the plugin and restart the Sketch software

4. Open the plugin, the first time it will pop up to fill in the Private Token interface on Gitlab, enter the welcome page

<img src="https://img.alicdn.com/imgextra/i4/O1CN013MMspx1TNxoH17say_!!6000000002371-2-tps-802-1154.png" alt="drawing" width="20%"/>

5. Click the Tab of the corresponding library type on the toolbar to view the local and server-side libraries corresponding to each type

## upload

### Entrance

【Toolbar】-【Upload】

### Features

<img src="https://img.alicdn.com/imgextra/i3/O1CN01vKdop21KuB7iGZ1wT_!!6000000001223-2-tps-806-848.png" alt="drawing" width="30%"/>

#### library type

Currently supports uploading component library, style library, page library, icon library, Design Token library

#### library name

If you want to update the existing library on the server, you can directly select the name of the library to be updated in [Library Name]. If you want to add a new library, click [Do you want to add a new library? Click here to add] and enter the name of the new library

#### Select the file

The component library, style library, and page library are all .sketch files, the icon library is the outermost folder containing the SVG file, and the Design Token library is the .xlsx file

#### Is it public?

The default is [Public]. After checking [Private], only you or someone with permission can see it.

## manage

### Entrance

【Toolbar】-【Management】

### Features

<img src="https://img.alicdn.com/imgextra/i1/O1CN01jq1bDO1WjtcgwjLjB_!!6000000002825-2-tps-350-202.png" alt="drawing" width="30%"/>

For those who uploaded their own libraries or manually added permissions in the Gitlab backend, they can manage the corresponding libraries in the plugin

#### Modify library name

Can modify the name of the uploaded library

#### delete from server

Remove the permissions of everyone in the current library and change the corresponding project on Gitlab to archived

### Features

## renew

When the service is configured, the plug-in will request the server regularly. If the library is updated, it will display a small red dot in the corresponding library, and then click the update button in the drop-down icon of the corresponding library to update

<img src="https://img.alicdn.com/imgextra/i3/O1CN01k8FNa11iZ9ixP8BUv_!!6000000004426-2-tps-686-332.png" alt="drawing" width="30%"/>
