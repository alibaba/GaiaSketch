# 服务

## 配置

### 前提条件

需要有内部的Gitlab服务

### 步骤

1. 添加配置文件

> 路径：sketch/assets/server.config.json

样例：
```json
{
  "type": "gitlab", //目前支持gitlab服务
  "domain": "https://gitlab.xxxxxx.com", //域名地址
  "version": "v3", // API 版本号，目前支持V3版本的
  "token": "xxxxxx", //gitlab公共账号的private_token
  "groups": [
    // name字段对应gitlab上的group，下方配置的group需要在gitlab上预先创建
    {
      "type": "components", //components：组件库类型
      "name": "xxxxxx" // 组件库的名称，比如 xxx-component-libraries,
      "interval": 30  //插件定时检查更新时间间隔，单位:s
    },
    {
      "type": "styles", //styles：样式库类型
      "name": "xxxxxx" // 样式库的名称，比如 xxx-style-libraries,
      "interval": 40  //插件定时检查更新时间间隔，单位:s
    },
    {
      "type": "iconfonts", //iconfonts：图标库类型
      "name": "xxxxxx" // 图标库的名称，比如 xxx-iconfont-libraries,
      "interval": 50  //插件定时检查更新时间间隔，单位:s
    },
    {
      "type": "pages", //pages：页面库类型
      "name": "xxxxxx" // 页面库的名称，比如 xxx-page-libraries,
      "interval": 60  //插件定时检查更新时间间隔，单位:s
    },
    {
      "type": "tokens",  //tokens：Design Token库类型
      "name": "xxxxxx" // Design Token库的名称，比如 xxx-token-libraries,
      "interval": 70  //插件定时检查更新时间间隔，单位:s
    }
  ]
}
```

2. 重新打包插件

3. 安装插件重启Sketch软件
   
4. 打开插件，第一次会弹出填入Gitlab上的Private Token界面，输入后进入欢迎页

<img src="https://img.alicdn.com/imgextra/i4/O1CN013MMspx1TNxoH17say_!!6000000002371-2-tps-802-1154.png" alt="drawing" width="20%"/>

5. 在工具条上点击对应的库类型的Tab，可以查看每个类型对应的本地和服务端的库

## 上传

### 入口

【工具条】 -【上传】

### 功能

<img src="https://img.alicdn.com/imgextra/i3/O1CN01vKdop21KuB7iGZ1wT_!!6000000001223-2-tps-806-848.png" alt="drawing" width="30%"/>

#### 库类型

目前支持上传组件库、样式库、页面库、图标库、Design Token库

#### 库名称

如果要更新服务端已有的库，可以直接在【库名称】中选择要更新的库名称，如果要新增库，点击【是否要新增库？点击此处新增】并输入新的库的名称

#### 选择文件

对于组件库、样式库、页面库都是.sketch文件，图标库是选择包含SVG文件最外层的文件夹，Design Token库是选择.xlsx文件

#### 是否公开

默认【公开】，勾选【私有】后只有自己或者有权限的人可见

## 管理

### 入口

【工具条】-【管理】

### 功能

<img src="https://img.alicdn.com/imgextra/i1/O1CN01jq1bDO1WjtcgwjLjB_!!6000000002825-2-tps-350-202.png" alt="drawing" width="30%"/>

对于是自己上传的库或者在Gitlab后端手动添加过权限的人可以在插件中管理对应的库

#### 修改库名称

可以修改已经上传的库的名称

#### 从服务端删除

移除当前库的所有人的权限，并将Gitlab上对应的工程改为archived

### 功能

## 更新

当配置了服务后，插件会定时请求服务端，如果库有更新时，会在对应的库显示小红点，然后点击对应的库的下拉图标里的更新按钮更新

<img src="https://img.alicdn.com/imgextra/i3/O1CN01k8FNa11iZ9ixP8BUv_!!6000000004426-2-tps-686-332.png" alt="drawing" width="30%"/>
