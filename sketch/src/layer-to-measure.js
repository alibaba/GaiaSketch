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
import dialog from "@skpm/dialog";
import * as fs from "@skpm/fs";
import * as path from "@skpm/path";
import * as os from "@skpm/os";

import {containSpread, copyFolderAsync, getURLFromPath, isAllShapes,} from "./helper";
import {getLatestSelectedLibrary, requestProjects,} from "./server/server-helper";
import {Token} from "./contants";
import * as Console from "@skpm/console";
import {downloadLibrary} from "./server/downloads";

let console = new Console();

export function registerExportMeasureIPC(context, webContents) {
  webContents.on("selectLocalDesignToken", () => {
    dialog
      .showOpenDialog({
        filters: [{ name: "xlsx", extensions: ["xlsx"] }],
        title: "请选择Design Token文件(.xlsx)",
        properties: ["openFile"],
      })
      .then(({ canceled, filePaths }) => {
        if (!canceled && filePaths && filePaths.length > 0) {
          let filePath = filePaths[0];
          let content = fs.readFileSync(filePath, { encoding: "binary" });
          webContents.executeJavaScript(
            `onDidSelectLocalDesignToken(${JSON.stringify({
              content,
              filePath: path.basename(filePath),
            })})`
          );
        }
      });
  });
  webContents.on("getServerDesignToken", (projectID) => {
    downloadLibrary(Token, projectID)
      .then((data) => {
        if (data.libraryFolder && data.fileName) {
          let content = fs.readFileSync(
            path.join(data.libraryFolder, data.fileName),
            { encoding: "binary" }
          );
          webContents.executeJavaScript(
            `onDidGetServerDesignToken(${JSON.stringify({
              content,
            })})`
          );
        }
      })
      .catch((error) => {
        webContents.executeJavaScript(`onDidGetServerDesignToken()`);
      });
  });
  webContents.on("getTokenLibraries", async () => {
    let libraries = await requestProjects(Token);
    let selectedLibrary;
    let latestLibrary = getLatestSelectedLibrary(Token);
    if (libraries && latestLibrary) {
      for (let i = 0; i < libraries.length; i++) {
        if (libraries[i].projectID === latestLibrary.projectID) {
          selectedLibrary = libraries[i];
          break;
        }
      }
    }
    webContents.executeJavaScript(
      `onDidGetTokenLibraries(${JSON.stringify({
        libraries,
        selectedLibrary,
      })})`
    );
  });
  webContents.on("exportMeasure", (params) => {
    dialog
      .showSaveDialog({ message: "请选择要保存到的目录" })
      .then(({ canceled, filePath }) => {
        if (!canceled && filePath && filePath.length > 0) {
          const document = sketch.Document.getSelectedDocument();
          if (document) {
            if (document.path) {
              document.save(
                getURLFromPath(decodeURIComponent(document.path)),
                {
                  saveMode: sketch.Document.SaveMode.Save,
                },
                (error) => {
                  layerToMeasure(
                    params,
                    document,
                    webContents,
                    context,
                    document.path,
                    filePath
                  );
                }
              );
            } else {
              let newPath = path.join(
                os.tmpdir(),
                String(NSUUID.UUID().UUIDString()) + ".sketch"
              );
              document.save(
                newPath,
                { saveMode: sketch.Document.SaveMode.SaveTo },
                (error) => {
                  layerToMeasure(
                    params,
                    document,
                    webContents,
                    context,
                    newPath,
                    filePath
                  );
                }
              );
            }
          }
        } else {
          webContents.executeJavaScript(
            `onDidExportedMeasure(${JSON.stringify({
              success: false,
              message: "已取消",
            })})`
          );
        }
      });
  });
}

export function layerToMeasure(
  options,
  document,
  webContents,
  context,
  documentPath,
  saveToPath
) {
  if (options && options.artboards) {
    let artboards = {};
    options.artboards.forEach((art) => {
      let artboard = document.getLayerWithID(art.key);
      if (artboard) {
        let page = artboard.getParentPage();
        if (page) {
          if (artboards[String(page.id)] == undefined) {
            artboards[String(page.id)] = [];
          }
          artboards[String(page.id)].push(artboard);
        }
      }
    });
    exportMeasureLayers(context, artboards, options, documentPath, saveToPath)
      .then((result) => {
        webContents.executeJavaScript(
          `onDidExportedMeasure(${JSON.stringify({
            success: true,
            filePath: result.path,
          })})`
        );
      })
      .catch((error) => {
        webContents.executeJavaScript(
          `onDidExportedMeasure(${JSON.stringify({
            success: false,
            message: error.message,
          })})`
        );
      });
  }
}

