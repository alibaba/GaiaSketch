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

import GKLayer from "./GKLayer";
import GKText from "./GKText";
import GKImage from "./GKImage";
import GKShape from "./GKShape";
import GKSlice from "./GKSlice";
import {normalizeColor} from "../code-helper";
import * as stable from "stable";
import * as sketch from "sketch/dom";
import * as TinyColor from "tinycolor2";

export default class GKGroup extends GKLayer {
  // notContainOverfow: boolean | undefined;
  constructor(props) {
    super(props);
    this.type = "Group";
    this.style.type = this.type;
    if (props.layer === undefined) {
      return;
    }
    if (props.customStyle) {
      this.style.left = Math.floor(props.customStyle.left);
      this.style.top = Math.floor(props.customStyle.top);
    }

    if (props.layer.layers !== undefined && props.layer.layers.length > 0) {
      for (let index = 0; index < props.layer.layers.length; index++) {
        const subLayer = props.layer.layers[index];
        if (subLayer.hidden) {
          continue;
        }
        //console.log(`for eatch sublayer = ${subLayer.name} sublayer.type = ${subLayer.type}`)
        let gklayer;
        if (subLayer.type === "Text") {
          let attributes = getAttributes(subLayer, props.path);
          if (attributes.length > 1) {
            gklayer = new GKGroup({
              parent: this,
            });
            gklayer.type = "Group";
            gklayer.name = "__GAIA_ROW__" + subLayer.name;
            let width = 0;
            attributes.forEach((att) => {
              let tmpLayer = new GKText({
                parent: this,
              });
              tmpLayer.text = String(att.char);
              tmpLayer.type = "Text";
              tmpLayer.name = String(att.char);
              tmpLayer.style = Object.assign({}, att.style);
              width += tmpLayer.style.width;
              gklayer.layers.push(tmpLayer);
            });
            gklayer.layers = sortGroupLayers(gklayer.layers, gklayer, this);
            gklayer.style = Object.assign(
              {},
              {
                left: Math.round(subLayer.frame.x),
                top: Math.round(subLayer.frame.y),
                width: Math.max(width, 0),
                height: Math.max(
                  Math.round(subLayer.frame.height),
                  Math.round(getMaxHeightFromAttributes(attributes))
                ),
                alignItems: "flex-end",
              }
            );
          } else {
            gklayer = new GKText({
              layer: subLayer,
              parent: this,
              scale: props.scale,
              path: props.path ? `${props.path}/${subLayer.id}` : subLayer.id,
            });
          }
        } else if (subLayer.type === "Image") {
          gklayer = new GKImage({
            layer: subLayer,
            parent: this,
            scale: props.scale,
            path: props.path ? `${props.path}/${subLayer.id}` : subLayer.id,
          });
        } else if (subLayer.type === "Shape" || subLayer.type === "ShapePath") {
          if (treatAsImageLayer(subLayer)) {
            gklayer = new GKImage({
              layer: subLayer,
              parent: this,
              scale: props.scale,
              layerToImage: true,
            });
          } else {
            gklayer = new GKShape({
              layer: subLayer,
              parent: this,
              scale: props.scale,
            });
          }
        } else if (subLayer.type === "Group") {
          gklayer = this.groupLayer(subLayer, this, props.scale, props.path);
        } else {
          if (subLayer.sketchObject.class() == "MSSliceLayer") {
            gklayer = new GKSlice({
              layer: subLayer.sketchObject,
              parent: this,
            });
          }
        }
        if (gklayer !== undefined) {
          this.layers.push(gklayer);
        }
      }

      // this.layers = this.layers.concat(this.masks);
      // //console.log(`------------------ before`);
      // printLayers(0, this);
      this.layers = sortGroupLayers(this.layers, this, props.parent);
      // console.log(
      //   `sortedLayer name = ${this.name} layers.length = ${this.layers.length}, sortedLayer.layers[0].name = ${this.layers[0].name}`
      // );
      // //console.log(`------------------ middle`);
      // printLayers(0, this);
      // //console.log(`------------------ end`);
      if (!this.notContainOverfow) {
        this.style.overflow = "hidden";
      }
    }
  }

