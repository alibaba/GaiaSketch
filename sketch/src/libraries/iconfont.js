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
import {getLatestBarType, getLocalIconfontDir, getSymbolsByTypeID, indexOfSymbol, setSymbolsByTypeID,} from "../helper";
import * as fs from "@skpm/fs";
import * as path from "@skpm/path";
import * as Settings from "sketch/settings";
import * as md5 from "blueimp-md5";

import {downloadLibrary} from "../server/downloads";
import * as Console from "@skpm/console";
import {getWebview} from "sketch-module-web-view/remote";
import {
  deleteLocalIconfonts,
  getLatestSelectedLibrary,
  getPathByType,
  getRefreshIntervalByType,
  requestProjects,
  setLatestSelectedLibrary,
  setLocalIconfonts,
} from "../server/server-helper";
import {Iconfont, RelatedServerProject} from "../contants";
import dialog from "@skpm/dialog";
import dayjs from "dayjs";
import * as cp from "@skpm/child_process";

const console = Console();

let refreshIntervalId;
let refreshTimeoutId;

export function onIconfontDestroy() {
  if (refreshTimeoutId) {
    clearTimeout(refreshTimeoutId);
  }
  if (refreshIntervalId) {
    clearInterval(refreshIntervalId);
  }
}

export function registerIconfontIPC(context, webContents) {
  let interval = getRefreshIntervalByType(Iconfont);
  if (interval > 0) {
    refreshTimeoutId = setTimeout(() => {
      requestProjects(Iconfont).then(() => {
        refreshIntervalId = setInterval(() => {
          requestProjects(Iconfont)
            .then(() => {})
            .catch((error) => {});
        }, interval * 1000);
      });
    }, 15000);
  }

  Settings.setSettingForKey(`${Iconfont}-libraries`);

  webContents.on("downloadIconfontLibrary", (projectInfo) => {
    downloadLibrary(Iconfont, projectInfo.projectID)
      .then((data) => {
        let relatedProject = Settings.settingForKey(RelatedServerProject) || {};
        relatedProject[data.libraryFolder] = {
          libraryType: Iconfont,
          projectID: projectInfo.projectID,
          libraryID: md5(projectInfo.projectID),
          lastModifiedAt: projectInfo.lastModifiedAt,
        };
        Settings.setSettingForKey(RelatedServerProject, relatedProject);
        webContents.executeJavaScript(
          `onDidDownloadIconfontLibrary(${JSON.stringify({
            libraryInfo: {
              ...projectInfo,
              libraryID: md5(projectInfo.projectID),
            },
          })})`
        );
      })
      .catch((error) => {
        webContents.executeJavaScript("onDidDownloadIconfontLibrary()");
      });
  });

  webContents.on("getIconfontLibraries", async (forceReload) => {
    let libraries = [];
    let savedLibraries = Settings.settingForKey(`${Iconfont}-libraries`);
    if (savedLibraries && !forceReload) {
      libraries = savedLibraries;
    } else {
      libraries = await requestProjects(Iconfont);
    }
    let selectedLibrary;
    let latestLibrary = getLatestSelectedLibrary(Iconfont);
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
      `onDidGetIconfontLibraries(${JSON.stringify({
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

  webContents.on("importIconfonts", () => {
    dialog
      .showOpenDialog({
        title: "请选择要导入的图标库",
        properties: ["openDirectory"],
      })
      .then(({ canceled, filePaths }) => {
        if (!canceled && filePaths && filePaths.length > 0) {
          let filePath = filePaths[0];
          if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
            let libraryID = md5(filePath);
            let targetPath = path.join(getLocalIconfontDir(), libraryID);
            if (fs.existsSync(targetPath)) {
              try {
                fs.rmdirSync(targetPath);
              } catch (error) {}
            }
            fs.mkdirSync(targetPath);
            cp.spawnSync("cp", ["-r", `${filePath}/.`, targetPath], {
              shell: "/bin/sh",
            });
            let libraryName = path.basename(filePath);
            let libraryInfo = {
              libraryID: libraryID,
              type: "Local",
              name: libraryName,
              path: targetPath,
              lastModifiedAt: dayjs().unix(),
            };
            setLatestSelectedLibrary(Iconfont, libraryInfo);
            setLocalIconfonts(libraryInfo);
            webContents.executeJavaScript(
              `onDidImportIconfonts(${JSON.stringify(libraryInfo)})`
            );
          }
        } else {
          webContents.executeJavaScript(`onDidImportIconfonts()`);
        }
      });
  });

  webContents.on("deleteIconfonts", async (libraryInfo) => {
    // console.log(`start delete iconfonts ${libraryInfo}`);
    let libraryPath = path.join(getPathByType(Iconfont, libraryInfo.projectID));
    if (fs.existsSync(libraryPath)) {
      try {
        fs.rmdirSync(libraryPath);
      } catch (error) {}
    }
    Settings.setSettingForKey(`${Iconfont}-libraries`, null);
    setSymbolsByTypeID(Iconfont, libraryInfo.libraryID);
    deleteLocalIconfonts(libraryInfo);
    setLatestSelectedLibrary(Iconfont, null);
    webContents.executeJavaScript("onDidDeleteIconfonts()");
  });
  webContents.on("getIconfonts", async (libraryInfo, forceReload) => {
    setLatestSelectedLibrary(Iconfont, libraryInfo);

    let dir = libraryInfo.path;
    if (fs.existsSync(dir)) {
      let symbolMasters = [];
      let savedInfo = getSymbolsByTypeID(Iconfont, libraryInfo.libraryID);
      if (savedInfo && !forceReload) {
        symbolMasters = savedInfo;
      } else {
        let dirs = fs.readdirSync(dir);
        let symbols = [];
        for (let i = 0; dirs && i < dirs.length; i++) {
          let filePath = path.join(dir, dirs[i]);
          if (fs.statSync(filePath).isFile()) {
            if (path.extname(filePath) === ".svg") {
              symbols.push(dirs[i]);
            }
          }
        }
        for (let j = symbols.length - 1; symbols && j >= 0; j--) {
          let svg = symbols[j];
          let regex = new RegExp(/([\S|\s]+[\/\／]){1,}/g);
          let match = svg.match(regex);
          if (match) {
            let splits = svg.split("/");
            if (splits.length > 0) {
              let firstIndex = indexOfSymbol(symbolMasters, splits[0]);
              if (firstIndex === -1) {
                symbolMasters.push({
                  name: splits[0],
                  links: [],
                });
                firstIndex = symbolMasters.length - 1;
              }
              let base64String = fs.readFileSync(path.join(dir, svg), {
                encoding: "base64",
              });
              let [width, height] = getViewBoxSize(path.join(dir, svg));
              let symbolMaster = {
                key: md5(svg),
                name: path.basename(splits.slice(1).join("/"), ".svg"),
                fullName: svg,
                width,
                height,
                thumbnail: "data:image/svg+xml;base64, " + base64String,
              };
              symbolMasters[firstIndex].links.push(symbolMaster);
            }
          }
        }
        setSymbolsByTypeID(Iconfont, libraryInfo.libraryID, symbolMasters);
      }
      webContents.executeJavaScript(
        `onDidGetIconfonts(${JSON.stringify({ groups: symbolMasters })})`
      );
    } else {
      webContents.executeJavaScript(
        `onDidGetIconfonts(${JSON.stringify({ groups: [] })})`
      );
    }
  });
}

export function iconfontOnSelectionChanged(context) {
  let barType = getLatestBarType();
  if (barType === Iconfont) {
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
          if (splitArray) {
            if (splitArray.length >= 2) {
              let svgLayer;
              let document = sketch.Document.getSelectedDocument();
              let projectID = splitArray[0];
              let name = decodeURIComponent(splitArray[1]);
              let customColor;
              let customSize;
              let svgString = fs.readFileSync(
                path.join(getPathByType(Iconfont), projectID, name),
                { encoding: "utf8" }
              );
              if (splitArray.length === 4) {
                customColor = splitArray[2];
                customSize = JSON.parse(splitArray[3]);
              }
              svgLayer = sketch.createLayerFromData(svgString, "svg");
              let parent = layerParent || document.selectedPage;
              parent.layers.push(svgLayer);
              svgLayer.selected = true;
              let viewBoxWidth, viewBoxHeight;
              if (svgString) {
                let regex = new RegExp(/<svg width=".*" height=".*" viewBox/);
                let match = svgString.match(regex);
                if (match && match.length > 0) {
                  let firstMatch = match[0];
                  let splitArray = firstMatch.split(" ");
                  if (splitArray.length >= 3) {
                    let widthString = splitArray[1].substring(
                      7,
                      splitArray[1].length - 3
                    );
                    viewBoxWidth =
                      widthString === undefined ? 0 : Number(widthString);
                    let heightString = splitArray[2].substring(
                      8,
                      splitArray[2].length - 3
                    );
                    viewBoxHeight =
                      heightString === undefined ? 0 : Number(heightString);
                  }
                } else {
                  svgLayer.frame.width = Number(customSize["width"]) || 24;
                  svgLayer.frame.height = Number(customSize["height"]) || 24;
                  let shapeLayer = new sketch.ShapePath({
                    frame: {
                      x: 0,
                      y: 0,
                      width: Number(customSize["width"]) || 24,
                      height: Number(customSize["height"]) || 24,
                    },
                    shapeType: sketch.ShapePath.ShapeType.Rectangle,
                  });
                  for (
                    let index = 0;
                    svgLayer.layers && index < svgLayer.layers.length;
                    index++
                  ) {
                    let sublayer = svgLayer.layers[index];
                    sublayer.frame = {
                      x: 0,
                      y: 0,
                      width: Number(customSize["width"]) || 24,
                      height: Number(customSize["height"]) || 24,
                    };
                  }
                  svgLayer.layers.push(shapeLayer);
                }
              }
              //
              // console.log(
              //   `with = ${viewBoxWidth}, svgLayer.frame.width = ${svgLayer.frame.width}, height = ${viewBoxHeight}, svgLayer.frame.height = ${svgLayer.frame.height}`
              // );

              if (customColor) {
                applyColor(svgLayer, customColor);
              }

              if (
                viewBoxWidth &&
                viewBoxHeight &&
                (viewBoxWidth !== svgLayer.frame.width ||
                  viewBoxHeight !== svgLayer.frame.height)
              ) {
                for (let i = 0; i < svgLayer.layers.length; i++) {
                  svgLayer.layers[i].frame.width = Math.min(
                    viewBoxWidth,
                    svgLayer.layers[i].frame.width
                  );
                  svgLayer.layers[i].frame.height = Math.min(
                    viewBoxHeight,
                    svgLayer.layers[i].frame.height
                  );
                }
                if (
                  svgLayer.frame.width !== viewBoxWidth ||
                  svgLayer.frame.height !== viewBoxHeight
                ) {
                  let marginLeft = (viewBoxWidth - svgLayer.frame.width) / 2,
                    marginTop = (viewBoxHeight - svgLayer.frame.height) / 2;
                  let shapeLayer = new sketch.ShapePath({
                    frame: {
                      x: 0,
                      y: 0,
                      width: viewBoxWidth,
                      height: viewBoxHeight,
                    },
                    shapeType: sketch.ShapePath.ShapeType.Rectangle,
                  });
                  for (
                    let index = 0;
                    svgLayer.layers && index < svgLayer.layers.length;
                    index++
                  ) {
                    let sublayer = svgLayer.layers[index];
                    sublayer.frame = {
                      x: sublayer.frame.x + marginLeft,
                      y: sublayer.frame.y + marginTop,
                      width: sublayer.frame.width,
                      height: sublayer.frame.height,
                    };
                  }
                  svgLayer.layers.push(shapeLayer);
                }
              }

              svgLayer.adjustToFit();

              let centerX = layerFrame.x + layerFrame.width / 2;
              let centerY = layerFrame.y + layerFrame.height / 2;
              svgLayer.frame = {
                x: centerX - svgLayer.frame.width / 2,
                y: centerY - svgLayer.frame.height / 2,
                width: svgLayer.frame.width,
                height: svgLayer.frame.height,
              };
            }
          }
        }
      }
    }
  }
}

function applyColor(layer, color) {
  if (layer) {
    if (layer.type == "Shape" || layer.type === "ShapePath") {
      let fills = layer.style.fills;
      for (let i = 0; i < fills.length; i++) {
        if (fills[i].enabled) {
          fills[i].color = color;
        }
      }
      let borders = layer.style.borders;
      for (let i = 0; i < borders.length; i++) {
        if (borders[i].enabled) {
          borders[i].color = color;
        }
      }
    } else {
      if (layer.type == "Group") {
        layer.layers.forEach((subLayer) => {
          applyColor(subLayer, color);
        });
      }
    }
  }
}

function getViewBoxSize(svgPath) {
  let svgString = fs.readFileSync(svgPath, { encoding: "utf8" });
  let regex = new RegExp(/<svg width=".*" height=".*" viewBox/);
  let match = svgString.match(regex);
  let width, height;
  if (match && match.length > 0) {
    let firstMatch = match[0];
    let splitArray = firstMatch.split(" ");
    if (splitArray.length >= 3) {
      let widthString = splitArray[1].substring(7, splitArray[1].length - 3);
      width = widthString === undefined ? 0 : Number(widthString);
      let heightString = splitArray[2].substring(8, splitArray[2].length - 3);
      height = heightString === undefined ? 0 : Number(heightString);
    }
  }
  return [width, height];
}
