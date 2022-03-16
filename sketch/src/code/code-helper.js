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

import {isAllShapes} from "../helper";
import * as os from "@skpm/os";
import * as path from "@skpm/path";
import * as fs from "@skpm/fs";
import * as Console from "@skpm/console";
import * as sketch from "sketch/dom";
import * as stable from "stable";
import * as TinyColor from "tinycolor2";
import {containRect, hasOtherIntersect, intersect, isColumn, isRectEqual, isRow,} from "./rect";
import * as md5 from "blueimp-md5";

const console = Console();

export function revHandleMasks(layer) {
  if (layer && layer.layers) {
    for (let i = 0; i < layer.layers.length; i++) {
      const subLayer = layer.layers[i];
      // console.log("\r\n\r\n");
      if (subLayer.name == "__IMAGE_MASK__") {
        continue;
      }
      // console.log(`start checking ${subLayer.name}`);
      if (subLayer.sketchObject.hasClippingMask()) {
        let masks = [];
        for (let j = i + 1; j < layer.layers.length; j++) {
          const maskedLayer = layer.layers[j];
          // console.log(`  ${maskedLayer.name}`);
          let parentCoordinate = maskedLayer.frame;
          if (layer.parent != undefined) {
            parentCoordinate = maskedLayer.frame.changeBasis({
              from: layer,
              to: layer.parent,
            });
          }
          // console.log(
          //   `  ${
          //     maskedLayer.name
          //   } hasClippingMask = ${maskedLayer.sketchObject.hasClippingMask()}`
          // );
          // console.log(
          //   `  ${
          //     maskedLayer.name
          //   } closestClippingLayer = ${maskedLayer.sketchObject.closestClippingLayer()}`
          // );
          if (
            (maskedLayer.sketchObject.hasClippingMask() ||
              maskedLayer.sketchObject.closestClippingLayer() != null) &&
            (parentCoordinate.x <= layer.frame.x ||
              parentCoordinate.y <= layer.frame.y ||
              maskedLayer.frame.x + maskedLayer.frame.width >=
                layer.frame.width ||
              maskedLayer.frame.y + maskedLayer.frame.height >=
                layer.frame.height) &&
            isAllShapes(maskedLayer)
          ) {
            masks.push(maskedLayer);
            // console.log(`     push ${maskedLayer.name}`);
          }
        }
        if (masks.length >= 1) {
          let newGroup = new sketch.Group({
            name: "__IMAGE_MASK__",
            layers: [],
          });
          newGroup.parent = layer;
          newGroup.index = i + 1;
          subLayer.parent = newGroup;
          newGroup.sketchObject.hasClippingMask = true;
          subLayer.frame = subLayer.frame.changeBasis({
            from: layer,
            to: newGroup,
          });
          // let maskString = "";
          for (let k = 0; k < masks.length; k++) {
            const mask = masks[k];
            // maskString += ` ,${mask.name}`;
            mask.parent = newGroup;
          }
          // console.log(maskString + "mask group !!!!!!!!!!!!");
          newGroup.adjustToFit();
          revHandleMasks(layer);
          break;
        }
      } else {
        revHandleMasks(subLayer);
      }
    }
  }
}

export function revDetachAllSymbolInstance(layer) {
  if (layer == undefined || layer.hidden) {
    return layer;
  }
  let result = layer;
  if (layer.layers && layer.layers.length > 0) {
    layer.layers.forEach((sublayer) => {
      revDetachAllSymbolInstance(sublayer);
    });
  } else if (layer.type == "SymbolInstance") {
    result = layer.detach({ recursively: true });
  }
  return result;
}

export function revRemoveAllSlices(layer, removeHiddenLayers) {
  if (layer == undefined) {
    return;
  }
  if (layer.hidden || layer.type == "Slice") {
    removeHiddenLayers.push(layer);
  }
  layer.layers &&
    layer.layers.forEach((sublayer) => {
      revRemoveAllSlices(sublayer, removeHiddenLayers);
    });
}