  groupLayer(layer, parent, scale, argPath) {
    let newLayer;

    let [findLayer, customStyle] = revFindRealGroup(layer, {
      left: layer.frame.x,
      top: layer.frame.y,
    });
    newLayer = new GKGroup({
      layer: findLayer,
      parent,
      customStyle,
      scale,
      path: argPath,
    });

    return newLayer;
  }
}

function getAttributes(layer, argPath) {
  let originText = layer.text;
  let currentPath = argPath ? `${argPath}/${layer.id}` : layer.id;

  //console.log(`from text=${originText}, to text=${layer.text}`);
  let nativeObject = layer.sketchObject;
  let attString = nativeObject.attributedStringValue();
  let attributedStringArray = [];
  /**
   * MSAttributedStringColorAttribute = "<MSImmutableColor: 0x600000478d00>
   (D9AB5C20-E9E7-4E8E-99EC-4EB1281A57D5)"; NSFont =
   "\"PingFangSC-Semibold 24.00
   */
  // console.log(`attString = ${attString}`)
  for (let index = 0; index < attString.length(); index++) {
    let charAtIndex = attString
      .string()
      .substringWithRange(NSMakeRange(index, 1));
    let attribute = attString.attributesAtIndex_effectiveRange(
      index,
      NSMakeRange(0, attString.length())
    );
    let charObject = {};
    charObject.char = charAtIndex;
    charObject.style = {
      color: normalizeColor(
        `#${attribute["MSAttributedStringColorAttribute"].hexValue()}`
      ),
      fontSize: attribute["NSFont"].pointSize(),
      fontFamily: attribute["NSFont"].familyName(),
    };
    attributedStringArray.push(charObject);
  }
  let subStrings = [];
  let currentAttribute = {};
  for (let index = 0; index < attributedStringArray.length; index++) {
    const element = attributedStringArray[index];

    if (index == 0) {
      currentAttribute = element;
      subStrings.push(currentAttribute);
    } else {
      if (attributedStringIsSame(currentAttribute.style, element.style)) {
        currentAttribute.char = currentAttribute.char + element.char;
      } else {
        currentAttribute = element;
        subStrings.push(element);
      }
    }
  }
  let left = 0;
  for (let index = 0; subStrings && index < subStrings.length; index++) {
    let subAttribute = subStrings[index];
    let str = NSString.alloc().initWithString(subAttribute.char);
    let size = str.sizeWithFont(
      NSFont.fontWithName_size(
        subAttribute.style.fontFamily,
        subAttribute.style.fontSize
      )
    );
    // console.log(`str = ${subAttribute.char}, size=`, size);
    subAttribute.style = Object.assign({}, subAttribute.style, {
      left,
      top: 0,
      width: Math.ceil(Number(size.width)) + 1,
      height: Math.min(layer.frame.height, Math.ceil(Number(size.height)) + 1),
    });
    left += subAttribute.style.width;
  }
  layer.text = originText;
  return subStrings;
}

function attributedStringIsSame(a, b) {
  if (a === undefined || b === undefined) {
    return true;
  }
  if (
    a.color !== b.color ||
    a.fontSize !== b.fontSize ||
    a.fontFamily !== b.fontFamily
  ) {
    return false;
  }
  return true;
}

