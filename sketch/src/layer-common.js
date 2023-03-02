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
import * as cp from "@skpm/child_process";
import * as sketch from "sketch/dom";
import {getLatestBarType, setLatestBarType} from "./helper";
import {logger} from "./logger";

export function registerCommonIPC(context, webContents) {
    webContents.on("openInFinder", (folderPath, filePath) => {
        if (filePath) {
            NSWorkspace.sharedWorkspace().activateFileViewerSelectingURLs([
                NSURL.fileURLWithPath(path.join(folderPath, filePath)),
            ]);
        } else {
            NSWorkspace.sharedWorkspace().activateFileViewerSelectingURLs([NSURL.fileURLWithPath(folderPath)]);
        }
    });

    webContents.on("openUrl", (url) => {
        NSWorkspace.sharedWorkspace().openURL(NSURL.URLWithString(url));
    });

    webContents.on("openInGaiaStudio", (folderPath) => {
        let componentPath = folderPath;
        if (fs.existsSync(componentPath)) {
            cp.spawnSync("open", ["-b", "com.youku.gaia.studio", `'${componentPath}'`], {
                shell: "/bin/sh",
            });
        }
    });

    webContents.on("getPageOptions", (types = ["Artboard"]) => {
        const currentDocument = sketch.Document.getSelectedDocument();
        let pages = currentDocument.pages;
        let artboardsOptions = [];
        for (let i = pages.length - 1; i >= 0; i--) {
            let page = pages[i];
            if (page ) {
                if (!page.isSymbolsPage()) {
                    generateArtboardOptions(page, artboardsOptions, types);
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

function generateArtboardOptions(page, artboardsOptions, types) {
    let length = page.layers.length;
    let artboardsInPage = [];
    for (let j = length - 1; j >= 0; j--) {
        let layer = page.layers[j];
        if (types.includes(layer.type)) {
            artboardsInPage.push({
                id: String(layer.id),
                name: `🔴 ${layer.name}`,
                selected: layer.selected,
                type: layer.type,
            });
            for (let i = layer?.layers.length-1; i >= 0; i--) {
                let sublayer = layer.layers[i];
                if (types.includes(sublayer.type)) {
                    artboardsInPage.push({
                        id: String(sublayer.id),
                        name: `🟣 ${sublayer.name}` ,
                        selected: sublayer.selected,
                        type: sublayer.type
                    })
                }
            }
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