export function revMergeShapesToImage(layer) {
  if (
    layer.type == "Group" &&
    layer.exportFormats &&
    layer.exportFormats.length > 0
  ) {
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
      imageLayer.sketchObject.shouldBreakMaskChain = shouldBreak;
      fs.unlinkSync(pngPath);
    }
  } else {
    if (layer.name.indexOf("__IMAGE") == 0 || isAllShapes(layer)) {
      if (layer.type == "Group" && layer.name != "__IMAGE_MASK__") {
        let shape = new sketch.ShapePath({
          shapeType: sketch.ShapePath.ShapeType.Rectangle,
          style: {
            borders: [{ enabled: false }],
          },
          frame: {
            x: 0,
            y: 0,
            width: layer.frame.width,
            height: layer.frame.height,
          },
        });
        shape.parent = layer;
        shape.index = 0;
        shape.sketchObject.hasClippingMask = true;
        shape.sketchObject.clippingMaskMode = 0;
      }
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
        imageLayer.sketchObject.shouldBreakMaskChain = shouldBreak;
        fs.unlinkSync(pngPath);
      }
    } else {
      for (
        let index = 0;
        layer.layers && index < layer.layers.length;
        index++
      ) {
        const sublayer = layer.layers[index];
        if (sublayer.type == "Group") {
          revMergeShapesToImage(sublayer);
        }
      }
    }
  }
}

export function revUnGroup(layer) {
  if (layer == undefined || layer.hidden || layer.type != "Group") {
    return;
  }
  let parent = layer.parent;
  let originalIndex = layer.index;

  if (parent && layer.layers && layer.layers.length > 0) {
    let needsRemoves = [...layer.layers];
    let changeIndex = originalIndex;
    let shouldMoveOut = true;

    if (
      needsRemoves[0] &&
      needsRemoves[0].sketchObject.hasClippingMask() &&
      needsRemoves[
        needsRemoves.length - 1
      ].sketchObject.closestClippingLayer() != undefined
    ) {
      shouldMoveOut = false;
    }
    if (!shouldMoveOut && parent.layers.length == 1) {
      shouldMoveOut = true;
    }
    for (let index = 0; index < needsRemoves.length; index++) {
      const element = needsRemoves[index];
      if (shouldMoveOut) {
        let frame = element.frame;
        element.frame = frame.changeBasis({ from: layer, to: parent });
        element.parent = parent;
        element.index = changeIndex;
        changeIndex += 1;
      }
      revUnGroup(element);
    }
    if (shouldMoveOut) {
      layer.remove();
    } else {
      layer.name = "__GROUP__";
    }
  }
}

export function sortLayers(layer, direction) {
  if (layer && layer.layers) {
    let needSortLayers = [];
    let remainLayers = [];
    for (let i = 0; i < layer.layers.length; i++) {
      let layer1 = layer.layers[i];
      let containAll = false;
      for (let j = 0; j < layer.layers.length; j++) {
        let layer2 = layer.layers[j];
        if (layer1.id !== layer2.id) {
          if (containRect(layer1.frame, layer2.frame)) {
            containAll = true;
            break;
          }
        }
      }
      if (!containAll) {
        needSortLayers.push({
          id: layer.layers[i].id,
          name: layer.layers[i].name,
          frame: { ...layer.layers[i].frame },
        });
      } else {
        remainLayers.push({
          id: layer.layers[i].id,
          name: layer.layers[i].name,
          frame: { ...layer.layers[i].frame },
        });
      }
    }
    if (direction === "column") {
      stable.inplace(needSortLayers, (first, second) => {
        if (first.frame.y > second.frame.y) {
          return -1;
        }
        if (first.frame.y < second.frame.y) {
          return 1;
        }
        return 0;
      });
    }

    if (direction === "row") {
      stable.inplace(needSortLayers, (first, second) => {
        if (first.frame.x > second.frame.x) {
          return -1;
        }
        if (first.frame.x < second.frame.x) {
          return 1;
        }
        return 0;
      });
    }

    for (let j = 0; j < needSortLayers.length; j++) {
      for (let i = 0; i < layer.layers.length; i++) {
        if (layer.layers[i].id === needSortLayers[j].id) {
          layer.layers[i].index = remainLayers.length + j;
          break;
        }
      }
    }
  }
}

