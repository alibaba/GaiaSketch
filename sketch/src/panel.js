/*
 * Copyright (c) 2022, Alibaba Group Holding Limited;
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import BrowserWindow from "sketch-module-web-view";
import { getWebview } from "sketch-module-web-view/remote";
import UI from "sketch/ui";
import * as Settings from "sketch/settings";
import { onLayerToCodeDestroy, registerExportCodeIPC } from "./layer-to-code";
import { registerExportMeasureIPC } from "./layer-to-measure";
import {
  onComponentDestroy,
  registerComponentIPC,
} from "./libraries/component";

import { registerCommonIPC } from "./layer-common";
import { registerServerIPC } from "./server/server";
import { onStyleDestroy, registerStyleIPC } from "./libraries/style";
import { onPageDestroy, registerPageIPC } from "./libraries/page";
import { onIconfontDestroy, registerIconfontIPC } from "./libraries/iconfont";
import { registerUpdateIPC } from "./libraries/update";
import { registerUploadIPC } from "./libraries/upload";
import {
  onManagementDestroy,
  registerManagementIPC,
} from "./libraries/management";

const webviewIdentifier = "gaia.sketch.webview";

export function onOpenPanel(context, barType) {
  const existingWebview = getWebview(webviewIdentifier);
  if (existingWebview) {
    if (existingWebview.webContents) {
      existingWebview.webContents.executeJavaScript(
        `onDidGetLatestBarType(${JSON.stringify({
          barType,
        })})`
      );
    }
    return;
  }

  let savedPosition = Settings.settingForKey("position") || {};

  const options = {
    identifier: webviewIdentifier,
    x: savedPosition["x"] ? Number(savedPosition["x"]) : undefined,
    y: savedPosition["y"] ? Number(savedPosition["y"]) : undefined,
    width: Number(savedPosition["width"] || 320),
    minWith: 320,
    height: Number(savedPosition["height"] || 610),
    minHeight: 610,
    show: false,
    titleBarStyle: "hiddenInset",
    alwaysOnTop: true,
    acceptsFirstMouse: true,
  };

  const browserWindow = new BrowserWindow(options);

  // only show the window when the page has loaded to avoid a white flash
  browserWindow.once("ready-to-show", () => {
    browserWindow.show();
    if (barType !== undefined) {
      browserWindow.webContents.executeJavaScript(
        `onDidGetLatestBarType(${JSON.stringify({
          barType,
        })})`
      );
    }
  });

  const webContents = browserWindow.webContents;

  // print a message when the page loads
  webContents.on("did-finish-load", () => {
    UI.message("Welcome to Gaia Sketch !");
  });

  // add a handler for a call from web content's javascript
  registerCommonIPC(context, webContents);
  registerServerIPC(context, webContents);
  registerComponentIPC(context, webContents);
  registerStyleIPC(context, webContents);
  registerIconfontIPC(context, webContents);
  registerPageIPC(context, webContents);
  registerUpdateIPC(context, webContents);
  registerUploadIPC(context, webContents);
  registerManagementIPC(context, webContents);
  registerExportMeasureIPC(context, webContents);
  registerExportCodeIPC(context, webContents);

  // browserWindow.loadURL("./resources/index.html");
  browserWindow.loadURL("http://localhost:3000");
}

// When the plugin is shutdown by Sketch (for example when the user disable the plugin)
// we need to close the webview if it's open
export function onShutdown(context) {
  const existingWebview = getWebview(webviewIdentifier);
  if (existingWebview) {
    Settings.setSettingForKey("position", existingWebview.getBounds());
    onLayerToCodeDestroy();
    onComponentDestroy();
    onIconfontDestroy();
    onStyleDestroy();
    onPageDestroy();
    onManagementDestroy();
    existingWebview.close();
  }
}

export function onCloseDocument(context) {
  let windows = NSApplication.sharedApplication().windows();
  let count = windows.count();
  let instanceCount = 0;
  for (let index = 0; index < count; index++) {
    const element = windows[index];
    if (
      element.isKindOfClass(NSClassFromString("MSDocumentWindow")) &&
      element.isVisible()
    ) {
      instanceCount++;
    }
  }
  if (Number(instanceCount - 1) <= 0) {
    onShutdown(context);
  }
}
