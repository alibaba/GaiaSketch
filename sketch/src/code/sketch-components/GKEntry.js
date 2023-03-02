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

import GKGroup, { isAllText } from "./GKGroup";
import GKImage from "./GKImage";
import GKText from "./GKText";
import GKShape from "./GKShape";
import * as UI from "sketch/ui";
import { mergeStyles, shouldMergeToRoot, isNumberEqual } from "../code-helper";
import * as stable from "stable";
import { logger } from "../../logger";

export default class GKEntry {
    // layers: any;
    // name: any;
    // id: any;
    // classMaps: any;
    constructor(propLayer, backgroundColor) {
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

        // logger.log(`layer.name=${layer.name}, layer.layers.length = ${layer.layers.length}`);
        revRemoveGroup(layer);
        optimizeLayers(layer);
        delete layer.style.top;
        delete layer.style.left;
        if (backgroundColor != undefined) {
            layer.style.backgroundColor = backgroundColor;
        }
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
        layer.layers = [].concat(remindLayers).concat(shouldMergeLayer.layers || []);
        revRemoveGroup(layer);
    } else {
        for (let index = 0; layer.layers && index < layer.layers.length; index++) {
            const element = layer.layers[index];
            revRemoveGroup(element);
        }
    }
}

export function optimizeLayers(thisLayer) {
    let sortedLayers = thisLayer?.layers;
    if (sortedLayers) {
        for (let i = 0; i < sortedLayers.length; i++) {
            let subLayer = sortedLayers[i];
            optimizeLayers(subLayer);
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
                top = ll.style.top + ll.style.height;
                if (
                    (ll.type === "Image" || ll.type === "ShapePath") &&
                    isNumberEqual(thisLayer.style.width - ll.style.left - ll.style.width, ll.style.left)
                ) {
                    ll.style.alignSelf = "center";
                } else if (isNumberEqual(ll.style.width, thisLayer.style.width)) {
                    delete ll.style.width;
                } else if (ll.type === "Text" || isAllText(ll)) {
                    if (ll.type === "Text") {
                        let marginLeft = ll.style.left;
                        let marginRight = thisLayer.style.width - ll.style.left - ll.style.width;
                        if ((marginLeft !== 0 || marginRight !== 0) && isNumberEqual(marginLeft, marginRight)) {
                            ll.style.textAlign = "center";
                        } else {
                            ll.style.marginLeft = ll.style.left;
                            ll.style.marginRight = thisLayer.style.width - ll.style.left - ll.style.width;
                        }
                    } else {
                        ll.style.marginLeft = ll.style.left;
                        ll.style.marginRight = thisLayer.style.width - ll.style.left - ll.style.width;
                        if (
                            isAllText(ll) &&
                            (ll.style.marginLeft !== 0 || ll.style.marginRight !== 0) &&
                            isNumberEqual(ll.style.marginLeft, ll.style.marginRight)
                        ) {
                            delete ll.style.marginLeft;
                            delete ll.style.marginRight;
                            ll.style.alignSelf = "center";
                        }
                    }
                    delete ll.style.width;
                } else {
                    ll.style.marginLeft = ll.style.left;
                    ll.style.marginRight = thisLayer.style.width - ll.style.left - ll.style.width;
                    delete ll.style.width;
                }
                delete ll.style.top;
                delete ll.style.left;
            }
        } else if (thisLayer.style.flexDirection == "row" || sortedLayers.length == 1) {
            thisLayer.style.flexDirection = "row";
            if (sortedLayers.length == 1) {
                if (sortedLayers[0].style.width == thisLayer.style.width) {
                    delete sortedLayers[0].style.width;
                } else {
                    sortedLayers[0].style.marginLeft = sortedLayers[0].style.left;
                    sortedLayers[0].style.marginRight =
                        thisLayer.style.width - sortedLayers[0].style.left - sortedLayers[0].style.width;
                    delete sortedLayers[0].style.width;
                }
                if (sortedLayers[0].type === "Text") {
                    sortedLayers[0].style.fitContent = true;
                } else {
                    sortedLayers[0].style.flexGrow = 1;
                }
                sortedLayers[0].style.marginTop = sortedLayers[0].style.top;
                delete sortedLayers[0].style.top;
                delete sortedLayers[0].style.left;
            } else {
                let textLayers = [];
                let textGroups = [];
                for (let i = 0; i < sortedLayers.length; i++) {
                    if (sortedLayers[i].type === "Text") {
                        textLayers.push(i);
                    } else if (isAllText(sortedLayers[i])) {
                        textGroups.push(i);
                    }
                }
                let left = 0;
                for (let i = 0; i < sortedLayers.length; i++) {
                    let ll = sortedLayers[i];
                    ll.style.marginLeft = ll.style.left - left;
                    ll.style.marginTop = ll.style.top;
                    left = ll.style.left + ll.style.width;
                    if (textLayers.includes(i)) {
                        if (textLayers.length === 1) {
                            ll.style.flexGrow = 1;
                        } else if (textLayers.length > 1) {
                            ll.style.fitContent = true;
                        }
                        delete ll.style.width;
                    } else if (textGroups.includes(i)) {
                        if (i === 0 || i === sortedLayers.length - 1 || existAnotherTextLayer(ll, i)) {
                            ll.style.flexGrow = 1;
                        }
                        delete ll.style.width;
                    }

                    delete ll.style.top;
                    delete ll.style.left;
                }
                if (left < thisLayer.style.width && sortedLayers.length > 0) {
                    sortedLayers[sortedLayers.length - 1].style.marginRight = thisLayer.style.width - left;
                }
            }
        } else {
            handleAbsoluteLayers(thisLayer, sortedLayers);
        }
    }
}

