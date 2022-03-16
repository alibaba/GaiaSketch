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

import * as path from "@skpm/path";
import * as fs from "@skpm/fs";
import * as os from "@skpm/os";
import * as md5 from "blueimp-md5";
import * as cp from "@skpm/child_process";
import * as sketch from "sketch/dom";
import { getLatestBarType, setLatestBarType } from "./helper";

export function registerCommonIPC(context, webContents) {
  webContents.on("openInFinder", (folderPath, filePath) => {
    if (filePath) {
      NSWorkspace.sharedWorkspace().activateFileViewerSelectingURLs([
        NSURL.fileURLWithPath(path.join(folderPath, filePath)),
      ]);
    } else {
      NSWorkspace.sharedWorkspace().activateFileViewerSelectingURLs([
        NSURL.fileURLWithPath(folderPath),
      ]);
    }
  });

  webContents.on("openUrl", (url) => {
    NSWorkspace.sharedWorkspace().openURL(NSURL.URLWithString(url));
  });

  webContents.on("openInGaiaStudio", (folderPath) => {
    let componentPath = folderPath;
    if (fs.existsSync(componentPath)) {
      if (!componentPath.toLowerCase().endsWith("/gaiax")) {
        let dirs = fs.readdirSync(componentPath);
        for (let i = 0; i < dirs.length; i++) {
          if (dirs[i].toLowerCase().endsWith("/gaiax")) {
            componentPath = path.join(componentPath, dirs[i]);
            break;
          }
        }
      }

      let targetPath = path.join(os.homedir(), ".gaiax-studio", "workspace");
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath);
      }

      let templatePath = path.join(
        targetPath,
        md5(String(NSUUID.UUID().UUIDString()))
      );
      if (!fs.existsSync(templatePath)) {
        fs.mkdirSync(templatePath);
      }

      cp.spawnSync("cp", ["-r", `${componentPath}/.`, templatePath], {
        shell: "/bin/sh",
      });
      cp.spawnSync("open", ["-b", "com.youku.gaia.studio", templatePath], {
        shell: "/bin/sh",
      });
    }
  });

  webContents.on("getPageOptions", (type = "Artboard") => {
    const currentDocument = sketch.Document.getSelectedDocument();
    let pages = currentDocument.pages;
    let artboardsOptions = [];
    for (let i = pages.length - 1; i >= 0; i--) {
      let page = pages[i];
      if (page && page.selected) {
        if (type === "Artboard" && !page.isSymbolsPage()) {
          generateArtboardOptions(page, artboardsOptions, type);
        } else if (type === "SymbolMaster" && page.isSymbolsPage()) {
          generateArtboardOptions(page, artboardsOptions, type);
        }
      }
    }
    for (let i = pages.length - 1; i >= 0; i--) {
      let page = pages[i];
      if (page && !page.selected) {
        if (type === "Artboard" && !page.isSymbolsPage()) {
          generateArtboardOptions(page, artboardsOptions, type);
        } else if (type === "SymbolMaster" && page.isSymbolsPage()) {
          generateArtboardOptions(page, artboardsOptions, type);
        }
      }
    }
    webContents.executeJavaScript(
      `onDidGetPageOptions(${JSON.stringify({
        options: artboardsOptions,
      })})`
    );
  });

  webContents.on("setLatestBarType", (barType) => {
    setLatestBarType(barType);
  });
  webContents.on("getLatestBarType", () => {
    let barType = getLatestBarType();
    webContents.executeJavaScript(
      `onDidGetLatestBarType(${JSON.stringify({
        barType,
      })})`
    );
  });
}

function generateArtboardOptions(page, artboardsOptions, type) {
  let length = page.layers.length;
  let artboardsInPage = [];
  for (let j = length - 1; j >= 0; j--) {
    let layer = page.layers[j];
    if (type === "Artboard" && layer.type === "Artboard") {
      artboardsInPage.push({
        id: String(layer.id),
        name: String(layer.name),
        selected: layer.selected,
      });
    } else if (type === "SymbolMaster" && layer.type === "SymbolMaster") {
      artboardsInPage.push({
        id: String(layer.id),
        name: String(layer.name),
        selected: layer.selected,
      });
    }
  }
  if (artboardsInPage.length > 0) {
    artboardsOptions.push({
      artboards: artboardsInPage,
      id: page.id,
      name: String(page.name),
      selected: 0,
    });
  }
}
