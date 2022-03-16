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

import * as sketch from "sketch/dom";
import {
  getLatestBarType,
  getSymbolsByTypeID,
  indexOfSymbol,
  screenshotsFolder,
  setSymbolsByTypeID,
} from "../helper";
import * as fs from "@skpm/fs";
import * as path from "@skpm/path";
import * as Settings from "sketch/settings";
import dialog from "@skpm/dialog";
import { downloadLibrary } from "../server/downloads";
import * as Console from "@skpm/console";
import { getWebview } from "sketch-module-web-view/remote";
import {
  getAllSketchLibraries,
  getLatestSelectedLibrary,
  getRefreshIntervalByType,
  getSelectedLibrary,
  requestProjects,
  setLatestSelectedLibrary,
} from "../server/server-helper";
import { Component, RelatedServerProject } from "../contants";
import dayjs from "dayjs";

const console = Console();

let refreshIntervalId;
let refreshTimeoutId;

export function onComponentDestroy() {
  if (refreshTimeoutId) {
    clearTimeout(refreshTimeoutId);
  }
  if (refreshIntervalId) {
    clearInterval(refreshIntervalId);
  }
}

export function registerComponentIPC(context, webContents) {
  let interval = getRefreshIntervalByType(Component);
  if (interval > 0) {
    refreshTimeoutId = setTimeout(() => {
      requestProjects(Component).then(() => {
        refreshIntervalId = setInterval(() => {
          requestProjects(Component)
            .then(() => {})
            .catch((error) => {});
        }, interval * 1000);
      });
    }, 5000);
  }

  Settings.setSettingForKey(`${Component}-libraries`, null);

  webContents.on("downloadComponentLibrary", (projectInfo) => {
    downloadLibrary(Component, projectInfo.projectID)
      .then((data) => {
        let library = sketch.Library.getLibraryForDocumentAtPath(
          path.join(data.libraryFolder, data.fileName)
        );
        let relatedProject = Settings.settingForKey(RelatedServerProject) || {};
        relatedProject[data.libraryFolder] = {
          libraryType: Component,
          projectID: projectInfo.projectID,
          libraryID: String(library.id),
          lastModifiedAt: projectInfo.lastModifiedAt,
        };
        // console.log(relatedProject);
        Settings.setSettingForKey(RelatedServerProject, relatedProject);
        webContents.executeJavaScript(
          `onDidDownloadComponentLibrary(${JSON.stringify({
            libraryInfo: {
              ...projectInfo,
              libraryID: String(library.id),
            },
          })})`
        );
      })
      .catch((error) => {
        webContents.executeJavaScript(`onDidDownloadComponentLibrary()`);
      });
  });

  webContents.on("getComponentLibraries", async (forceReload) => {
    let libraries = [];
    let savedLibraries = Settings.settingForKey(`${Component}-libraries`);
    if (savedLibraries && !forceReload) {
      libraries = savedLibraries;
    } else {
      libraries = await requestProjects(Component);
    }
    let selectedLibrary;
    let latestLibrary = getLatestSelectedLibrary(Component);
    if (libraries && latestLibrary) {
      for (let i = 0; i < libraries.length; i++) {
        if (
          libraries[i].projectID === latestLibrary.projectID ||
          libraries[i].libraryID === latestLibrary.libraryID
        ) {
          selectedLibrary = libraries[i];
          break;
        }
      }
    }
    webContents.executeJavaScript(
      `onDidGetComponentLibraries(${JSON.stringify({
        libraries,
        selectedLibrary,
      })})`
    );
  });
  webContents.on("getLibraryInfo", (libraryID, projectID) => {
    let info;
    webContents.executeJavaScript(
      `onDidGetLibraryInfo(${JSON.stringify({
        info,
      })})`
    );
  });
  webContents.on("importComponents", () => {
    dialog
      .showOpenDialog({
        filters: [{ name: "sketch", extensions: ["sketch"] }],
        title: "请选择要导入的组件库",
        properties: ["openFile"],
      })
      .then(({ canceled, filePaths }) => {
        if (!canceled && filePaths && filePaths.length > 0) {
          let filePath = filePaths[0];
          if (fs.existsSync(filePath) && path.extname(filePath) === ".sketch") {
            let library = sketch.Library.getLibraryForDocumentAtPath(filePath);
            let libraryInfo = {
              disabled: !library.enabled || !library.valid,
              libraryID: String(library.id),
              type: "Local",
              name: library.name,
              lastModifiedAt: dayjs(library.lastModifiedAt).unix(),
            };
            setLatestSelectedLibrary(Component, libraryInfo);
            webContents.executeJavaScript(
              `onDidImportComponents(${JSON.stringify(libraryInfo)})`
            );
          }
        } else {
          webContents.executeJavaScript(`onDidImportComponents()`);
        }
      });
  });
  webContents.on("deleteComponents", async (libraryInfo) => {
    let selectedLibrary = await getSelectedLibrary(Component, libraryInfo);
    if (selectedLibrary) {
      selectedLibrary.remove();
      setSymbolsByTypeID(Component, selectedLibrary.id, null);
      Settings.setSettingForKey(`${Component}-libraries`, null);
    }
    setLatestSelectedLibrary(Component, null);
    webContents.executeJavaScript("onDidDeleteComponents()");
  });
  webContents.on("getComponents", async (libraryInfo, forceReload) => {
    // console.log(`start get components = `, libraryInfo);
    setLatestSelectedLibrary(Component, libraryInfo);
    let selectedLibrary = await getSelectedLibrary(Component, libraryInfo);
    if (selectedLibrary) {
      let symbolMasters = [];
      let savedInfo = getSymbolsByTypeID(Component, libraryInfo.libraryID);
      if (savedInfo && !forceReload) {
        symbolMasters = savedInfo;
      } else {
        let libDocument = selectedLibrary.getDocument();
        let symbols = libDocument && libDocument.getSymbols();
        for (let j = Math.min(symbols.length - 1, 1000); j >= 0; j--) {
          let layer = symbols[j];
          let regex = new RegExp(/([\S|\s]+[\/\／]){2,}/g);
          let match = layer.name.match(regex);
          if (match) {
            sketch.export(layer, {
              "use-id-for-name": true,
              formats: "png",
              scales: "2",
              trimmed: false,
              output: screenshotsFolder(),
              overwriting: true,
            });
            let splits = layer.name.split("/");
            if (splits.length > 0) {
              let firstIndex = indexOfSymbol(symbolMasters, splits[0]);
              if (firstIndex === -1) {
                symbolMasters.push({
                  name: splits[0],
                  links: [],
                });
                firstIndex = symbolMasters.length - 1;
              }
              let secondIndex = indexOfSymbol(
                symbolMasters[firstIndex].links,
                splits[1]
              );
              if (secondIndex === -1) {
                symbolMasters[firstIndex].links.push({
                  name: splits[1],
                  links: [],
                });
                secondIndex = symbolMasters[firstIndex].links.length - 1;
              }
              let base64String = fs.readFileSync(
                path.join(screenshotsFolder(), layer.id + "@2x.png"),
                {
                  encoding: "base64",
                }
              );
              symbolMasters[firstIndex].links[secondIndex].links.push({
                key: layer.id,
                name: splits.slice(2).join("/"),
                fullName: layer.name,
                width: layer.frame.width,
                height: layer.frame.height,
                thumbnail: "data:image/png;base64, " + base64String,
              });
            }
          }
        }
        setSymbolsByTypeID(Component, libraryInfo.libraryID, symbolMasters);
      }

      webContents.executeJavaScript(
        `onDidGetComponents(${JSON.stringify({ groups: symbolMasters })})`
      );
    } else {
      webContents.executeJavaScript(
        `onDidGetComponents(${JSON.stringify({ groups: [] })})`
      );
    }
  });
}

