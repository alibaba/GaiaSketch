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
import * as Console from "@skpm/console";
import {
  adjustAllTexts,
  exportTree,
  groupCanContainLayers,
  groupColumnRow,
  intersectGroups,
  revDetachAllSymbolInstance,
  revHandleMasks,
  revMergeShapesToImage,
  revRemoveAllSlices,
  revRemoveEmptyShapePaths,
  revUnGroup,
  screenShort,
} from "./code-helper";

import {normalizeLayerFrame} from "./rect";
import GKEntry from "./sketch-components/GKEntry";
import GaiaXConvertor from "./core/GaiaXConvertor";
import MiniAppConvertor from "./core/MiniAppConvertor";
import VueConvertor from "./core/VueConvertor";
import RaxConvertor from "./core/RaxConvertor";
import ReactConvertor from "./core/ReactConvertor";

const console = Console();

export function doExportCode(
  context,
  document,
  documentPath,
  selectedLayer,
  languages,
  destFolder
) {
  return new Promise(async (resolve, reject) => {
    if (document && selectedLayer) {
      let result = revDetachAllSymbolInstance(selectedLayer);
      let removeLayers = [];
      revRemoveAllSlices(result, removeLayers);
      removeLayers.forEach((element) => {
        element.remove();
      });

      revHandleMasks(result);
      revMergeShapesToImage(result);

      for (
        let index = 0;
        result.layers && index < result.layers.length;
        index++
      ) {
        let element = result.layers[index];
        revUnGroup(element);
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
      intersectGroups(result);
      let directions = ["column", "row"];
      directions.forEach((direction) => {
        groupColumnRow(result, direction);
      });
      adjustAllTexts(result);
      for (let i = 0; i < languages.length; i++) {
        let lang = languages[i];
        const { name, codes } = doConvert(
          context,
          document,
          result,
          lang,
          destFolder
        );
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

function doConvert(context, document, selectedLayer, lang, dir) {
  let page;
  if (selectedLayer) {
    try {
      page = new GKEntry(selectedLayer);
      const codes = [];

      if (lang == "GaiaX") {
        const gaiaxConvert = new GaiaXConvertor(lang);
        const gaiaxExportCode = gaiaxConvert.convert(page);
        // //console.log(`tree=`, gaiaxExportCode.tree)
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
      if (lang == "Rax") {
        const raxConvert = new RaxConvertor(lang);
        const exportCode = raxConvert.convert(page);

        codes.push({
          lang,
          js: exportCode.tree,
          css: exportCode.css,
          schema: exportCode.schema,
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

      return { name: selectedLayer.name, codes };
    } catch (e) {
      console.log(e);
    }
  }
  return undefined;
}
