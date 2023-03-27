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

import * as fs from "@skpm/fs";
import * as cp from "@skpm/child_process";
import * as os from "@skpm/os";
import * as path from "@skpm/path";
import * as Settings from "sketch/settings";
import { Unknown } from "./contants";
import { hasEnabledBorder, hasEnabledFills } from "./code/code-helper";
import * as sketch from "sketch/dom";

export function getURLFromPath(path) {
    return typeof path === "string"
        ? NSURL.fileURLWithPath(
              NSString.stringWithString(path.replace(/^file:\/\//, "")).stringByExpandingTildeInPath()
          )
        : path;
}

export function copyFolderAsync(srcDir, desDir) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(desDir)) {
            fs.mkdirSync(desDir);
        }
        const copySpawn = cp.spawn("cp", ["-fpR", `'${srcDir}/'`, `'${desDir}/'`], {
            shell: "/bin/sh",
        });
        copySpawn.on("close", (code) => {
            if (code == 0) {
                let tarPath = `${desDir}/covers/covers.tar`;
                if (fs.existsSync(tarPath)) {
                    const unTarSpawn = cp.spawn("tar", ["-xvf", "covers.tar"], {
                        shell: "/bin/sh",
                        cwd: `${desDir}/covers`,
                    });
                    unTarSpawn.on("close", (code) => {
                        try {
                            fs.rmdirSync(tarPath);
                        } catch (error) {}
                        resolve();
                    });
                } else {
                    resolve();
                }
            } else {
                reject(new Error("拷贝失败"));
            }
        });
    });
}

export function isAllShapeOrImages(layer) {
    let allShape = true;

    if (layer.type == "Group") {
        for (let index = 0; layer.layers && index < layer.layers.length; index++) {
            const sublayer = layer.layers[index];
            if (!isAllShapeOrImages(sublayer)) {
                allShape = false;
                break;
            }
        }
    } else if (layer.type != "Shape" && layer.type != "ShapePath" && layer.type != "Image") {
        allShape = false;
    }
    return allShape;
}

export function isAllImages(layer) {
    let allImage = true;

    if (layer.type == "Group") {
        for (let index = 0; layer.layers && index < layer.layers.length; index++) {
            const sublayer = layer.layers[index];
            if (!isAllImages(sublayer)) {
                allImage = false;
                break;
            }
        }
    } else if (layer.type != "Image" && layer.type != "BackgroundImage") {
        allImage = false;
    }
    return allImage;
}

export function isAllShapes(layer) {
    let allShape = true;

    if (layer.type == "Group") {
        for (let index = 0; layer.layers && index < layer.layers.length; index++) {
            const sublayer = layer.layers[index];
            if (!isAllShapes(sublayer)) {
                allShape = false;
                break;
            }
        }
    } else if (layer.type != "Shape" && layer.type != "ShapePath") {
        allShape = false;
    }
    return allShape;
}

export function containSpread(layer, frame) {
    if (layer && layer.style && layer.style.shadows && layer.style.shadows.length > 0) {
        for (let index = 0; index < layer.style.shadows.length; index++) {
            let shadow = layer.style.shadows[index];
            if (shadow.enabled && layer.frame.width == frame.width && layer.frame.height == frame.height) {
                return true;
            }
        }
    }
    for (let index = 0; layer.layers && index < layer.layers.length; index++) {
        let subLayer = layer.layers[index];
        let container = containSpread(subLayer, frame);
        if (container) {
            return true;
        }
    }
    return false;
}

export function screenshotsFolder() {
    let folder = path.join(getRootDir(), "screenshots");
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
    }
    return folder;
}

export function indexOfSymbol(symbols, target) {
    let index = -1;
    for (let i = 0; i < symbols.length; i++) {
        if (target === symbols[i].name) {
            index = i;
            break;
        }
    }
    return index;
}

export function getRootDir() {
    let rootPath = path.join(os.homedir(), ".gaia-sketch-plugin");
    if (!fs.existsSync(rootPath)) {
        fs.mkdirSync(rootPath);
    }
    return rootPath;
}

export function getLocalIconfontDir() {
    let localDir = path.join(getRootDir(), "local-iconfonts");
    if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir);
    }
    return localDir;
}

export function getDownloadCacheDir() {
    let cacheDir = path.join(getRootDir(), "download-cache");
    if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir);
    }
    return cacheDir;
}

export function getToken() {
    return Settings.settingForKey("user-private-token");
}

export function setToken(token) {
    Settings.setSettingForKey("user-private-token", token);
}

export function getLatestBarType() {
    return Settings.settingForKey("latestBarType") || Unknown;
}

export function getLastSelectedLanguages() {
    return Settings.settingForKey("lastSelectedLanguages");
}

export function setLastSelectedLanguages(languages) {
    return Settings.setSettingForKey("lastSelectedLanguages", languages);
}

export function setLatestBarType(barType) {
    Settings.setSettingForKey("latestBarType", barType);
}

export function isAllWindowClosed() {
    let windows = NSApplication.sharedApplication().windows();
    let count = windows.count();
    return count == 0;
}

export function getSymbolsByTypeID(type, libraryID) {
    return Settings.settingForKey(`${type}-${libraryID}-symbols`);
}

export function setSymbolsByTypeID(type, libraryID, symbols) {
    Settings.setSettingForKey(`${type}-${libraryID}-symbols`, symbols);
}
