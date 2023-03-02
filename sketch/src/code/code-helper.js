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

import { isAllImages, isAllShapeOrImages, isAllShapes } from "../helper";
import * as os from "@skpm/os";
import * as path from "@skpm/path";
import * as fs from "@skpm/fs";
import * as Console from "@skpm/console";
import * as Settings from "sketch/settings";
import * as sketch from "sketch/dom";
import * as stable from "stable";
import * as TinyColor from "tinycolor2";
import {
    containRect,
    hasOtherIntersect,
    intersect,
    isColumn,
    isRectEqual,
    isRow,
    isTextColumn,
    isTextRow,
    unionRect,
} from "./rect";
import * as md5 from "blueimp-md5";
import { logger, printLayers } from "../logger";

export function revHandleMasks(layer) {
    if (layer && layer.layers) {
        for (let i = 0; i < layer.layers.length; i++) {
            const subLayer = layer.layers[i];
            // logger.log("\r\n\r\n");
            if (subLayer.name == "__IMAGE_MASK__") {
                continue;
            }
            if (subLayer.sketchObject.hasClippingMask()) {
                // logger.log(`------------ ${subLayer.name} hasClippingMask ......`);
                if (subLayer.hidden) {
                    subLayer.hidden = false;
                }
                let masks = [];
                for (let j = i + 1; j < layer.layers.length; j++) {
                    const maskedLayer = layer.layers[j];
                    // logger.log(`  check ${maskedLayer.name}`);
                    let parentCoordinate = maskedLayer.frame;
                    if (layer.parent != undefined) {
                        parentCoordinate = maskedLayer.frame.changeBasis({
                            from: layer,
                            to: layer.parent,
                        });
                    }
                    // logger.log(
                    //     `  ${maskedLayer.name} hasClippingMask = ${maskedLayer.sketchObject.hasClippingMask()}`
                    // );
                    // logger.log(
                    //     `  ${
                    //         maskedLayer.name
                    //     } closestClippingLayer = ${maskedLayer.sketchObject.closestClippingLayer()}`
                    // );
                    if (
                        (maskedLayer.sketchObject.hasClippingMask() ||
                            maskedLayer.sketchObject.closestClippingLayer() != null) &&
                        isAllShapeOrImages(maskedLayer)
                    ) {
                        masks.push(maskedLayer);
                        // logger.log(`     push ${maskedLayer.name}`);
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
                    // logger.log(maskString + "mask group !!!!!!!!!!!!");
                    newGroup.adjustToFit();
                    revHandleMasks(layer);
                    break;
                } else {
                    revHandleMasks(subLayer);
                }
            } else {
                revHandleMasks(subLayer);
            }
        }
    }
}

export function isNumberEqual(num1, num2) {
    return Math.abs(num1 - num2) <= 2;
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

export function revRemoveAllHiddenLayersAndSlices(layer, removeHiddenLayers) {
    if (layer == undefined) {
        return;
    }
    if ((layer.hidden || layer.type == "Slice") && !layer.sketchObject.hasClippingMask()) {
        removeHiddenLayers.push(layer);
    }
    layer.layers &&
        layer.layers.forEach((sublayer) => {
            revRemoveAllHiddenLayersAndSlices(sublayer, removeHiddenLayers);
        });
}

function findShadowLayers(layer, shadowMap) {
    if (layer.type === "Shape" || layer.type === "ShapePath") {
        let shadows = layer.style.shadows;
        for (let i = 0; i < shadows.length; i++) {
            let shadow = shadows[i];
            if (shadow.enabled) {
                let nativeRect = layer.sketchObject.absoluteInfluenceRect();
                let influenceRect = new sketch.Rectangle(
                    nativeRect.origin.x,
                    nativeRect.origin.y,
                    nativeRect.size.width,
                    nativeRect.size.height
                );
                shadowMap[layer.id] = influenceRect;
            }
        }
    }
    for (let i = 0; i < layer?.layers?.length; i++) {
        findShadowLayers(layer.layers[i], shadowMap);
    }
}

export function adjustToFitParent(layer) {
    if (layer === undefined || layer.type === "Artboard") {
        return;
    }
    if (layer.adjustToFit) {
        layer.adjustToFit();
    }
    adjustToFitParent(layer.parent);
}

export function insertShadowInfluenceShapeIfNeed(rootLayer) {
    let shadowMap = {};
    findShadowLayers(rootLayer, shadowMap);
    if (Object.keys(shadowMap).length > 0) {
        let largestRect;
        let offset, size;
        for (const layerId in shadowMap) {
            let influenceRect = shadowMap[layerId];
            if (largestRect === undefined) {
                largestRect = influenceRect;
            } else {
                largestRect = {
                    x: Math.min(largestRect.x, influenceRect.x),
                    y: Math.min(largestRect.y, influenceRect.y),
                    width:
                        Math.max(largestRect.x + largestRect.width, influenceRect.x + influenceRect.width) -
                        Math.min(largestRect.x, influenceRect.x),
                    height:
                        Math.max(largestRect.y + largestRect.height, influenceRect.y + influenceRect.height) -
                        Math.min(largestRect.y, influenceRect.y),
                };
            }
        }
        let changedFrame = rootLayer.frame.changeBasis({
            from: rootLayer.parent,
        });
        offset = {
            x: largestRect.x - changedFrame.x,
            y: largestRect.y - changedFrame.y,
        };
        size = {
            width:
                Math.max(largestRect.x + largestRect.width, changedFrame.x + changedFrame.width) -
                Math.min(largestRect.x, changedFrame.x),
            height:
                Math.max(largestRect.y + largestRect.height, changedFrame.y + changedFrame.height) -
                Math.min(largestRect.y, changedFrame.y),
        };

        if (
            offset.x < 0 ||
            offset.y < 0 ||
            size.width > rootLayer.frame.width ||
            size.height > rootLayer.frame.height
        ) {
            if (
                rootLayer.layers[0].type === "ShapePath" &&
                rootLayer.layers[0].shapeType === sketch.ShapePath.ShapeType.Rectangle
            ) {
                rootLayer.layers[0].frame = {
                    x: Math.min(0, offset.x),
                    y: Math.min(0, offset.y),
                    width: size.width,
                    height: size.height,
                };
                rootLayer.adjustToFit && rootLayer.adjustToFit();
            } else {
                let newShape = new sketch.ShapePath({
                    name: "__GAIA_SHADOW__",
                    shapeType: sketch.ShapePath.ShapeType.Rectangle,
                });
                newShape.parent = rootLayer;
                newShape.index = 0;
                newShape.frame = {
                    x: Math.min(0, offset.x),
                    y: Math.min(0, offset.y),
                    width: size.width,
                    height: size.height,
                };
            }
            adjustToFitParent(rootLayer);
        }
    }
}

export function revMergeShapesToImage(rootLayerId, layer) {
    if (layer?.type !== "Group") {
        return;
    }
    if (layer?.exportFormats?.length > 0) {
        insertShadowInfluenceShapeIfNeed(layer);
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
            if (layer.id === rootLayerId) {
                return imageLayer;
            }
        }
    } else {
        if (layer?.name?.length > 0 && layer.name.indexOf("pn=true") !== -1) {
            layer.remove();
        } else if (
            layer?.name?.indexOf("__IMAGE_") === 0 ||
            layer?.name?.indexOf("background=true") !== -1 ||
            isAllShapes(layer)
        ) {
            if (layer.type === "Group" && layer.name !== "__IMAGE_MASK__") {
                let shape = new sketch.ShapePath({
                    shapeType: sketch.ShapePath.ShapeType.Rectangle,
                    style: {
                        borders: [{ enabled: false }],
                    },
                    name: "__IMAGE_MASK_SHAPEPATH__",
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
            insertShadowInfluenceShapeIfNeed(layer);
            let sliceLayer = new sketch.Slice({
                name: "__IMAGE_SLICE__",
            });
            sliceLayer.frame = { x: 0, y: 0, width: layer.frame.width, height: layer.frame.height };
            sliceLayer.parent = layer;
            sliceLayer.index = 0;
            sketch.export(sliceLayer, {
                "use-id-for-name": true,
                formats: "png",
                scales: "2",
                output: os.tmpdir(),
                "group-contents-only": true,
                overwriting: true,
            });
            let pngPath = path.join(os.tmpdir(), `${sliceLayer.id}@2x.png`);
            sliceLayer.remove();
            if (fs.existsSync(pngPath)) {
                if (
                    layer.layers.length > 1 &&
                    layer.layers[0].type === "ShapePath" &&
                    layer.layers[0].name !== "__IMAGE_MASK_SHAPEPATH__" &&
                    (layer.layers[0].shapeType === sketch.ShapePath.ShapeType.Rectangle ||
                        (layer.layers[0].shapeType === sketch.ShapePath.ShapeType.Oval &&
                            layer.layers[0].frame.width === layer.layers[0].frame.height))
                ) {
                    let needRemoves = [];
                    for (let index = 1; index < layer.layers.length; index++) {
                        const tmpLayer = layer.layers[index];
                        needRemoves.push(tmpLayer);
                    }
                    for (let index = 0; index < needRemoves.length; index++) {
                        const tmpLayer = needRemoves[index];
                        tmpLayer.remove();
                    }
                    layer.name = "__GAIA_GROUP__";
                    let imageLayer = new sketch.Image({
                        name: layer.name,
                        image: pngPath,
                        frame: layer.frame,
                    });
                    imageLayer.parent = layer;
                    layer.layers[0].sketchObject.hasClippingMask = false;
                    fs.unlinkSync(pngPath);
                    if (layer.id === rootLayerId) {
                        return imageLayer;
                    }
                } else {
                    let imageLayer = new sketch.Image({
                        name: layer.name,
                        image: pngPath,
                        frame: layer.frame,
                    });
                    let originalIndex = layer.index;
                    imageLayer.parent = layer.parent;
                    layer.remove();
                    imageLayer.index = originalIndex;
                    fs.unlinkSync(pngPath);
                    if (layer.id === rootLayerId) {
                        return imageLayer;
                    }
                }
            }
        } else {
            for (let index = 0; layer.layers && index < layer.layers.length; index++) {
                const sublayer = layer.layers[index];
                if (sublayer.type === "Group") {
                    revMergeShapesToImage(rootLayerId, sublayer);
                }
            }
        }
    }
}

export function revUnGroup(rootLayerId, layer) {
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
            needsRemoves[needsRemoves.length - 1].sketchObject.closestClippingLayer() != undefined
        ) {
            shouldMoveOut = false;
        }
        if (!shouldMoveOut && parent.layers.length == 1) {
            shouldMoveOut = true;
        }

        if (shouldMoveOut) {
            layer.sketchObject.ungroup();
            if (parent.id !== rootLayerId) {
                for (let i = 0; i < parent?.layers?.length; i++) {
                    revUnGroup(rootLayerId, parent.layers[i]);
                }
            }
        } else {
            layer.name = "__GROUP_IF_NEED__";
            for (let i = 0; i < layer?.layers?.length; i++) {
                revUnGroup(rootLayerId, layer.layers[i]);
            }
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
            if (layer.style.opacity == 0 || layer.style.hidden) {
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

export function reGroupCanImageGroups(layer) {
    if (
        layer &&
        (layer.type === "Group" || layer.type === "Artboard") &&
        layer.name !== "__IMAGE_CAN_GROUP_SHAPES__" &&
        layer.layers.length > 0
    ) {
        let canGroupShapesArray = [];
        for (let i = 0; i < layer.layers.length; i++) {
            if (layer.layers[i].type === "Shape") {
                canGroupShapesArray.push(layer.layers[i]);
            } else {
                if (canGroupShapesArray.length > 1) {
                    break;
                }
            }
        }

        if (canGroupShapesArray.length > 1) {
            let newGroup = new sketch.Group({
                name: "__IMAGE_CAN_GROUP_SHAPES__",
                layers: [],
            });
            let index = canGroupShapesArray[0].index;
            for (let i = 0; i < canGroupShapesArray.length; i++) {
                let subLayer = canGroupShapesArray[i];
                subLayer.parent = newGroup;
            }
            newGroup.parent = layer;
            newGroup.adjustToFit();
            newGroup.index = index;
            reGroupCanImageGroups(layer);
        } else {
            for (let i = 0; i < layer.layers.length; i++) {
                reGroupCanImageGroups(layer.layers[i]);
            }
        }
    }
}

export function groupCanContainLayers(layer, rootRect) {
    if (layer && (layer.type === "Group" || layer.type === "Artboard") && layer.layers.length > 0) {
        let canGroups = [];
        for (let i = layer.layers.length - 1; i >= 0; i--) {
            let layer1 = layer.layers[i];
            if (layer1.type == "ShapePath" && isRectEqual(layer1.frame, rootRect)) {
                continue;
            }
            for (let j = 0; j < layer.layers.length; j++) {
                let layer2 = layer.layers[j];
                if (layer1.id !== layer2.id) {
                    if (containRect(layer1.frame, layer2.frame)) {
                        canGroups.push(j);
                    } else if (layer2.type == "Text") {
                        if (containRect(layer1.frame, Object.assign(layer2.frame, { height: layer2.style.fontSize }))) {
                            canGroups.push(j);
                        }
                    }
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
            let subGroup = moveLayers(layer, "__AUTO_CONTAIN__", canGroups);
            if (subGroup) {
                groupCanContainLayers(subGroup, subGroup.frame);
            }
            groupCanContainLayers(layer, rootRect);
        } else {
            layer.layers.forEach((subLayer) => {
                if (subLayer.name != "__AUTO_CONTAIN__") {
                    groupCanContainLayers(subLayer, subLayer.frame);
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
    if (alreadyExistIndex != -1 && groupsLayers[alreadyExistIndex].name === name) {
        for (let k = 0; k < groupsLayers.length; k++) {
            if (k !== alreadyExistIndex) {
                groupsLayers[k].parent = groupsLayers[alreadyExistIndex];
                groupsLayers[k].frame = groupsLayers[k].frame.changeBasis({
                    from: layer,
                    to: groupsLayers[alreadyExistIndex],
                });
            }
        }
        groupsLayers[alreadyExistIndex].name = name;
        groupsLayers[alreadyExistIndex].adjustToFit();
    } else {
        let newGroup;
        if (groupsLayers[0].type == "ShapePath" && containMuliColors(groupsLayers[0].style.fills)) {
            let firstGroup, currentGroup;
            for (let index = 0; index < groupsLayers[0].style.fills.length; index++) {
                if (groupsLayers[0].style.fills[index].enabled) {
                    if (index == 0) {
                        firstGroup = new sketch.Group({
                            name,
                            layers: [],
                        });
                        firstGroup.parent = layer;
                        firstGroup.index = canGroups[0];
                        let tmpLayer = groupsLayers[0].duplicate();
                        tmpLayer.style.fills = [groupsLayers[0].style.fills[index]];
                        tmpLayer.parent = firstGroup;
                        currentGroup = firstGroup;
                    } else {
                        let tmpGroup = new sketch.Group({
                            name,
                            layers: [],
                        });
                        tmpGroup.parent = currentGroup;
                        let tmpLayer = groupsLayers[0].duplicate();
                        tmpLayer.style.fills = [groupsLayers[0].style.fills[index]];
                        tmpLayer.parent = tmpGroup;
                        currentGroup = tmpGroup;
                    }
                }
            }
            newGroup = new sketch.Group({
                name: "__GROUP_MULTI_COLORS__",
                layers: [],
            });
            newGroup.parent = currentGroup;
            for (let k = 1; k < groupsLayers.length; k++) {
                groupsLayers[k].parent = newGroup;
            }
            groupsLayers[0].remove();
            adjustToFit(layer, newGroup);
        } else {
            let containerGroup = new sketch.Group({
                name,
                layers: [],
            });
            containerGroup.parent = layer;
            containerGroup.index = groupsLayers[0].index;
            groupsLayers[0].parent = containerGroup;
            newGroup = new sketch.Group({
                name: "__GROUP_NORMAL__",
                layers: [],
            });
            newGroup.parent = containerGroup;
            for (let k = 1; k < groupsLayers.length; k++) {
                groupsLayers[k].parent = newGroup;
            }
            newGroup.adjustToFit();
            containerGroup.adjustToFit();
        }

        return newGroup;
    }
}

export function adjustToFit(root, layer) {
    if (root.id == layer.id) {
        return;
    }
    layer?.adjustToFit();
    if (layer.parent) {
        adjustToFit(root, layer.parent);
    }
}

export function containMuliColors(fills) {
    let count = 0;
    for (let index = 0; index < fills.length; index++) {
        const fill = fills[index];
        if (fill.enabled) {
            count++;
        }
        if (count > 1) {
            return true;
        }
    }
    return false;
}

export function generateCombinations(maxNum) {
    let result = [];
    if (maxNum === 3) {
        result = [[1], [2], [3]];
    } else if (maxNum === 4) {
        result = [[1], [2], [3], [4], [1, 2], [2, 3], [3, 4], [1, 3], [1, 4], [2, 4]];
    } else if (maxNum === 5) {
        result = [
            [1],
            [2],
            [3],
            [4],
            [5],
            [1, 2],
            [2, 3],
            [4, 5],
            [3, 4],
            [1, 3],
            [1, 4],
            [1, 5],
            [2, 4],
            [2, 5],
            [3, 5],
            [1, 2, 3],
            [1, 2, 4],
            [1, 2, 5],
            [2, 3, 4],
            [2, 3, 5],
            [3, 4, 5],
        ];
    } else if (maxNum >= 6) {
        result = [
            [1],
            [2],
            [3],
            [4],
            [5],
            [6],
            [1, 2],
            [2, 3],
            [4, 5],
            [3, 4],
            [4, 5],
            [5, 6],
            [1, 3],
            [1, 4],
            [1, 5],
            [1, 6],
            [2, 4],
            [2, 5],
            [2, 6],
            [3, 5],
            [3, 6],
            [4, 6],
            [1, 2, 3],
            [1, 2, 4],
            [1, 2, 5],
            [1, 2, 6],
            [2, 3, 4],
            [2, 3, 5],
            [2, 3, 6],
            [3, 4, 5],
            [3, 4, 6],
            [4, 5, 6],
        ];
    }
    return result;
}

export function groupCanGroupInIntersects(layer) {
    if (layer.type === "Group" && layer.layers && layer.layers.length > 0) {
        if (layer.name === "__AUTO_INTERSECT__") {
            let length = layer.layers.length;
            let shouldGroup = false;
            const combinations = generateCombinations(length);
            for (let i = 0; i < combinations.length; i++) {
                const exceptIndexs = combinations[i];
                let layers = [];
                for (let j = 0; j < layer.layers.length; j++) {
                    if (!exceptIndexs.includes(j + 1)) {
                        layers.push({
                            index: j,
                            type: layer.layers[j].type,
                            id: layer.layers[j].id,
                            name: layer.layers[j].name,
                            ...layer.layers[j].frame,
                        });
                    }
                }
                let hasIntersect = false;
                for (let k = 0; k < layers.length; k++) {
                    for (let l = 0; l < layers.length; l++) {
                        let layer1 = layers[k],
                            layer2 = layers[l];
                        if (layer1.id !== layer2.id && intersect(layer1, layer2)) {
                            hasIntersect = true;
                            break;
                        }
                    }
                    if (hasIntersect) {
                        break;
                    }
                }
                if (!hasIntersect) {
                    let newGroup = new sketch.Group({
                        name: "__AUTO_GROUP__",
                        layers: [],
                    });
                    newGroup.parent = layer;
                    let groupsLayers = [];
                    for (let k = 0; k < layers.length; k++) {
                        groupsLayers.push(layer.layers[layers[k].index]);
                    }
                    for (let k = 0; k < groupsLayers.length; k++) {
                        groupsLayers[k].parent = newGroup;
                    }
                    newGroup.adjustToFit();
                    shouldGroup = true;
                    break;
                }
            }
        }
        layer.layers.forEach((subLayer) => {
            groupCanGroupInIntersects(subLayer);
        });
    }
}

export function intersectGroups(layer) {
    if (layer && layer.type === "Group" && layer.layers) {
        let canGroups = [];
        for (let i = 0; i < layer.layers.length; i++) {
            let layer1 = layer.layers[i];
            // logger.log(`${layer1.name} ${JSON.stringify(layer1.frame)}`);
            for (let j = layer.layers.length - 1; j >= 0; j--) {
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
            let subGroup = moveLayers(layer, "__AUTO_INTERSECT__", canGroups);
            if (subGroup) {
                intersectGroups(subGroup);
            } else {
                intersectGroups(layer);
            }
        } else {
            layer.layers.forEach((subLayer) => {
                if (subLayer.name != "__AUTO_INTERSECT__" && subLayer.name != "__AUTO_CONTAIN__") {
                    intersectGroups(subLayer);
                }
            });
        }
    }
}

export function groupColumnRow(layer, direction, flagMap) {
    if (
        layer?.layers?.length > 0 &&
        layer.name !== `__GAIA_${direction.toUpperCase()}__` &&
        (layer.type === "Group" || layer.type === "Artboard") &&
        !flagMap[layer.id + `_${direction}`]
    ) {
        if (layer?.layers?.length > 1) {
            let groupsMap = [];
            let layers = [];

            for (let i = 0; i < layer.layers.length; i++) {
                layers.push({
                    index: i,
                    type: layer.layers[i].type,
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
                            let column = isColumn(tryGroups) || isTextColumn(tryGroups);
                            let otherIntersect = hasOtherIntersect(layers, tryGroups);
                            // printCanGroupLayers(tryGroups);
                            // logger.log(`can column= ${column}, otherIntersect = ${otherIntersect}`);
                            if (column && !otherIntersect) {
                                canGroups.push({
                                    ...layer2,
                                });
                            }
                        } else if (direction === "row") {
                            let row = isRow(tryGroups) || isTextRow(tryGroups);
                            let otherIntersect = hasOtherIntersect(layers, tryGroups);
                            // printCanGroupLayers(tryGroups);
                            // logger.log(`can row= ${row}, otherIntersect = ${otherIntersect}`);
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
                        groupsMap.push(canGroups);
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
                let newGroup = new sketch.Group({
                    name: `__GAIA_${direction.toUpperCase()}__`,
                    layers: [],
                });
                newGroup.parent = layer;
                for (let k = 0; k < groupLayersMap[i].length; k++) {
                    groupLayersMap[i][k].parent = newGroup;
                }
                //                let minIndex = 100000;
                //                for (let k = 0; k < groupLayersMap[i].length; k++) {
                //                    if (minIndex > groupLayersMap[i][k].index) {
                //                        minIndex = groupLayersMap[i][k].index;
                //                    }
                //                }
                //                newGroup.index = minIndex;
                newGroup.adjustToFit();
            }

            if (groupsMap.length > 0) {
                // logger.log(`groupsMap.length>0`);
                // printLayers(layer, 0);
                let directions = ["row", "column"];
                directions.forEach((dir) => {
                    // logger.log(`    --------layer.name = ${layer.name}, direction = ${dir}`);
                    groupColumnRow(layer, dir, flagMap);
                });
            } else {
                // logger.log(" skip1...");
                // printLayers(layer, 0);
                flagMap[layer.id + `_${direction}`] = true;

                for (let i = 0; i < layer?.layers?.length; i++) {
                    let directions = ["column", "row"];
                    directions.forEach((dir) => {
                        // logger.log(
                        //     `    --------parent.name = ${layer.layers[i].parent.name}, subLayer.name = ${layer.layers[i].name}, direction = ${dir}`
                        // );
                        groupColumnRow(layer.layers[i], dir, flagMap);
                    });
                }
            }
        } else {
            // logger.log(" skip2...");
            // printLayers(layer, 0);
            flagMap[layer.id + `_${direction}`] = true;

            for (let i = 0; i < layer?.layers?.length; i++) {
                let directions = ["row", "column"];
                directions.forEach((dir) => {
                    // logger.log(
                    //     `    --------parent.name = ${layer.layers[i].parent.name}, subLayer.name = ${layer.layers[i].name}, direction = ${dir}`
                    // );
                    groupColumnRow(layer.layers[i], dir, flagMap);
                });
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

export function printCanGroupLayers(layers) {
    layers?.forEach((sublayer) => {
        logger.log(`  ${sublayer.name}`);
    });
}

export function printLineLayers(layers) {
    let result = "";
    for (let i = 0; i < layers.length; i++) {
        if (i > 0) {
            result += ",";
        }
        result += layers[i].name + "/" + layers[i].id;
    }
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
        if (!isLayoutAttribute(keys[i]) || layer.source != undefined) {
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
            result = color.toHex8String();
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

export function getAngle(px, py, mx, my, rotation) {
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
    if (rotation !== 0) {
        angle += rotation;
        if (angle >= 360) {
            angle = angle - 360;
        } else if (angle <= 0) {
            angle = angle + 360;
        }
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
    if (shadows.count() + innerShadows.count() > 0 && layer.style.sketchObject.hasEnabledShadow()) {
        const totalShadows = map(shadows, makeShadowCSS).concat(map(innerShadows, (s) => makeShadowCSS(s, true)));
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
        return path.join(outputDir, `${md5String}.png`);
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
        rightGap = style2.marginRight || style1.width - style2.marginLeft - style2.width;
        if (rightGap == 0) {
            rightGap = undefined;
        }
        bottomGap = style2.marginBottom || style1.height - style2.marginTop - style2.height;
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
                subLayer.style.marginRight = (subLayer.style.marginRight || 0) + rightGap;
            }
            if (i == 0) {
                if (topGap != undefined) {
                    subLayer.style.marginTop = (subLayer.style.marginTop || 0) + topGap;
                }
            } else if (i == middleLayer.layers.length - 1) {
                if (bottomGap != undefined) {
                    subLayer.style.marginBottom += (subLayer.style.marginBottom || 0) + bottomGap;
                }
            }
        } else {
            if (topGap != undefined) {
                subLayer.style.marginTop = (subLayer.style.marginTop || 0) + topGap;
            }
            if (bottomGap != undefined) {
                subLayer.style.marginBottom = (subLayer.style.marginBottom || 0) + bottomGap;
            }
            if (i == 0) {
                if (leftGap != undefined) {
                    subLayer.style.marginLeft = (subLayer.style.marginLeft || 0) + leftGap;
                }
            } else if (i == middleLayer.layers.length - 1) {
                if (rightGap != undefined) {
                    subLayer.style.marginRight = (subLayer.style.marginRight || 0) + rightGap;
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
        if (layer.type == "Text") {
            if (
                !layer.sketchObject.hasFixedWidth() &&
                layer.frame.height < 2 * (layer.style.lineHeight || layer.style.fontSize)
            ) {
                layer.sketchObject.setTextBehaviour(0);
                layer.sketchObject.adjustFrameToFit();
            }
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
                    dataJS += `"${schema.name}" : "${schema.default.replace(/\n/g, "\\n")}",\n`;
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
    } else if (language == "GaiaX" ) {
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
    }  else {
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
        // logger.log(
        //   `start replacing assets/${assetsMapKey} to ${assetsMap[assetsMapKey]}`
        // );
        result = result.replaceAll(`assets/${assetsMapKey}`, assetsMap[assetsMapKey]);
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

export function hasEnabledBorder(layer) {
    let flag = false;
    if (layer?.style?.borders?.length > 0) {
        for (let i = 0; i < layer.style.borders.length; i++) {
            if (layer.style.borders[i]["enabled"]) {
                flag = true;
                break;
            }
        }
    }
    return flag;
}

export function hasEnabledFills(layer) {
    let flag = false;
    if (layer?.style?.fills?.length > 0) {
        for (let i = 0; i < layer.style.fills.length; i++) {
            if (layer.style.fills[i]["enabled"]) {
                flag = true;
                break;
            }
        }
    }
    return flag;
}