export function componentOnSelectionChanged(context) {
  let barType = getLatestBarType();
  if (barType === Component) {
    const existingWebview = getWebview("gaia.sketch.webview");
    if (
      existingWebview &&
      String(context.action) === "SelectionChanged.finish"
    ) {
      const newSelection = context.actionContext.newSelection;
      const newSelectedLayer =
        newSelection.count() > 0 ? newSelection[0] : undefined;
      if (newSelectedLayer) {
        let layer = sketch.fromNative(newSelectedLayer);
        if (layer && layer.text && layer.text.length > 0) {
          let splitArray = layer.text.split("/");
          let layerFrame = layer.frame;
          let layerParent = layer.parent;
          layer.remove();
          if (splitArray && splitArray.length === 3) {
            let libraryID = splitArray[0];
            let layerID = splitArray[1];
            let layerName = decodeURIComponent(splitArray[2]);
            let sketchLibraries = getAllSketchLibraries();
            for (let i = 0; i < sketchLibraries.length; i++) {
              let sketchLibrary = sketchLibraries[i];
              let libDocument = sketchLibrary.getDocument();
              if (libDocument.id === libraryID) {
                let document = sketch.Document.getSelectedDocument();
                let symbolReferences =
                  sketchLibrary.getImportableSymbolReferencesForDocument(
                    document
                  );
                if (symbolReferences && symbolReferences.length > 0) {
                  for (let j = 0; j < symbolReferences.length; j++) {
                    let symbolReference = symbolReferences[j];
                    if (symbolReference.name === layerName) {
                      let symbol = symbolReference.import();
                      if (symbol.id === layerID) {
                        let instance = symbol.createNewInstance();
                        let parent = layerParent || document.selectedPage;
                        parent.layers.push(instance);
                        instance.selected = true;
                        let centerX = layerFrame.x + layerFrame.width / 2;
                        let centerY = layerFrame.y + layerFrame.height / 2;
                        instance.frame = {
                          x: centerX - instance.frame.width / 2,
                          y: centerY - instance.frame.height / 2,
                          width: instance.frame.width,
                          height: instance.frame.height,
                        };
                      }
                    }
                  }
                }
                break;
              }
            }
          }
        }
      }
    }
  }
}