export function sortGroups(layers, direction) {
  if (direction === "column") {
    stable.inplace(layers, (first, second) => {
      if (first.y > second.y) {
        return -1;
      }
      if (first.y < second.y) {
        return 1;
      }
      return 0;
    });
  }
  if (direction === "row") {
    stable.inplace(layers, (first, second) => {
      if (first.x > second.x) {
        return -1;
      }
      if (first.x < second.x) {
        return 1;
      }
      return 0;
    });
  }
}

export function revRemoveEmptyShapePaths(layer, needRemoveLayers) {
  if (layer == undefined) {
    return;
  }
  let removeLayers = [];
  if (layer.type == "ShapePath") {
    if (layer.shapeType == sketch.ShapePath.ShapeType.Rectangle) {
      if (layer.style.opacity == 0) {
        removeLayers.push(layer);
      } else {
        if (layer.style.fills && layer.style.fills.length > 0) {
          let enable = false;
          for (let i = 0; i < layer.style.fills.length; i++) {
            if (layer.style.fills[i]["enabled"]) {
              enable = true;
              break;
            }
          }
          if (!enable) {
            removeLayers.push(layer);
          }
        }
        if (removeLayers.length <= 0) {
          if (layer.style.borders && layer.style.borders.length > 0) {
            let enable = false;
            for (let i = 0; i < layer.style.borders.length; i++) {
              if (layer.style.borders[i]["enabled"]) {
                enable = true;
                break;
              }
            }
            if (!enable) {
              removeLayers.push(layer);
            }
          }
          if (removeLayers.length <= 0) {
            if (layer.style.shadows && layer.style.shadows.length > 0) {
              let enable = false;
              for (let i = 0; i < layer.style.shadows.length; i++) {
                if (layer.style.shadows[i]["enabled"]) {
                  enable = true;
                  break;
                }
              }
              if (!enable) {
                removeLayers.push(layer);
              }
            }
          }
        }
      }
    }
  }
  needRemoveLayers = needRemoveLayers.concat(removeLayers);
  layer.layers &&
    layer.layers.forEach((sublayer) => {
      revRemoveEmptyShapePaths(sublayer, needRemoveLayers);
    });
}

export function groupCanContainLayers(layer, rootRect) {
  printLayers(layer);
  if (layer && layer.type === "Group" && layer.layers.length > 0) {
    let canGroups = [];
    for (let i = layer.layers.length - 1; i >= 0; i--) {
      let layer1 = layer.layers[i];
      if (layer1.type == "ShapePath" && isRectEqual(layer1.frame, rootRect)) {
        continue;
      }
      for (let j = 0; j < layer.layers.length; j++) {
        let layer2 = layer.layers[j];
        if (
          layer1.id !== layer2.id &&
          containRect(layer1.frame, layer2.frame)
        ) {
          canGroups.push(j);
        }
      }
      if (canGroups.length > 0) {
        let found = false;
        for (let k = 0; k < canGroups.length; k++) {
          if (canGroups[k] > i) {
            canGroups.splice(k, 0, i);
            found = true;
            break;
          }
        }
        if (!found) {
          canGroups.push(i);
        }
        break;
      }
    }
    if (canGroups.length > 0) {
      let str = "";
      for (let j = 0; j < canGroups.length; j++) {
        str += layer.layers[canGroups[j]].name + " / ";
      }
      moveLayers(layer, "__AUTO_GROUP__", canGroups);
      printLayers(layer);
      groupCanContainLayers(layer, rootRect);
    } else {
      layer.layers.forEach((subLayer) => {
        if (subLayer.name != "__AUTO_GROUP__") {
          groupCanContainLayers(subLayer, rootRect);
        }
      });
    }
  }
}

