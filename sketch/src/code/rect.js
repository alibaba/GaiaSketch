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

import * as stable from "stable";

export function containRect(rect1, rect2) {
  return (
    rect2.x >= rect1.x &&
    rect2.x + rect2.width <= rect1.x + rect1.width &&
    rect2.y >= rect1.y &&
    rect2.y + rect2.height <= rect1.y + rect1.height
  );
}

export function intersect(rect1, rect2) {
  return !(
    rect2.x >= rect1.x + rect1.width ||
    rect2.x + rect2.width <= rect1.x ||
    rect2.y >= rect1.y + rect1.height ||
    rect2.y + rect2.height <= rect1.y
  );
}

export function isRectEqual(rect1, rect2) {
  return (
    Math.abs(rect1.width - rect2.width) <= 2 &&
    Math.abs(rect1.height - rect2.height) <= 2
  );
}

export function isColumn(layers) {
  let compares = [...layers];
  stable.inplace(compares, (a, b) => {
    if (a.y < b.y) {
      return -1;
    }
    if (a.y > b.y) {
      return 1;
    }
    return 0;
  });
  for (let i = 0; i < compares.length && i + 1 < compares.length; i++) {
    let rect1 = compares[i];
    let rect2 = compares[i + 1];
    let column =
      rect1.y + rect1.height <= rect2.y || rect2.y + rect2.height <= rect1.y;
    if (!column) {
      return false;
    }
  }
  return true;
}

export function isRow(layers) {
  let compares = [...layers];
  stable.inplace(compares, (a, b) => {
    if (a.x < b.x) {
      return -1;
    }
    if (a.x > b.x) {
      return 1;
    }
    return 0;
  });
  for (let i = 0; i < compares.length && i + 1 < compares.length; i++) {
    let rect1 = compares[i];
    let rect2 = compares[i + 1];
    let row =
      rect1.x + rect1.width <= rect2.x || rect2.x + rect2.width <= rect1.x;
    if (!row) {
      return false;
    }
  }
  return true;
}

export function unionRect(layers) {
  let unionLayers = [...layers];
  let minX = 10000,
    minY = 10000,
    maxRight = -1,
    maxBottom = -1;
  for (let i = 0; i < unionLayers.length; i++) {
    minX = Math.min(minX, unionLayers[i].x);
    minY = Math.min(minY, unionLayers[i].y);
    maxRight = Math.max(maxRight, unionLayers[i].x + unionLayers[i].width);
    maxBottom = Math.max(maxBottom, unionLayers[i].y + unionLayers[i].height);
  }
  return {
    x: minX,
    y: minY,
    width: maxRight - minX,
    height: maxBottom - minY,
  };
}

export function findLayer(layers, layerId) {
  let find = false;
  for (let i = 0; layers && i < layers.length; i++) {
    if (layers[i].id === layerId) {
      find = true;
      break;
    }
  }
  return find;
}

export function hasOtherIntersect(parent, layers) {
  let ur = unionRect(layers);
  for (
    let index3 = 0;
    parent.layers && index3 < parent.layers.length;
    index3++
  ) {
    const element = parent.layers[index3];
    if (
      element.frame.width >= parent.frame.width &&
      element.frame.height >= parent.frame.height
    ) {
      continue;
    }
    if (!findLayer(layers, element.id) && intersect(ur, element.frame)) {
      return true;
    }
  }
  return false;
}

export function normalizeLayerFrame(layer) {
  if (layer) {
    let x = Math.max(0, Math.round(layer.frame.x));
    let y = Math.max(0, Math.round(layer.frame.y));
    layer.frame = {
      x,
      y,
      width: Math.max(0, Math.round(layer.frame.width)),
      height: Math.max(0, Math.round(layer.frame.height)),
    };
  }
  for (let i = 0; layer.layers && i < layer.layers.length; i++) {
    normalizeLayerFrame(layer.layers[i]);
  }
}