function sortGroupLayers(layers, thisLayer, parent) {
  let sortedLayers = [...layers];
  if (sortedLayers.length > 1) {
    let firstLayer = sortedLayers[0];
    if (
      firstLayer.type == "ShapePath" &&
      firstLayer.layers.length <= 0 &&
      Math.abs(firstLayer.style.width - thisLayer.style.width) <= 2 &&
      Math.abs(firstLayer.style.height - thisLayer.style.height) <= 2 &&
      (firstLayer.style.opacity == 1 ||
        firstLayer.style.opacity == undefined ||
        firstLayer.style.borderImage != undefined ||
        onlyBorderColor(firstLayer))
    ) {
      let newStyle = Object.assign({}, firstLayer.style);
      newStyle = Object.assign(newStyle, thisLayer.style);
      thisLayer.style = newStyle;
      sortedLayers.splice(0, 1);
    }
  }

  if (thisLayer.style.borderImage != undefined) {
    // 处理线性渐变边框的情况
    let borderLayer;
    if (thisLayer.style.opacity == 1 || thisLayer.style.opacity == undefined) {
      borderLayer = new GKShape({
        parent: thisLayer,
      });
      borderLayer.type = "ShapePath";
      borderLayer.name = "ShapePathBorder";
      borderLayer.id = NSUUID.UUID().UUIDString();
      borderLayer.style = {
        top: thisLayer.style.borderWidth || 1,
        left: thisLayer.style.borderWidth || 1,
        backgroundColor: thisLayer.style.backgroundColor || "#ffffff",
        width: thisLayer.style.width - 2 * (thisLayer.style.borderWidth || 1),
        height: thisLayer.style.height - 2 * (thisLayer.style.borderWidth || 1),
        borderRadius: thisLayer.style.borderRadius,
      };
      let color = TinyColor(borderLayer.style.backgroundColor);
      if (color.isValid()) {
        borderLayer.style.backgroundColor = color.setAlpha(1).toHexString();
      }
      thisLayer.style.backgroundImage = thisLayer.style.borderImage;
      sortedLayers = [borderLayer].concat(sortedLayers);
    } else {
      borderLayer = new GKGroup({
        parent: thisLayer,
      });
      borderLayer.type = "Group";
      borderLayer.name = "GroupBorder";
      borderLayer.style = {
        top: 0,
        left: 0,
        backgroundColor: thisLayer.style.backgroundColor || "#ffffff",
        width: thisLayer.style.width,
        height: thisLayer.style.height,
        borderRadius: thisLayer.style.borderRadius,
        opacity: thisLayer.style.opacity,
      };

      let shapePathLayer = new GKShape({
        parent: borderLayer,
      });
      shapePathLayer.type = "ShapePath";
      shapePathLayer.name = "ShapePathBorder";
      shapePathLayer.id = NSUUID.UUID().UUIDString();
      shapePathLayer.style = {
        top: borderLayer.style.borderWidth || 1,
        left: borderLayer.style.borderWidth || 1,
        backgroundColor: borderLayer.style.backgroundColor || "#ffffff",
        width:
          borderLayer.style.width - 2 * (borderLayer.style.borderWidth || 1),
        height:
          borderLayer.style.height - 2 * (borderLayer.style.borderWidth || 1),
        borderRadius: borderLayer.style.borderRadius,
      };
      let color = TinyColor(shapePathLayer.style.backgroundColor);
      if (color.isValid()) {
        shapePathLayer.style.backgroundColor = color.setAlpha(1).toHexString();
      }
      borderLayer.style.backgroundImage = thisLayer.style.borderImage;
      borderLayer.layers = [shapePathLayer];
      sortedLayers = [borderLayer].concat(sortedLayers);
    }
    delete thisLayer.style.borderImage;
    delete thisLayer.style.borderWidth;
    delete thisLayer.style.borderColor;
    delete thisLayer.style.borderStyle;
    delete thisLayer.style.opacity;
  }

  if (thisLayer.name && thisLayer.name.indexOf("__GAIA_COLUMN__") == 0) {
    thisLayer.style.flexDirection = "column";
    sortSketchRowLayers(sortedLayers);
    sortSketchColumnLayers(sortedLayers);
  } else if (thisLayer.name && thisLayer.name.indexOf("__GAIA_ROW__") == 0) {
    thisLayer.style.flexDirection = "row";
    sortSketchColumnLayers(sortedLayers);
    sortSketchRowLayers(sortedLayers);
  } else {
    if (!canRow(sortedLayers)) {
      if (canColumn(sortedLayers)) {
        thisLayer.style.flexDirection = "column";
      }
    } else {
      sortSketchColumnLayers(sortedLayers);
      sortSketchRowLayers(sortedLayers);
      thisLayer.style.flexDirection = "row";
    }
  }

  if (thisLayer.style.flexDirection == "column") {
    let top = 0;
    for (let i = 0; i < sortedLayers.length; i++) {
      let ll = sortedLayers[i];
      ll.style.marginTop = ll.style.top - top;
      ll.style.marginLeft = ll.style.left;
      top = ll.style.top + ll.style.height;
      delete ll.style.top;
      delete ll.style.left;
      if (Number(ll.style.marginTop) == 0) {
        delete ll.style.marginTop;
      }
      if (Number(ll.style.marginLeft) == 0) {
        delete ll.style.marginLeft;
      }
    }
  } else if (
    thisLayer.style.flexDirection == "row" ||
    sortedLayers.length == 1
  ) {
    thisLayer.style.flexDirection = "row";
    if (
      sortedLayers.length == 2 &&
      sortedLayers[0].style.left == 0 &&
      thisLayer.style.width -
        sortedLayers[1].style.left -
        sortedLayers[1].style.width ==
        0
    ) {
      let width1 = sortedLayers[0].style.width;
      let width2 = sortedLayers[1].style.width;
      let flag = false;
      if (
        width1 > width2 &&
        isAllText(sortedLayers[0]) &&
        isEmptyLayer(sortedLayers[0])
      ) {
        sortedLayers[0].style.flexGrow = 1;
        delete sortedLayers[1].style.flexGrow;
        delete sortedLayers[0].style.width;
        flag = true;
      } else if (
        width1 < width2 &&
        isAllText(sortedLayers[1]) &&
        isEmptyLayer(sortedLayers[1])
      ) {
        sortedLayers[1].style.flexGrow = 1;
        delete sortedLayers[0].style.flexGrow;
        delete sortedLayers[1].style.width;
        flag = true;
      }
      if (flag) {
        for (let i = 0; i < sortedLayers.length; i++) {
          let ll = sortedLayers[i];
          ll.style.marginTop = ll.style.top;
          delete ll.style.top;
          delete ll.style.left;
          if (Number(ll.style.marginTop) == 0) {
            delete ll.style.marginTop;
          }
        }
      }
    } else {
      let left = 0;
      for (let i = 0; i < sortedLayers.length; i++) {
        let ll = sortedLayers[i];
        ll.style.marginLeft = ll.style.left - left;
        ll.style.marginTop = ll.style.top;
        left = ll.style.left + ll.style.width;
        delete ll.style.top;
        delete ll.style.left;
        if (Number(ll.style.marginTop) == 0) {
          delete ll.style.marginTop;
        }
        if (Number(ll.style.marginLeft) == 0) {
          delete ll.style.marginLeft;
        }
      }
    }
  } else {
    handleAbsoluteLayers(thisLayer, sortedLayers);
  }
  optimizeStyles(sortedLayers, thisLayer);
  return [...sortedLayers];
}