export function moveLayers(layer, name, canGroups) {
  let alreadyExistIndex = -1;
  let groupsLayers = [];
  for (let i = 0; i < canGroups.length; i++) {
    groupsLayers.push(layer.layers[canGroups[i]]);
  }
  for (let i = 0; i < groupsLayers.length; i++) {
    if (i == 0 && groupsLayers[i].type == "Group") {
      alreadyExistIndex = i;
    }
    break;
  }
  if (alreadyExistIndex != -1) {
    for (let k = 0; k < groupsLayers.length; k++) {
      if (k !== alreadyExistIndex) {
        groupsLayers[k].parent = groupsLayers[alreadyExistIndex];
        groupsLayers[k].frame = groupsLayers[k].frame.changeBasis({
          from: layer,
          to: groupsLayers[alreadyExistIndex],
        });
      }
    }
    groupsLayers[alreadyExistIndex].adjustToFit();
  } else {
    let newGroup = new sketch.Group({
      name,
      layers: [],
    });
    newGroup.parent = layer;
    for (let k = 0; k < groupsLayers.length; k++) {
      groupsLayers[k].parent = newGroup;
    }
    newGroup.index = canGroups[0];
    newGroup.adjustToFit();
  }
}

export function intersectGroups(layer) {
  if (layer && layer.type === "Group" && layer.layers) {
    let canGroups = [];
    for (let i = layer.layers.length - 1; i >= 0; i--) {
      let layer1 = layer.layers[i];
      // console.log(`${layer1.name} ${JSON.stringify(layer1.frame)}`);
      for (let j = 0; j < layer.layers.length; j++) {
        let layer2 = layer.layers[j];
        if (
          layer1.id !== layer2.id &&
          intersect(layer1.frame, layer2.frame) &&
          !containRect(layer1.frame, layer2.frame) &&
          !containRect(layer2.frame, layer1.frame)
        ) {
          canGroups.push(j);
        }
      }
      if (canGroups.length > 0) {
        let found = false;
        for (let k = 0; k < canGroups.length; k++) {
          if (canGroups[k] > i) {
            canGroups.splice(k, 0, i);
            found = true;
            break;
          }
        }
        if (!found) {
          canGroups.push(i);
        }
        break;
      }
    }
    if (canGroups.length > 0) {
      moveLayers(layer, "__AUTO_INTERSECT__", canGroups);
      intersectGroups(layer);
    } else {
      layer.layers.forEach((subLayer) => {
        if (subLayer.name != "__AUTO_INTERSECT__") {
          intersectGroups(subLayer);
        }
      });
    }
  }
}

export function groupColumnRow(layer, direction) {
  if (
    layer &&
    layer.name !== `__GAIA_${direction.toUpperCase()}__` &&
    layer.layers
  ) {
    let groupsMap = [];
    let layers = [];
    for (let i = 0; i < layer.layers.length; i++) {
      layers.push({
        index: i,
        id: layer.layers[i].id,
        name: layer.layers[i].name,
        ...layer.layers[i].frame,
      });
    }
    sortGroups(layers, direction);
    for (let i = layers.length - 1; i >= 0; i--) {
      let layer1 = layers[i];
      let canGroups = [
        {
          ...layer1,
        },
      ];
      for (let j = layers.length - 1; j >= 0; j--) {
        let layer2 = layers[j];
        if (layer1.id !== layer2.id) {
          let tryGroups = [
            ...canGroups,
            {
              ...layer2,
            },
          ];
          if (direction === "column") {
            let column = isColumn(tryGroups);
            let otherIntersect = hasOtherIntersect(layer, tryGroups);
            if (column && !otherIntersect) {
              canGroups.push({
                ...layer2,
              });
            }
          } else if (direction === "row") {
            let row = isRow(tryGroups);
            let otherIntersect = hasOtherIntersect(layer, tryGroups);
            // console.log(
            //   `${printLineLayers(tryGroups)} = ${row}, ${otherIntersect}`
            // );
            if (row && !otherIntersect) {
              canGroups.push({
                ...layer2,
              });
            }
          }
        }
      }
      if (canGroups.length > 1) {
        if (canGroups.length === layers.length) {
          break;
        } else {
          if (!alreadyInGroups(groupsMap, canGroups)) {
            groupsMap.push(canGroups);
          }
        }
      }
    }
    let groupLayersMap = [];
    for (let i = 0; i < groupsMap.length; i++) {
      let groupItems = groupsMap[i];
      let needGroupLayers = [];
      for (let j = 0; j < groupItems.length; j++) {
        needGroupLayers.push(layer.layers[groupItems[j].index]);
      }
      groupLayersMap.push(needGroupLayers);
    }
    for (let i = 0; i < groupsMap.length; i++) {
      let groupItems = groupsMap[i];
      let newGroup = new sketch.Group({
        name: `__GAIA_${direction.toUpperCase()}__`,
        layers: [],
      });
      newGroup.parent = layer;
      for (let k = 0; k < groupLayersMap[i].length; k++) {
        groupLayersMap[i][k].parent = newGroup;
      }
      let minIndex = 10000;
      for (let k = 0; k < groupItems.length; k++) {
        if (minIndex > groupItems[k].index) {
          minIndex = groupItems[k].index;
        }
      }
      newGroup.index = minIndex;
      newGroup.adjustToFit();
    }
    printLayers(layer);
    if (groupsMap.length > 0) {
      let directions = ["column", "row"];
      directions.forEach((dir) => {
        groupColumnRow(layer, dir);
      });
    } else {
      for (let i = 0; i < layer.layers.length; i++) {
        if (layer.layers[i].name !== "__AUTO_INTERSECT__") {
          groupColumnRow(layer.layers[i], direction);
        }
      }
    }
  }
}

