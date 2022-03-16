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

import GKGroup from "./GKGroup";
import GKImage from "./GKImage";
import GKText from "./GKText";
import GKShape from "./GKShape";
import * as UI from "sketch/ui";
import {mergeStyles, shouldMergeToRoot} from "../code-helper";

export default class GKEntry {
  // layers: any;
  // name: any;
  // id: any;
  // classMaps: any;
  constructor(propLayer) {
    this.layers = [];
    this.classMaps = {
      Group: GKGroup,
      Text: GKText,
      Shape: GKShape,
      ShapePath: GKShape,
      Image: GKImage,
      Page: GKGroup,
      Artboard: GKGroup,
    };
    let selectedLayer = propLayer;
    if (selectedLayer == undefined) {
      UI.message(" 请先选中一个图层！");
      return;
    }
    this.name = selectedLayer.name;
    this.id = selectedLayer.id;
    let layer = new this.classMaps[selectedLayer.type]({
      layer: selectedLayer,
      parent: this,
    });

    // console.log(
    //   `layer.name=${layer.name}, layer.layers.length = ${layer.layers.length}`
    // );
    // revRemoveGroup(layer);
    delete layer.style.top;
    delete layer.style.left;
    this.layers.push(layer);
  }
}

export function revRemoveGroup(layer) {
  let shouldMergeLayer = shouldMergeToRoot(layer);
  if (shouldMergeLayer != undefined) {
    mergeStyles(layer, shouldMergeLayer);
    let remindLayers = [...layer.layers];
    for (let i = 0; i < remindLayers.length; i++) {
      if (remindLayers[i].id == shouldMergeLayer.id) {
        remindLayers.splice(i, 1);
        break;
      }
    }
    layer.layers = []
      .concat(remindLayers)
      .concat(shouldMergeLayer.layers || []);
    revRemoveGroup(layer);
  } else {
    for (let index = 0; layer.layers && index < layer.layers.length; index++) {
      const element = layer.layers[index];
      revRemoveGroup(element);
    }
  }
}