function optimizeStyles(layers, parent) {
  if (layers) {
    for (let index = 0; index < layers.length; index++) {
      const layer = layers[index];
      // console.log(`parent = ${parent.name}, layer = ${layer.name}`);
      optimizeSingleStyle(layer, index, layers, parent);
    }
  }
}

function optimizeSingleStyle(layer, index, sortedLayers, parent) {
  if (layer == undefined || parent == undefined) {
    return;
  }
  if (
    layer.type == "Text" &&
    layer.style &&
    (layer.numberOfLines == undefined || layer.numberOfLines == 1)
  ) {
    if (
      parent.style.flexDirection == "column" &&
      layer.style.left == undefined &&
      layer.style.top == undefined
    ) {
      if (layer.style.textAlign == "center") {
        delete layer.style.marginLeft;
        delete layer.style.marginRight;
      }
      delete layer.style.width;
    } else if (
      parent.style.flexDirection == "row" &&
      layer.style.left == undefined &&
      layer.style.top == undefined &&
      sortedLayers.length == 1
    ) {
      layer.style.flexGrow = 1;
      delete layer.style.width;
      if (layer.style.textAlign == "center") {
        delete layer.style.marginLeft;
        delete layer.style.marginRight;
      }
    }
  }
}

function hasIntersect2(r1, r2) {
  return !(
    r2.left + 1 >= r1.left + r1.width ||
    r2.left + r2.width <= r1.left + 1 ||
    r2.top + 1 >= r1.top + r1.height ||
    r2.top + r2.height <= r1.top + 1
  );
}