export function alreadyInGroups(groups, targets) {
  let exist = false;
  for (let i = 0; i < groups.length; i++) {
    let group = groups[i];
    let shouldContinue = false;
    for (let j = 0; j < targets.length; j++) {
      let target = targets[j];
      let found = false;
      for (let k = 0; k < group.length; k++) {
        if (target.id === group[k].id) {
          found = true;
          break;
        }
      }
      if (!found) {
        shouldContinue = true;
        break;
      }
    }
    if (!shouldContinue) {
      exist = true;
      break;
    }
  }
  return exist;
}

export function printLayers(layer, depth = 0) {
  // let prefix = "";
  // for (let i = 0; i < depth; i++) {
  //   prefix += "  ";
  // }
  // console.log(`${prefix}${layer.name}`);
  // layer.layers &&
  //   layer.layers.forEach((sublayer) => {
  //     printLayers(sublayer, depth + 1);
  //   });
}

export function printLineLayers(layers) {
  let result = "";
  // for (let i = 0; i < layers.length; i++) {
  //   if (i > 0) {
  //     result += ",";
  //   }
  //   result += layers[i].name + "/" + layers[i].id;
  // }
  return result;
}

export function screenShort(layer, dir) {
  sketch.export(layer, {
    "use-id-for-name": true,
    formats: "png",
    scales: "2",
    output: dir,
    "group-contents-only": true,
    overwriting: true,
  });
}

export function cssConvert(text) {
  return text.replace(/([A-Z])/g, "-$1").toLowerCase();
}

export function shouldMergeToRoot(layer) {
  let shouldMergeLayer;
  if (layer.layers.length == 1 && canMergeStyle(layer.layers[0])) {
    shouldMergeLayer = layer.layers[0];
  }

  return shouldMergeLayer;
}

export function canMergeStyle(layer) {
  if (layer == undefined) {
    return false;
  }
  let keys = Object.keys(layer.style);
  for (let i = 0; i < keys.length; i++) {
    if (keys[i] == "name" || keys[i] == "type" || keys[i] == "overflow") {
      continue;
    }
    if (!isLayoutAttribute(keys[i])) {
      return false;
    }
  }
  return true;
}

export function isLayoutAttribute(styleKey) {
  const layoutAttributes = [
    "direction",
    "flexDirection",
    "flexBasis",
    "flexGrow",
    "flexShrink",
    "flexWrap",
    "justifyContent",
    "alignItems",
    "alignSelf",
    "alignContent",
    "width",
    "height",
    "maxWidth",
    "maxHeight",
    "minWidth",
    "minHeight",
    "aspectRatio",
    "display",
    "top",
    "left",
    "bottom",
    "right",
    "paddingLeft",
    "paddingTop",
    "paddingBottom",
    "paddingRight",
    "marginLeft",
    "marginTop",
    "marginBottom",
    "marginRight",
    "position",
    "padding",
    "margin",
  ];
  if (layoutAttributes.indexOf(styleKey) != -1) {
    return true;
  }
  return false;
}

