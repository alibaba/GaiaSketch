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
    adjustAllTexts,
    exportTree,
    groupCanContainLayers,
    groupCanGroupInIntersects,
    groupColumnRow,
    imageGroupOnlyImages,
    intersectGroups,
    reGroupCanImageGroups,
    revDetachAllSymbolInstance,
    revHandleMasks,
    revMergeShapesToImage,
    revRemoveAllHiddenLayersAndSlices,
    revRemoveEmptyShapePaths,
    revUnGroup,
    screenShort,
} from "./code-helper";
import * as fs from "@skpm/fs";
import { normalizeLayerFrame } from "./rect";
import GKEntry from "./sketch-components/GKEntry";
import GaiaXConvertor from "./core/GaiaXConvertor";
import MiniAppConvertor from "./core/MiniAppConvertor";
import VueConvertor from "./core/VueConvertor";
import ReactConvertor from "./core/ReactConvertor";
import { logger, printLayers } from "../logger";
import { isAllImages } from "../helper";
import * as os from "@skpm/os";
import * as path from "@skpm/path";

export function doExportCode(context, document, documentPath, selectedLayer, languages, destFolder, backgroundColor) {
    return new Promise(async (resolve, reject) => {
        if (document && selectedLayer) {

            let result = revDetachAllSymbolInstance(selectedLayer);
            let removeLayers = [];
            revRemoveAllHiddenLayersAndSlices(result, removeLayers);
            removeLayers.forEach((element) => {
                element.remove();
            });

            // printLayers(result);
            revHandleMasks(result);
            // printLayers(result);

            reGroupCanImageGroups(result);
            // printLayers(result);

            let rootLayer = revMergeShapesToImage(result.id, result);
            if (rootLayer) {
                let newGroup = new sketch.Group({
                    name: "__GAIA_ENTRY",
                    layers: [],
                });
                newGroup.parent = result.parent;
                rootLayer.parent = newGroup;
                result = newGroup;
                result.adjustToFit();
            } else {
                revImageGroupOnlyHasImages(result);
            }
            // printLayers(result);

            removeLayers = [];
            revRemoveAllHiddenLayersAndSlices(result, removeLayers);
            removeLayers.forEach((element) => {
                element.remove();
            });

            for (let index = 0; result.layers && index < result.layers.length; index++) {
                let element = result.layers[index];
                revUnGroup(result.id, element);
            }

            if (
                result.layers &&
                result.layers[0].frame.width < result.frame.width &&
                result.layers[0].frame.height < result.frame.height
            ) {
                let shape = new sketch.ShapePath({
                    shapeType: sketch.ShapePath.ShapeType.Rectangle,
                    style: {
                        borders: [{ enabled: false }],
                    },
                    frame: {
                        x: 0,
                        y: 0,
                        width: result.frame.width,
                        height: result.frame.height,
                    },
                });
                shape.parent = result;
                shape.index = 0;
            }
            normalizeLayerFrame(result);

            removeLayers = [];
            revRemoveEmptyShapePaths(result, removeLayers);
            removeLayers.forEach((element) => {
                element.remove();
            });

            groupCanContainLayers(result, result.frame);
            // printLayers(result);

            // // logger.log(`start intersectGroups`);
            intersectGroups(result);
            // printLayers(result);

            groupCanGroupInIntersects(result);
            // printLayers(result);

            let directions = ["column", "row"];
            let flagMap = {};
            directions.forEach((direction) => {
                groupColumnRow(result, direction, flagMap);
                // printLayers(result);
                flagMap = {};
            });

            adjustAllTexts(result);
            printLayers(result);

            for (let i = 0; i < languages.length; i++) {
                let lang = languages[i];
                const { name, codes } = await doConvert(context, document, result, lang, destFolder, backgroundColor);
                let assetsMap = {};
                for (let index = 0; index < codes.length; index++) {
                    const element = codes[index];
                    exportTree(
                        name,
                        destFolder,
                        assetsMap,
                        element.js,
                        element.css,
                        element.schema,
                        element.lang,
                        element.ext,
                        element.mock,
                        element.databinding
                    );
                }
            }
            resolve();
        } else {
            reject(new Error(""));
        }
    });
}

function revImageGroupOnlyHasImages(layer) {
    if (layer?.type === "Group") {
        for (let i = 0; i < layer?.layers?.length; i++) {
            let sublayer = layer.layers[i];
            revImageGroupOnlyHasImages(sublayer);
        }
        if (layer?.layers?.length > 0 && isAllImages(layer)) {
            sketch.export(layer, {
                "use-id-for-name": true,
                formats: "png",
                scales: "2",
                output: os.tmpdir(),
                "group-contents-only": true,
                overwriting: true,
            });
            let pngPath = path.join(os.tmpdir(), `${layer.id}@2x.png`);
            if (fs.existsSync(pngPath)) {
                let imageLayer = new sketch.Image({
                    name: layer.name,
                    image: pngPath,
                    frame: layer.frame,
                });
                let shouldBreak = layer.sketchObject.shouldBreakMaskChain();
                let originalIndex = layer.index;
                imageLayer.parent = layer.parent;
                layer.remove();
                imageLayer.index = originalIndex;
                imageLayer.sketchObject.shouldBreakMaskChain = true;
                fs.unlinkSync(pngPath);
            }
        }
    }
}



function doConvert(context, document, selectedLayer, lang, dir, backgroundColor) {
    return new Promise(async (resolve, reject) => {
        let page;
        if (selectedLayer) {
            try {
                page = new GKEntry(selectedLayer, backgroundColor);

                const codes = [];
                if (lang.startsWith("GaiaX")) {
                    const gaiaxConvert = new GaiaXConvertor(lang);
                    const gaiaxExportCode = gaiaxConvert.convert(page);
                    codes.push({
                        lang,
                        js: gaiaxExportCode.tree,
                        css: gaiaxExportCode.css,
                        schema: gaiaxExportCode.schema,
                        mock: gaiaxExportCode.mock,
                        databinding: gaiaxExportCode.databinding,
                        ext: "json",
                    });
                }

                if (lang == "React") {
                    const reactConvert = new ReactConvertor(lang);
                    const reactExportCode = reactConvert.convert(page);

                    codes.push({
                        lang,
                        js: reactExportCode.tree,
                        css: reactExportCode.css,
                        schema: reactExportCode.schema,
                        ext: "js",
                    });
                }


                if (lang == "Vue") {
                    const vueWebConvert = new VueConvertor(lang);
                    const {
                        tree: vueWebTree,
                        css: vueWebCss,
                        schema: vueWebSchema,
                        components: vueWebComponents,
                    } = vueWebConvert.convert(page);
                    codes.push({
                        lang,
                        js: vueWebTree,
                        css: vueWebCss,
                        schema: vueWebSchema,
                        ext: "Vue",
                    });
                }

                if (lang == "Mini-App") {
                    const miniAppConvert = new MiniAppConvertor(lang);
                    const miniAppExportCode = miniAppConvert.convert(page);
                    codes.push({
                        lang,
                        js: miniAppExportCode.tree,
                        css: miniAppExportCode.css,
                        schema: miniAppExportCode.schema,
                        ext: "js",
                    });
                }

                screenShort(selectedLayer, dir);

                resolve({ name: selectedLayer.name, codes });
            } catch (e) {
                reject(e);
            }
        } else {
            reject(new Error("导出失败"));
        }
    });
}