function handleAbsoluteLayers(thisLayer, layers) {
  // console.log("------------------------------------");
  // 从子节点中找到最大的集合满足flexbox的，剩下的用absolute
  let maxAbsoluteIdMaps = [];
  for (let i = 0; i < layers.length; i++) {
    let layer1 = layers[i];
    let intersects = [];
    for (let j = 0; j < layers.length; j++) {
      let layer2 = layers[j];
      // console.log(
      //   `start compare layer1 = ${layer1.name}, frame=${JSON.stringify(
      //     layer1.style
      //   )}, layer2 = ${layer2.name}, frame=${JSON.stringify(
      //     layer2.style
      //   )} ===========`
      // );
      if (
        layer1.id != layer2.id &&
        (hasIntersect2(layer1.style, layer2.style) ||
          isContainLayer2(layer1.style, layer2.style))
      ) {
        // console.log(
        //   `layer1 = ${layer1.name}, frame=${JSON.stringify(
        //     layer1.style
        //   )}, layer2 = ${layer2.name}, frame=${JSON.stringify(
        //     layer2.style
        //   )} has intersect`
        // );
        intersects.push(layer2.id);
      }
    }
    if (intersects.length > 0) {
      maxAbsoluteIdMaps.push({
        id: layer1.id,
        number: intersects.length,
      });
    }
  }
  if (maxAbsoluteIdMaps.length <= 0) {
    // console.log("maxAbsoluteIdMaps.length <= 0");
    return;
  } else {
    // let allSame = true;
    // let first = maxAbsoluteIdMaps[0];
    // for (let index = 1; index < maxAbsoluteIdMaps.length; index++) {
    //   const element = maxAbsoluteIdMaps[index];
    //   if (first.number != element.number) {
    //     allSame = false;
    //     break;
    //   }
    // }
    // if (allSame) {
    //   console.log("maxAbsoluteIdMaps is allSame ", maxAbsoluteIdMaps);
    //   return;
    // }
  }
  stable.inplace(maxAbsoluteIdMaps, (a, b) => {
    if (a.number < b.number) {
      return 1;
    } else if (a.number > b.number) {
      return -1;
    }
    return 0;
  });

  let newLayers = [];
  let targetLayer;
  let flexDirection;
  for (let j = 0; j < maxAbsoluteIdMaps.length; j++) {
    newLayers = [];
    let subIds = maxAbsoluteIdMaps.slice(0, j + 1);
    for (let i = 0; i < layers.length; i++) {
      if (!isContains(subIds, layers[i].id)) {
        newLayers.push(layers[i]);
      }
    }
    if (newLayers.length <= 1) {
      newLayers = [];
      continue;
    }
    if (canColumn(newLayers)) {
      if (j == 0 && newLayers[0].style.left == 0) {
        targetLayer = thisLayer;
      }
      flexDirection = "column";
      break;
    } else if (canRow(newLayers)) {
      if (j == 0 && newLayers[0].style.top == 0) {
        targetLayer = thisLayer;
      }
      flexDirection = "row";
      break;
    } else {
      // console.log(`can not row or column = ${subIds}`);
    }
  }

  if (
    newLayers.length > 0 &&
    (flexDirection == "column" || flexDirection == "row")
  ) {
    if (targetLayer == undefined) {
      targetLayer = new GKGroup({
        parent: thisLayer,
      });
      targetLayer.id = NSUUID.UUID().UUIDString();
      targetLayer.type = "Group";
      targetLayer.name = "Group";
      let top = 10000000,
        left = 10000000,
        width = 0,
        height = 0;
      if (flexDirection == "row") {
        for (let i = 0; i < newLayers.length; i++) {
          top = Math.min(newLayers[i].style.top, top);
        }
        left = newLayers[0].style.left;
        for (let i = 0; i < newLayers.length; i++) {
          height = Math.max(
            newLayers[i].style.height + newLayers[i].style.top - top,
            height
          );
        }
        width =
          newLayers[newLayers.length - 1].style.left +
          newLayers[newLayers.length - 1].style.width -
          left;
        for (let i = 0; i < newLayers.length; i++) {
          newLayers[i].style.top = newLayers[i].style.top - top;
          newLayers[i].style.left = newLayers[i].style.left - left;
        }
      } else if (flexDirection == "column") {
        top = newLayers[0].style.top;
        for (let i = 0; i < newLayers.length; i++) {
          left = Math.min(newLayers[i].style.left, left);
        }
        for (let i = 0; i < newLayers.length; i++) {
          width = Math.max(
            newLayers[i].style.width + newLayers[i].style.left - left,
            width
          );
        }
        height =
          newLayers[newLayers.length - 1].style.top +
          newLayers[newLayers.length - 1].style.height -
          top;
        for (let i = 0; i < newLayers.length; i++) {
          newLayers[i].style.top = newLayers[i].style.top - top;
          newLayers[i].style.left = newLayers[i].style.left - left;
        }
      }
      targetLayer.style = {
        top,
        left,
        width,
        height,
      };
      targetLayer.style.flexDirection = flexDirection;
      targetLayer.layers = [...newLayers];

      for (let j = 0; j < newLayers.length; j++) {
        for (let i = 0; i < layers.length; i++) {
          if (layers[i].id == newLayers[j].id) {
            layers.splice(i, 1);
            break;
          }
        }
      }
      layers.push(targetLayer);
    } else {
      targetLayer.style.flexDirection = flexDirection;
    }
  }

  if (targetLayer && newLayers.length > 0) {
    if (targetLayer.style.flexDirection == "column") {
      let top = 0;
      for (let i = 0; i < newLayers.length; i++) {
        let ll = newLayers[i];
        ll.style.marginTop = ll.style.top - top;
        ll.style.marginLeft = ll.style.left;
        top = ll.style.top + ll.style.height;
        delete ll.style.top;
        delete ll.style.left;
        delete ll.style.width;
        if (Number(ll.style.marginTop) == 0) {
          delete ll.style.marginTop;
        }
        if (Number(ll.style.marginLeft) == 0) {
          delete ll.style.marginLeft;
        }
      }
    } else if (targetLayer.style.flexDirection == "row") {
      let left = 0;
      for (let i = 0; i < newLayers.length; i++) {
        let ll = newLayers[i];
        ll.style.marginLeft = ll.style.left - left;
        ll.style.marginTop = ll.style.top;
        left = ll.style.left + ll.style.width;
        delete ll.style.top;
        delete ll.style.left;
        if (Number(ll.style.marginTop) == 0) {
          delete ll.style.marginTop;
        }
        if (Number(ll.style.marginLeft) == 0) {
          delete ll.style.marginLeft;
        }
      }
    }
  } else {
    if (canFlexboxFirst(thisLayer, layers)) {
      thisLayer.style.flexDirection = "row";
      let ll = layers[0];
      ll.style.marginLeft = ll.style.left;
      ll.style.marginTop = ll.style.top;
      delete ll.style.top;
      delete ll.style.left;
      if (Number(ll.style.marginTop) == 0) {
        delete ll.style.marginTop;
      }
      if (Number(ll.style.marginLeft) == 0) {
        delete ll.style.marginLeft;
      }
    }
  }

  if (targetLayer != thisLayer) {
    optimizeStyles(newLayers, targetLayer);
  }
}