export function normalizeColor(colorString, toRGBA) {
  let color = TinyColor(colorString);
  let result;
  if (color.isValid()) {
    if (color.getAlpha() != 1) {
      if (toRGBA == undefined || toRGBA) {
        color.setAlpha(Number(color.getAlpha()).toFixed(2));
        result = color.toRgbString();
      } else {
        result = color.toHex8String();
      }
    } else {
      result = color.toHexString();
    }
  }
  return result;
}

export function toCSSRGBA(RGBAStr) {
  return `rgba(${String(RGBAStr)
    .replace(/[\(\)]/g, "")
    .split(" ")
    .map((v) => {
      const [type, value] = v.split(":");
      if (type !== "a") {
        return Math.round(Number(value) * 255);
      }
      return Number(value);
    })
    .join(",")})`;
}

export function getAngle(px, py, mx, my) {
  let x = Math.abs(px - mx);
  let y = Math.abs(py - my);
  let z = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
  let cos = y / z;
  let radina = Math.acos(cos);
  let angle = Math.floor(180 / (Math.PI / radina));
  if (mx > px && my > py) {
    angle = 180 - angle;
  }
  if (mx == px && my > py) {
    angle = 180;
  }
  if (mx > px && my == py) {
    angle = 90;
  }
  if (mx < px && my > py) {
    angle = 180 + angle;
  }
  if (mx < px && my == py) {
    angle = 270;
  }
  if (mx < px && my < py) {
    angle = 360 - angle;
  }
  return angle;
}

export function normalizeAngle(angle) {
  let result;
  if (angle == 0) {
    result = "to top";
  } else if (angle == 180) {
    result = "to bottom";
  } else if (angle == 270) {
    result = "to left";
  } else if (angle == 90) {
    result = "to right";
  } else if (angle == 45) {
    result = "to top right";
  } else if (angle == 315) {
    result = "to top left";
  } else if (angle == 225) {
    result = "to bottom left";
  } else if (angle == 135) {
    result = "to bottom right";
  }
  return result;
}

export function convertToAngle(angleString) {
  let result;
  if (angleString == "to top") {
    result = 0;
  } else if (angleString == "to bottom") {
    result = 180;
  } else if (angleString == "to left") {
    result = 270;
  } else if (angleString == "to right") {
    result = 90;
  } else if (angleString == "to top right") {
    result = 45;
  } else if (angleString == "to top left") {
    result = 315;
  } else if (angleString == "to bottom left") {
    result = 225;
  } else if (angleString == "to bottom right") {
    result = 135;
  }
  return result;
}

function map(arr, handler) {
  let result = [];
  for (let i = 0; i < arr.count(); i++) {
    result.push(handler(arr[i]));
  }
  return result;
}

function makeShadowCSS(shadow, inset) {
  return `${
    inset ? "inset " : ""
  }${shadow.offsetX()}px ${shadow.offsetY()}px ${shadow.blurRadius()}px ${shadow.spread()}px ${normalizeColor(
    toCSSRGBA(shadow.color())
  )}`;
}

export function extractEffectStyle(layer) {
  const result = {};
  const shadows = layer.sketchObject.style().shadows();
  const innerShadows = layer.sketchObject.style().innerShadows();
  if (
    shadows.count() + innerShadows.count() > 0 &&
    layer.style.sketchObject.hasEnabledShadow()
  ) {
    const totalShadows = map(shadows, makeShadowCSS).concat(
      map(innerShadows, (s) => makeShadowCSS(s, true))
    );
    if (layer.type == "Text") {
      Object.assign(result, { textShadow: totalShadows.join(",") });
    } else {
      Object.assign(result, { boxShadow: totalShadows.join(",") });
    }
  }
  return result;
}

export function layerToBase64(layer, options = {}) {
  let outputDir = path.join(os.tmpdir(), "gaia-sketch-export-code-assets");
  sketch.export(layer, {
    "use-id-for-name": true,
    formats: "png",
    scales: "2",
    output: outputDir,
    "group-contents-only": true,
    overwriting: true,
  });
  let filePath = path.join(outputDir, `${layer.id}@2x.png`);
  if (fs.existsSync(filePath)) {
    let base64String = fs.readFileSync(filePath, { encoding: "base64" });
    let md5String = md5(base64String);
    fs.renameSync(filePath, path.join(outputDir, `${md5String}.png`));
    return `assets/${md5String}.png`;
  }
  return undefined;
}