function existAnotherTextLayer(layer, index) {
    for (let i = 0; i < layer?.layers?.length; i++) {
        if (i == index) {
            continue;
        }
        if (layer.layers[i].type == "Text" || isAllText(layer.layers[i])) {
            return true;
        }
    }
    return false;
}

function handleAbsoluteLayers(thisLayer, layers) {
    // logger.log(`----------------handleAbsoluteLayers ${thisLayer.name} start--------------------`);
    // printCanGroupLayers(layers);
    // 从子节点中找到最大的集合满足flexbox的，剩下的用absolute
    let maxAbsoluteIdMaps = [];
    for (let i = 0; i < layers.length; i++) {
        let layer1 = layers[i];
        let intersects = [];
        for (let j = 0; j < layers.length; j++) {
            let layer2 = layers[j];
            // logger.log(
            //   `start compare layer1 = ${layer1.name}, frame=${JSON.stringify(
            //     layer1.style
            //   )}, layer2 = ${layer2.name}, frame=${JSON.stringify(
            //     layer2.style
            //   )} ===========`
            // );
            if (
                layer1.id != layer2.id &&
                (hasIntersect2(layer1.style, layer2.style) || isContainLayer2(layer1.style, layer2.style))
            ) {
                // logger.log(
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
                name: layer1.name,
                number: intersects.length,
            });
        }
    }
    if (maxAbsoluteIdMaps.length <= 0) {
        // logger.log("maxAbsoluteIdMaps.length <= 0");
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
        //   logger.log("maxAbsoluteIdMaps is allSame ", maxAbsoluteIdMaps);
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
            // logger.log(`can not row or column = ${subIds}`);
        }
    }

    if (newLayers.length > 0 && (flexDirection == "column" || flexDirection == "row")) {
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
                    height = Math.max(newLayers[i].style.height + newLayers[i].style.top - top, height);
                }
                width = newLayers[newLayers.length - 1].style.left + newLayers[newLayers.length - 1].style.width - left;
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
                    width = Math.max(newLayers[i].style.width + newLayers[i].style.left - left, width);
                }
                height = newLayers[newLayers.length - 1].style.top + newLayers[newLayers.length - 1].style.height - top;
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

    logger.log(`----------------handleAbsoluteLayers ${thisLayer.name} end--------------------`);
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
            if (parent.style.width != layers[0].style.width && parent.style.height != layers[0].style.height) {
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
        if (layers[i].style.left + layers[i].style.width - 2 > layers[i + 1].style.left) {
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
        if (layers[i].style.top + layers[i].style.height - 2 > layers[i + 1].style.top) {
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

function hasIntersect2(r1, r2) {
    return !(
        r2.left + 2 >= r1.left + r1.width ||
        r2.left + r2.width <= r1.left + 2 ||
        r2.top + 2 >= r1.top + r1.height ||
        r2.top + r2.height <= r1.top + 2
    );
}

export function isContainLayer2(frameA, frameB) {
    // logger.log(`frameA`, JSON.stringify(frameA) );
    // logger.log(`frameB`, JSON.stringify(frameB) );
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