function canFlexboxFirst(parent, layers) {
  let flag = true;
  if (layers && layers.length > 0) {
    if (
      layers[0].style.left == undefined &&
      layers[0].style.top == undefined &&
      layers[0].style.bottom == undefined &&
      layers[0].style.right == undefined
    ) {
      flag = false;
    }
    if (flag) {
      if (
        parent.style.width != layers[0].style.width &&
        parent.style.height != layers[0].style.height
      ) {
        flag = false;
      }
    }
    if (flag) {
      for (let i = 1; i < layers.length; i++) {
        if (
          layers[i].style.left == undefined &&
          layers[i].style.top == undefined &&
          layers[i].style.bottom == undefined &&
          layers[i].style.right == undefined
        ) {
          flag = false;
          break;
        }
      }
    }
  } else {
    flag = false;
  }
  return flag;
}

function canRow(layers) {
  sortSketchRowLayers(layers);
  let canRow = true;
  for (let i = 0; i < layers.length - 1; i++) {
    if (
      layers[i].style.left + layers[i].style.width >
      layers[i + 1].style.left
    ) {
      canRow = false;
      break;
    }
  }
  return canRow;
}

function canColumn(layers) {
  let canColumn = true;
  sortSketchColumnLayers(layers);
  for (let i = 0; i < layers.length - 1; i++) {
    if (
      layers[i].style.top + layers[i].style.height >
      layers[i + 1].style.top
    ) {
      canColumn = false;
      break;
    }
  }
  return canColumn;
}

function sortSketchColumnLayers(layers) {
  layers &&
    layers.sort((a, b) => {
      if (!hasIntersect2(a.style, b.style)) {
        if (a.style.top < b.style.top) {
          return -1;
        }
        if (a.style.top > b.style.top) {
          return 1;
        }
      }
      return 0;
    });
}