export function mergeStyles(parent, removeLayer) {
  let middleLayer = parent.layers && removeLayer;
  let style1 = { ...parent.style };
  let style2 = { ...middleLayer.style };

  let leftGap, topGap, bottomGap, rightGap;
  if (
    style2.left != undefined ||
    style2.top != undefined ||
    style2.right != undefined ||
    style2.bottom != undefined
  ) {
    leftGap = style2.left;
    topGap = style2.top;
    rightGap = style2.right;
    bottomGap = style2.bottom;
    delete style1["position"];
    delete style1["flexDirection"];
    delete style1["justifyContent"];
    delete style1["alignItems"];
    style1.flexDirection = style2.flexDirection;
    style1.justifyContent = style2.justifyContent;
    style1.alignItems = style2.alignItems;
  } else {
    leftGap = style2.marginLeft;
    topGap = style2.marginTop;
    rightGap =
      style2.marginRight || style1.width - style2.marginLeft - style2.width;
    if (rightGap == 0) {
      rightGap = undefined;
    }
    bottomGap =
      style2.marginBottom || style1.height - style2.marginTop - style2.height;
    if (bottomGap == 0) {
      bottomGap = undefined;
    }
    delete style1["position"];
    style1.flexDirection = style2.flexDirection;
    style1.justifyContent = style2.justifyContent;
    style1.alignItems = style2.alignItems;
  }

  for (let style2Key in style2) {
    if (!isLayoutAttribute(style2Key)) {
      style1[style2Key] = style2[style2Key];
    }
  }

  for (let i = 0; middleLayer.layers && i < middleLayer.layers.length; i++) {
    let subLayer = middleLayer.layers[i];
    if (topGap != undefined && subLayer.style.top != undefined) {
      subLayer.style.top += topGap;
    }
    if (leftGap != undefined && subLayer.style.left != undefined) {
      subLayer.style.left += leftGap;
    }
    if (rightGap != undefined && subLayer.style.right != undefined) {
      subLayer.style.right += rightGap;
    }
    if (bottomGap != undefined && subLayer.style.bottom != undefined) {
      subLayer.style.bottom += bottomGap;
    }
  }

  for (let i = 0; middleLayer.layers && i < middleLayer.layers.length; i++) {
    let subLayer = middleLayer.layers[i];
    if (style2.flexDirection == "column") {
      if (leftGap != undefined) {
        subLayer.style.marginLeft = (subLayer.style.marginLeft || 0) + leftGap;
      }
      if (rightGap != undefined) {
        subLayer.style.marginRight =
          (subLayer.style.marginRight || 0) + rightGap;
      }
      if (i == 0) {
        if (topGap != undefined) {
          subLayer.style.marginTop = (subLayer.style.marginTop || 0) + topGap;
        }
      } else if (i == middleLayer.layers.length - 1) {
        if (bottomGap != undefined) {
          subLayer.style.marginBottom +=
            (subLayer.style.marginBottom || 0) + bottomGap;
        }
      }
    } else {
      if (topGap != undefined) {
        subLayer.style.marginTop = (subLayer.style.marginTop || 0) + topGap;
      }
      if (bottomGap != undefined) {
        subLayer.style.marginBottom =
          (subLayer.style.marginBottom || 0) + bottomGap;
      }
      if (i == 0) {
        if (leftGap != undefined) {
          subLayer.style.marginLeft =
            (subLayer.style.marginLeft || 0) + leftGap;
        }
      } else if (i == middleLayer.layers.length - 1) {
        if (rightGap != undefined) {
          subLayer.style.marginRight =
            (subLayer.style.marginRight || 0) + rightGap;
        }
      }
    }
  }

  parent.style = style1;
}

