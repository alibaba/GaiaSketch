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
import * as Console from "@skpm/console";
import * as Settings from "sketch/settings";
import {
    getAllSketchLibraries,
    getLatestSelectedLibrary,
    getRefreshIntervalByType,
    getSelectedLibrary,
    requestProjects,
    setLatestSelectedLibrary,
} from "../server/server-helper";
import { Page, RelatedServerProject, Style } from "../contants";
import { downloadLibrary } from "../server/downloads";
import { getSymbolsByTypeID, indexOfSymbol, screenshotsFolder, setSymbolsByTypeID } from "../helper";
import * as sketch from "sketch/dom";
import UI from "sketch/ui";
import dialog from "@skpm/dialog";
import dayjs from "dayjs";
import { logger } from "../logger";

let refreshIntervalId;
let refreshTimeoutId;

export function onStyleDestroy() {
    if (refreshTimeoutId) {
        clearTimeout(refreshTimeoutId);
    }
    if (refreshIntervalId) {
        clearInterval(refreshIntervalId);
    }
}

export function registerStyleIPC(context, webContents) {
    let interval = getRefreshIntervalByType(Page);
    if (interval > 0) {
        refreshTimeoutId = setTimeout(() => {
            requestProjects(Style).then(() => {
                refreshIntervalId = setInterval(() => {
                    requestProjects(Style)
                        .then(() => {})
                        .catch((error) => {});
                }, interval * 1000);
            });
        }, 10000);
    }

    Settings.setSettingForKey(`${Style}-libraries`, null);

    webContents.on("downloadStyleLibrary", (projectInfo) => {
        downloadLibrary(Style, projectInfo.projectID)
            .then((data) => {
                let library = sketch.Library.getLibraryForDocumentAtPath(path.join(data.libraryFolder, data.fileName));
                let relatedProject = Settings.settingForKey(RelatedServerProject) || {};
                relatedProject[data.libraryFolder] = {
                    libraryType: Style,
                    projectID: projectInfo.projectID,
                    libraryID: String(library.id),
                    lastModifiedAt: projectInfo.lastModifiedAt,
                };
                Settings.setSettingForKey(RelatedServerProject, relatedProject);
                webContents.executeJavaScript(
                    `onDidDownloadStyleLibrary(${JSON.stringify({
                        libraryInfo: {
                            ...projectInfo,
                            libraryID: String(library.id),
                        },
                    })})`
                );
            })
            .catch((error) => {
                webContents.executeJavaScript(`onDidDownloadStyleLibrary()`);
            });
    });

    webContents.on("deleteStyles", async (libraryInfo) => {
        let selectedLibrary = await getSelectedLibrary(Style, libraryInfo);
        if (selectedLibrary) {
            selectedLibrary.remove();
            setSymbolsByTypeID(Style, selectedLibrary.id, null);
            Settings.setSettingForKey(`${Style}-libraries`, null);
        }
        setLatestSelectedLibrary(Style, null);
        webContents.executeJavaScript("onDidDeleteStyles()");
    });

    webContents.on("importStyles", () => {
        dialog
            .showOpenDialog({
                filters: [{ name: "sketch", extensions: ["sketch"] }],
                title: "请选择要导入的样式库",
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
                        setLatestSelectedLibrary(Style, libraryInfo);
                        webContents.executeJavaScript(`onDidImportStyles(${JSON.stringify(libraryInfo)})`);
                    }
                } else {
                    webContents.executeJavaScript(`onDidImportStyles()`);
                }
            });
    });

    webContents.on("getStyleLibraries", async (forceReload) => {
        let libraries = [];
        let savedLibraries = Settings.settingForKey(`${Style}-libraries`);
        if (savedLibraries && !forceReload) {
            libraries = savedLibraries;
        } else {
            libraries = await requestProjects(Style);
        }
        let selectedLibrary;
        let latestLibrary = getLatestSelectedLibrary(Style);
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
            `onDidGetStyleLibraries(${JSON.stringify({
                libraries,
                selectedLibrary,
            })})`
        );
    });

    webContents.on("getStyles", async (libraryInfo, forceReload) => {
        try {
            setLatestSelectedLibrary(Style, libraryInfo);
            let selectedLibrary = await getSelectedLibrary(Style, libraryInfo);
            if (selectedLibrary) {
                let symbolMasters = [];
                let savedInfo = getSymbolsByTypeID(Style, libraryInfo.libraryID);
                if (savedInfo && !forceReload) {
                    symbolMasters = savedInfo;
                } else {
                    let libDocument = selectedLibrary.getDocument();
                    let symbols = libDocument && libDocument.getSymbols();
                    for (let j = symbols.length - 1; symbols && j >= 0; j--) {
                        let layer = symbols[j];
                        let regex = new RegExp(/([\S|\s]+[\/\／]){2,}/g);
                        let leafLayer = revFindLeaf(layer);
                        if (!leafLayer) {
                            continue;
                        }
                        let layerName = `${getTitleByType(leafLayer.type)}/${layer.name}`;
                        let match = layerName.match(regex);
                        if (match) {
                            sketch.export(layer, {
                                "use-id-for-name": true,
                                formats: "png",
                                scales: "2",
                                trimmed: false,
                                output: screenshotsFolder(),
                                overwriting: true,
                            });
                            let splits = layerName.split("/");
                            if (splits.length > 0) {
                                let firstIndex = indexOfSymbol(symbolMasters, splits[0]);
                                if (firstIndex === -1) {
                                    symbolMasters.push({
                                        name: splits[0],
                                        links: [],
                                    });
                                    firstIndex = symbolMasters.length - 1;
                                }
                                let secondIndex = indexOfSymbol(symbolMasters[firstIndex].links, splits[1]);
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
                                    leafName: leafLayer.name,
                                    leafID: leafLayer.id,
                                    width: layer.frame.width,
                                    height: layer.frame.height,
                                    thumbnail: "data:image/png;base64, " + base64String,
                                });
                            }
                        }
                    }
                    setSymbolsByTypeID(Style, libraryInfo.libraryID, symbolMasters);
                }

                webContents.executeJavaScript(`onDidGetStyles(${JSON.stringify({ groups: symbolMasters })})`);
            } else {
                webContents.executeJavaScript(`onDidGetStyles(${JSON.stringify({ groups: [] })})`);
            }
        } catch (e) {
            logger.log(e);
        }
    });

    webContents.on("formatLayer", (libraryInfo, layerInfo) => {
        let document = sketch.Document.getSelectedDocument();
        let layer;
        let sketchLibraries = getAllSketchLibraries();
        for (let i = 0; i < sketchLibraries.length; i++) {
            let sketchLibrary = sketchLibraries[i];
            if (sketchLibrary.id === libraryInfo.libraryID) {
                let libDocument = sketchLibrary.getDocument();
                layer = libDocument.getLayerWithID(layerInfo.leafID);
                if (layer) {
                    break;
                }
            }
        }
        if (document && layer) {
            if (document.selectedLayers.isEmpty) {
                UI.message(` 请先在Sketch中选择一个图层 ！`);
                return;
            }
            if (layer.type === "Text") {
                for (let i = 0; i < document.selectedLayers.layers.length; i++) {
                    let selectedLayer = document.selectedLayers.layers[i];
                    if (selectedLayer.type !== layer.type) {
                        UI.message(` 无法将【文本】类型的样式格式化【非文本】类型的图层 ！`);
                        return;
                    }
                }
            }
            for (let i = 0; i < document.selectedLayers.layers.length; i++) {
                let selectedLayer = document.selectedLayers.layers[i];
                if (selectedLayer.type === layer.type) {
                    let position = selectedLayer.name.indexOf("token:");
                    if (position == -1) {
                        position = selectedLayer.name.indexOf("token：");
                    }
                    if (position == -1) {
                        selectedLayer.name = selectedLayer.name + `(token:${layer.name})`;
                    } else {
                        let layerName = selectedLayer.name.substring(0, position - 1);
                        let tokenName = selectedLayer.name.substring(position + 6, selectedLayer.name.length - 1);
                        overwriteToken(layerName, tokenName, layer.name).then((overwrite) => {
                            selectedLayer.name = layerName;
                            if (overwrite) {
                                selectedLayer.name = selectedLayer.name + `(token:${layer.name})`;
                            } else {
                                selectedLayer.name = selectedLayer.name + `(token:${tokenName} | ${layer.name})`;
                            }
                        });
                        if (
                            selectedLayer.type === "Text" &&
                            selectedLayer.name &&
                            selectedLayer.name.indexOf("token:") !== -1
                        ) {
                            selectedLayer.style.fontSize = layer.style.fontSize;
                        } else {
                            selectedLayer.style = layer.style;
                        }
                    }
                    document.sketchObject.inspectorController().reload();
                } else if (selectedLayer.type === "Text") {
                    let color;
                    for (let i = 0; i < layer.style.fills.length; i++) {
                        let fill = layer.style.fills[i];
                        if (fill.enabled) {
                            color = fill.color;
                            break;
                        }
                    }
                    if (color) {
                        selectedLayer.textColor = color;
                        let position = selectedLayer.name.indexOf("token:");
                        if (position == -1) {
                            position = selectedLayer.name.indexOf("token：");
                        }
                        if (position == -1) {
                            selectedLayer.name = selectedLayer.name + `(token:${layer.name})`;
                        } else {
                            let layerName = selectedLayer.name.substring(0, position - 1);
                            let tokenName = selectedLayer.name.substring(position + 6, selectedLayer.name.length - 1);

                            overwriteToken(layerName, tokenName, layer.name).then((overwrite) => {
                                selectedLayer.name = layerName;
                                if (overwrite) {
                                    selectedLayer.name = selectedLayer.name + `(token:${layer.name})`;
                                } else {
                                    selectedLayer.name = selectedLayer.name + `(token:${tokenName} | ${layer.name})`;
                                }
                            });
                        }
                        document.sketchObject.inspectorController().reload();
                    }
                }
            }
        }
    });
}

function getTitleByType(type) {
    if (type === "Text") {
        return "文字";
    }
    if (type === "ShapePath" || type === "Shape") {
        return "颜色";
    }
}

function revFindLeaf(layer) {
    if (layer.type === "Shape" || layer.type === "ShapePath" || layer.type === "Text") {
        return layer;
    }
    let findLayer;
    if (layer.layers) {
        for (let index = 0; index < layer.layers.length; index++) {
            const element = layer.layers[index];
            findLayer = revFindLeaf(element);
            if (findLayer !== undefined) {
                break;
            }
        }
    }
    return findLayer;
}

function overwriteToken(layerName, originalToken, newToken) {
    return new Promise((resolve, reject) => {
        let clickIndex = dialog.showMessageBoxSync({
            type: "question",
            message: ` 当前图层已经关联了 "${originalToken}" , 你是想用 "${newToken}" 覆盖掉当前的token？还是追加当前token之后？`,
            detail: "1、如果前后两个是不同样式的token请选择【追加】\r\n2、如果前后两个是相同样式的token请选择【覆盖】",
            buttons: ["覆盖", "追加"],
        });
        resolve(clickIndex == 0);
    });
}