function sortSketchRowLayers(layers) {
  layers &&
    layers.sort((a, b) => {
      if (!hasIntersect2(a.style, b.style)) {
        if (a.style.left < b.style.left) {
          return -1;
        }
        if (a.style.left > b.style.left) {
          return 1;
        }
      }
      return 0;
    });
}

export function isContainLayer2(frameA, frameB) {
  // console.log(`frameA`, JSON.stringify(frameA) );
  // console.log(`frameB`, JSON.stringify(frameB) );
  if (frameA && frameB) {
    if (
      frameA.left <= frameB.left &&
      frameA.top <= frameB.top &&
      frameA.left + frameA.width + 1 >= frameB.left + frameB.width &&
      frameA.top + frameA.height + 1 >= frameB.top + frameB.height
    ) {
      return true;
    }
  }
  return false;
}

function isContains(array, target) {
  for (let i in array) {
    if (array[i].id == target) return true;
  }
  return false;
}

export function revFindRealGroup(layer, style) {
  if (
    layer.layers &&
    layer.layers.length == 1 &&
    sketch.fromNative(layer.layers[0]).type == "Group"
  ) {
    return revFindRealGroup(layer.layers[0], {
      left: style.left + layer.layers[0].frame.x,
      top: style.top + layer.layers[0].frame.y,
    });
  }
  return [layer, style];
}

export function getMaxHeightFromAttributes(attributes) {
  let maxHeight = 0;
  attributes.forEach((element) => {
    if (element.style.fontSize > maxHeight) {
      maxHeight = element.style.fontSize;
    }
  });
  return maxHeight;
}

export function isAllText(layer) {
  if (layer.type == "Text") {
    return true;
  }
  for (let index = 0; layer.layers && index < layer.layers.length; index++) {
    const element = layer.layers[index];
    if (element.type == "Group") {
      if (!isAllText(element)) {
        return false;
      }
    } else if (element.type != "Text") {
      return false;
    }
  }
  return true;
}

export function isEmptyLayer(layer) {
  if (
    layer.style.borderStyle != undefined ||
    layer.style.backgroundColor != undefined
  ) {
    return false;
  }
  return true;
}

function onlyBorderColor(layer) {
  let flag = true;
  let styles = Object.keys(layer.style);
  for (let index = 0; index < styles.length; index++) {
    const styleKey = styles[index];
    if (
      styleKey == "backgroundImage" ||
      styleKey == "backgroundColor" ||
      styleKey == "borderImage" ||
      styleKey == "color"
    ) {
      flag = false;
      break;
    }
  }
  if (flag && layer.style["borderColor"] != undefined) {
    let borderColor = TinyColor(layer.style["borderColor"]);
    if (borderColor.isValid()) {
      if (layer.style.opacity != undefined && layer.style.opacity != 1) {
        borderColor.setAlpha(layer.style.opacity);
      }
      layer.style.borderColor = borderColor.toString();
      delete layer.style.opacity;
    }
  }
  return flag;
}

export function treatAsImageLayer(layer) {
  let isImage = false;

  if (layer.type == "Image" || layer.type == "Shape") {
    isImage = true;
  } else if (layer.type == "ShapePath") {
    if (layer.shapeType == sketch.ShapePath.ShapeType.Rectangle) {
      isImage = true;
      if (layer.style.fills == undefined || layer.style.fills[0] == undefined) {
        isImage = false;
      } else {
        let fistFill;
        for (let j = 0; j < layer.style.fills.length; j++) {
          if (layer.style.fills[j].enabled) {
            fistFill = layer.style.fills[j];
            break;
          }
        }
        if (fistFill == undefined) {
          isImage = false;
        } else if (
          fistFill.fillType == sketch.Style.FillType.Color ||
          (fistFill.fillType == sketch.Style.FillType.Gradient &&
            fistFill.gradient.gradientType == sketch.Style.GradientType.Linear)
        ) {
          isImage = false;
        } else {
          isImage = true;
        }
      }
    } else {
      isImage = true;
    }
  } else if (layer.type == "Group") {
    let allImage = true;
    for (let i = 0; i < layer.layers.length; i++) {
      let subIsImage = treatAsImageLayer(layer.layers[i]);
      if (!subIsImage) {
        allImage = false;
        break;
      }
    }
    isImage = allImage;
  }

  // console.log(
  //   `layer = ${layer.name} layer.type=${layer.type} can treatAsImageLayer = ${isImage}`
  // );
  return isImage;
}