export function adjustAllTexts(layer) {
  if (layer && layer.layers && layer.layers.length > 0) {
    let isAllText = true;
    for (let i = 0; i < layer.layers.length; i++) {
      if (layer.layers[i].type != "Text") {
        isAllText = false;
        break;
      }
    }
    if (isAllText) {
      let shape = new sketch.ShapePath({
        shapeType: sketch.ShapePath.ShapeType.Rectangle,
        style: {
          borders: [{ enabled: false }],
        },
        frame: {
          x: 0,
          y: 0,
          width: layer.frame.width,
          height: layer.frame.height,
        },
      });
      shape.parent = layer;
      shape.index = 0;
    }
  }
  if (layer) {
    if (
      layer.type == "Text" &&
      !layer.sketchObject.hasFixedWidth() &&
      layer.frame.height < 2 * (layer.style.lineHeight || layer.style.fontSize)
    ) {
      layer.sketchObject.setTextBehaviour(0);
      layer.sketchObject.adjustFrameToFit();
    }
  }

  for (let i = 0; layer.layers && i < layer.layers.length; i++) {
    adjustAllTexts(layer.layers[i]);
  }
}

export function exportTree(
  name,
  dir,
  assetsMap,
  tree = "",
  css = "",
  schemas = "",
  language,
  suffix = "js",
  mock,
  databinding
) {
  let codeDir = path.join(dir, `${language}`);
  if (!fs.existsSync(codeDir)) {
    fs.mkdirSync(codeDir);
  }

  if (language == "Mini-App") {
    let pagePath = path.join(codeDir, "index.js");
    let dataJS = "";
    if (schemas.length > 0) {
      let schemaJSON = JSON.parse(schemas);
      schemaJSON.forEach((schema) => {
        if (schema.name && schema.default) {
          dataJS += `"${schema.name}" : "${schema.default.replace(
            /\n/g,
            "\\n"
          )}",\n`;
        }
      });
    }
    let pageJS = `
    Page({
      data: {
        ${dataJS}
      }
    });
    `;
    fs.writeFileSync(pagePath, replaceAllAssets(pageJS, assetsMap), {
      encoding: "utf8",
    });

    let jsPath = path.join(codeDir, "index.axml");
    fs.writeFileSync(jsPath, replaceAllAssets(tree, assetsMap), {
      encoding: "utf8",
    });

    let cssPath = path.join(codeDir, "index.acss");
    fs.writeFileSync(cssPath, replaceAllAssets(css, assetsMap), {
      encoding: "utf8",
    });
  } else if (language == "GaiaX") {
    let jsonPath = path.join(codeDir, "index.json");
    fs.writeFileSync(jsonPath, tree, { encoding: "utf8" });

    let cssPath = path.join(codeDir, "index.css");
    fs.writeFileSync(cssPath, replaceAllAssets(css, assetsMap), {
      encoding: "utf8",
    });

    let mockPath = path.join(codeDir, "index.data");
    fs.writeFileSync(mockPath, replaceAllAssets(mock, assetsMap), {
      encoding: "utf8",
    });

    let databindingPath = path.join(codeDir, "index.databinding");
    fs.writeFileSync(databindingPath, JSON.stringify(databinding), {
      encoding: "utf8",
    });
  } else if (language == "DX") {
    let jsonPath = path.join(codeDir, "main.xml");
    fs.writeFileSync(jsonPath, tree, { encoding: "utf8" });

    let mockPath = path.join(codeDir, "mock.json");
    fs.writeFileSync(mockPath, replaceAllAssets(mock, assetsMap), {
      encoding: "utf8",
    });
  } else {
    let jsPath = path.join(codeDir, `index.${suffix}`);
    fs.writeFileSync(jsPath, replaceAllAssets(tree, assetsMap), {
      encoding: "utf8",
    });

    let cssPath = path.join(codeDir, `index.css`);
    fs.writeFileSync(cssPath, replaceAllAssets(css, assetsMap), {
      encoding: "utf8",
    });
  }
}

export function replaceAllAssets(str, assetsMap) {
  let result = str;
  for (const assetsMapKey in assetsMap) {
    // console.log(
    //   `start replacing assets/${assetsMapKey} to ${assetsMap[assetsMapKey]}`
    // );
    result = result.replaceAll(
      `assets/${assetsMapKey}`,
      assetsMap[assetsMapKey]
    );
  }
  return result;
}

export function assetsDir() {
  let assetsPath = path.join(os.tmpdir(), "gaia-sketch-export-code-assets");
  if (!fs.existsSync(assetsPath)) {
    fs.mkdirSync(assetsPath);
  }
  return assetsPath;
}