function exportMeasureLayers(context, data, options, documentPath, filePath) {
  return new Promise((resolve, reject) => {
    doExport(context, filePath, data, options, documentPath)
      .then((data) => {
        resolve(data);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function doExport(context, directory, data, options, documentPath) {
  return new Promise((resolve, reject) => {
    let targetPath;
    if (directory) {
      targetPath = directory;
    } else {
      targetPath = path.join(
        os.tmpdir(),
        "gaia-export-measure",
        String(NSUUID.UUID().UUIDString())
      );
    }
    if (fs.existsSync(targetPath)) {
      try {
        fs.rmdirSync(targetPath);
      } catch (error) {}
    }
    fs.mkdirSync(targetPath);
    const resourcesPath = context.plugin.urlForResourceNamed("").path();
    copyFolderAsync(path.join(resourcesPath, "export-measure"), targetPath)
      .then(() => {
        let tmpFolder = path.join(targetPath, "tmps");
        fs.mkdirSync(tmpFolder);

        let slicesFolder = path.join(targetPath, "slices");
        fs.mkdirSync(slicesFolder);

        let artboardsFolder = path.join(targetPath, "artboards");
        fs.mkdirSync(artboardsFolder);

        let modifiedArtboards = [];
        let doc;
        let toPath = path.join(
          os.tmpdir(),
          `gaia_export_temporary_${String(NSUUID.UUID().UUIDString())}.sketch`
        );

        let fromPath = decodeURIComponent(
          documentPath || sketch.getSelectedDocument().path
        );
        fs.copyFileSync(fromPath, toPath);
        doc =
          NSDocumentController.sharedDocumentController().openDocumentWithContentsOfURL_display_error(
            getURLFromPath(toPath),
            false,
            null
          );
        doc = sketch.Document.fromNative(doc);
        let slicesInfo = {};

        for (let key in data) {
          let artboards = data[key];
          artboards &&
            artboards.length > 0 &&
            artboards.forEach((artboard) => {
              slicesInfo[`${artboard.id}`] = {
                preset: {},
                auto: {},
              };
            });
          let [tmpModifiedArtboards] = modifyArtboards(
            doc,
            options.autoCut,
            slicesInfo,
            slicesFolder,
            artboards
          );
          modifiedArtboards = modifiedArtboards.concat(tmpModifiedArtboards);
        }

        sketch.export(modifiedArtboards, {
          "use-id-for-name": true,
          scales: "2",
          formats: "jpg",
          progressive: true,
          output: artboardsFolder,
          compression: 1,
        });

        let pngs = [];
        let scripts = [];
        modifiedArtboards &&
          modifiedArtboards.forEach((modifiedArtboard) => {
            let artboardDataPath = path.join(
              artboardsFolder,
              String(modifiedArtboard.id) + ".js"
            );
            fs.writeFileSync(
              artboardDataPath,
              `window['${String(modifiedArtboard.id)}']=` +
                JSON.stringify(modifiedArtboard)
            );
            scripts.push(
              `<script src="artboards/${
                String(modifiedArtboard.id) + ".js"
              }"></script>`
            );
            pngs.push({
              id: modifiedArtboard.id,
              name: modifiedArtboard.name.replace(/\//g, "-"),
              size: {
                width: modifiedArtboard.frame.width,
                height: modifiedArtboard.frame.height,
              },
              backgroundColor: modifiedArtboard.background.enabled
                ? modifiedArtboard.background.color
                : "white",
              thumbnailPath: modifiedArtboard.id + "@2x.jpg",
            });
          });

        let writeJSON = {};
        for (let pageID in data) {
          let artboards = data[pageID];
          let writeArray = [];
          for (let i = 0; i < artboards.length; i++) {
            let artboard = artboards[i];
            for (let j = 0; j < pngs.length; j++) {
              let png = pngs[j];
              if (`${png.id} ` == `${artboard.id} `) {
                writeArray.push(png);
                break;
              }
            }
          }
          let pageLayer = doc.getLayerWithID(pageID);
          let pageName;
          if (pageLayer) {
            pageName = pageLayer.name;
          } else {
            pageName = pageID;
          }
          writeJSON[`${pageID} `] = {
            name: pageName,
            content: writeArray,
          };
        }
        let writeContent = `
      window['__ARTBOARDS__'] = ${JSON.stringify(writeJSON)};
      `;
        writeContent += `window['__UNIT__'] = '${options.unit}';`;
        if (options.allowDesignToken) {
          writeContent += `window['__TOKENS__'] = ${JSON.stringify(
            options.tokens
          )};`;
        }

        if (slicesInfo) {
          writeContent += `window['__SLICES_INFOS__'] = ${JSON.stringify(
            slicesInfo
          )};`;
        }
        try {
          fs.rmdirSync(path.join(targetPath, "tmps"));
        } catch (error) {}
        fs.writeFileSync(path.join(targetPath, "data.js"), writeContent);
        let indexContent = fs.readFileSync(
          path.join(targetPath, "index.html"),
          { encoding: "utf8" }
        );
        indexContent = indexContent.replace(
          `<script src="data.js"></script>`,
          `<script src="data.js"></script>${scripts.join("")}`
        );
        fs.writeFileSync(path.join(targetPath, "index.html"), indexContent);
        // doc && doc.save();
        doc && doc.close();
        if (toPath && fs.existsSync(toPath)) {
          fs.unlinkSync(toPath);
        }
        resolve({ path: targetPath });
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function modifyArtboards(doc, autoCut, slicesInfo, slicesFolder, artboards) {
  let returnArtboards = [];
  artboards &&
    artboards.forEach((arboard) => {
      let tmp = doc.getLayerWithID(arboard.id);
      if (tmp) {
        returnArtboards.push(tmp);
      }
    });
  returnArtboards &&
    returnArtboards.forEach((artboard) => {
      if (
        artboard &&
        artboard.layers &&
        artboard.layers.length == 1 &&
        artboard.layers[0].type == "Group"
      ) {
        let group = artboard.layers[0];
        if (
          group.layers &&
          group.layers.length > 0 &&
          group.layers[0].type != "ShapePath" &&
          group.layers[0].type != "Shape"
        ) {
          let createdLayer = new sketch.ShapePath({
            name: group.name,
            shapeType: sketch.ShapePath.ShapeType.Rectangle,
            frame: {
              x: 0,
              y: 0,
              width: group.frame.width,
              height: group.frame.height,
            },
          });
          createdLayer.parent = group;
          createdLayer.index = 0;
          createdLayer.sketchObject.hasClippingMask = true;
        }
      }
    });
  returnArtboards &&
    returnArtboards.forEach((artboard) => {
      detachAllSymbolInstance(
        autoCut,
        slicesInfo[`${artboard.id}`],
        slicesFolder,
        artboard
      );
    });

  return [returnArtboards];
}

function detachAllSymbolInstance(autoCut, slicesInfo, slicesFolder, layer) {
  if (layer == undefined || layer.hidden) {
    return;
  }
  if (autoCut) {
    exportAllFormats(slicesInfo, slicesFolder, layer);
  }

  let currentLayer = layer;
  if (layer.layers && layer.layers.length > 0) {
    layer.layers.forEach((sublayer) => {
      detachAllSymbolInstance(autoCut, slicesInfo, slicesFolder, sublayer);
    });
  } else if (layer.type == "SymbolInstance") {
    let originalLayerIndex = layer.index;
    let shouldBreak = layer.sketchObject.shouldBreakMaskChain();
    let parent = layer.parent;
    let originalFrame = layer.frame;
    let detachedLayer;
    try {
      detachedLayer = layer.detach({ recursively: false });
    } catch (error) {}
    if (detachedLayer == null && parent) {
      let createdLayer = new sketch.ShapePath({
        name: "ignore",
        shapeType: sketch.ShapePath.ShapeType.Rectangle,
        frame: { x: 0, y: 0, width: 1, height: 1 },
      });
      parent.layers.push(createdLayer);
      createdLayer.index = originalLayerIndex;
      createdLayer.sketchObject.shouldBreakMaskChain = shouldBreak;
    }
    currentLayer = detachedLayer;
    if (detachedLayer) {
      let nowFrame = detachedLayer.frame;

      if (
        (nowFrame.x != originalFrame.x ||
          nowFrame.y != originalFrame.y ||
          nowFrame.width != originalFrame.width ||
          nowFrame.height != originalFrame.height) &&
        !allTextLayer(detachedLayer)
      ) {
        let originalIndex = detachedLayer.index;
        let newGroup = new sketch.Group({
          name: layer.name,
          frame: {
            x: nowFrame.x - Math.abs(nowFrame.x - originalFrame.x),
            y: nowFrame.y - Math.abs(nowFrame.y - originalFrame.y),
            width: Math.max(originalFrame.width, nowFrame.width),
            height: Math.max(originalFrame.height, nowFrame.height),
          },
        });
        newGroup.sketchObject.shouldBreakMaskChain = shouldBreak;
        if (parent) {
          parent.layers.push(newGroup);
          let pushInLayer = detachedLayer.remove();
          newGroup.index = originalIndex;
          newGroup.layers.push(
            new sketch.ShapePath({
              name: layer.name + "gaia_resize",
              shapeType: sketch.ShapePath.ShapeType.Rectangle,
              frame: {
                x: 0,
                y: 0,
                width: newGroup.frame.width,
                height: newGroup.frame.height,
              },
            })
          );
          pushInLayer.frame = {
            x: pushInLayer.frame.x - newGroup.frame.x,
            y: pushInLayer.frame.y - newGroup.frame.y,
            width: pushInLayer.frame.width,
            height: pushInLayer.frame.height,
          };
          newGroup.layers.push(pushInLayer);
        }
      }
    }
    if (detachedLayer && detachedLayer.layers) {
      detachedLayer.layers.forEach((sublayer) => {
        detachAllSymbolInstance(autoCut, slicesInfo, slicesFolder, sublayer);
      });
    }
  }
  if (currentLayer == undefined || currentLayer.type != "Group") {
    return;
  }
  if (currentLayer.exportFormats && currentLayer.exportFormats.length > 0) {
  } else {
    if (
      autoCut &&
      isAllShapes(currentLayer) &&
      !containSpread(currentLayer, currentLayer.frame)
    ) {
      let scales = ["2", "3"];
      let layerName = generateCombineLayerName(currentLayer);
      scales.forEach((scale) => {
        let dir = path.join(
          slicesFolder,
          "auto",
          layerName,
          String(scale) + "x"
        );
        if (!fs.existsSync(path.join(dir, "index.png"))) {
          sketch.export(currentLayer, {
            "use-id-for-name": true,
            formats: "png",
            scales: scale,
            trimmed: false,
            output: dir,
            "group-contents-only": true,
            overwriting: true,
          });
          let subDirs = fs.readdirSync(dir);
          subDirs &&
            subDirs.forEach((filename) => {
              let tmpPath = path.join(dir, "index.png");
              if (fs.existsSync(tmpPath)) {
                try {
                  fs.rmdirSync(tmpPath);
                } catch (error) {}
              }
              fs.renameSync(
                path.join(dir, filename),
                path.join(dir, "index.png")
              );
            });
          if (slicesInfo["auto"][layerName] == undefined) {
            slicesInfo["auto"][layerName] = [];
          }
          slicesInfo["auto"][layerName].push({
            size: String(scale) + "x",
            format: "png",
          });
        }
      });
    }
  }
}

function allTextLayer(layer) {
  let allText = true;
  for (let index = 0; layer.layers && index < layer.layers.length; index++) {
    const element = layer.layers[index];
    if (element.type != "Text") {
      allText = false;
      break;
    }
  }
  return allText;
}

function exportAllFormats(slicesInfo, slicesFolder, layer) {
  if (layer && !layer.hidden) {
    if (layer.exportFormats && layer.exportFormats.length > 0) {
      for (let index = 0; index < layer.exportFormats.length; index++) {
        const format = layer.exportFormats[index];
        if (format && format.size && String(format.size).endsWith("x")) {
          let layerName = layer.name.replace(/\//g, "-");
          let dir = path.join(
            slicesFolder,
            "preset",
            layerName,
            String(format.size)
          );
          let targetPath = path.join(dir, `index.${format.fileFormat}`);
          if (!fs.existsSync(targetPath)) {
            sketch.export(layer, {
              "use-id-for-name": true,
              formats: format.fileFormat,
              scales: String(format.size).substring(
                0,
                String(format.size).length - 1
              ),
              trimmed: false,
              output: dir,
              "group-contents-only": true,
              overwriting: true,
            });
            let subDirs = fs.readdirSync(dir);
            if (subDirs && subDirs.length > 0) {
              subDirs &&
                subDirs.forEach((filename) => {
                  let tmpPath = path.join(dir, "index." + format.fileFormat);
                  if (fs.existsSync(tmpPath)) {
                    try {
                      fs.rmdirSync(tmpPath);
                    } catch (error) {}
                  }
                  fs.renameSync(
                    path.join(dir, filename),
                    path.join(dir, "index." + format.fileFormat)
                  );
                });
            }
            if (slicesInfo["preset"][layerName] == undefined) {
              slicesInfo["preset"][layerName] = [];
            }
            slicesInfo["preset"][layerName].push({
              size: String(format.size),
              format: format.fileFormat,
            });
          }
        }
      }
    } else if (
      layer.type == "Shape" ||
      layer.type == "ShapePath" ||
      layer.type == "Text"
    ) {
      if (
        layer.name &&
        (layer.name.indexOf("token:") != -1 ||
          layer.name.indexOf("token：") != -1)
      ) {
        layer.name = layer.name.replace(/\s+/g, "");
      }
    }
  }
}

function generateCombineLayerName(layer) {
  let layerName = "";
  if (layer && layer.name) {
    layerName = `${layer.name.replace(/\//gi, "-")}`;
  }
  if (layer && layer.parent && layer.parent.name) {
    layerName = `${layer.parent.name.replace(/\//gi, "_")}` + "-" + layerName;
  }
  layerName = `${layerName.replace(/\#/gi, "-")}`;
  return layerName;
}
