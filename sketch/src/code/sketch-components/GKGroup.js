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
import { isNumberEqual, normalizeColor, printCanGroupLayers } from "../code-helper";
import * as sketch from "sketch/dom";
import * as TinyColor from "tinycolor2";
import { isRectEqual } from "../rect";
import GKBackgroundImage from "./GKBackgroundImage";
import { logger, printLayers } from "../../logger";

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
            let layers = [];

            let firstLayer = props.layer.layers[0];

            let backgroundImageLayer;
            if (props.layer.layers.length > 1 && firstLayer.type === "Image") {
                if (isRectEqual(firstLayer.frame, props.layer.frame)) {
                    backgroundImageLayer = new GKBackgroundImage({
                        layer: firstLayer,
                        parent: this,
                    });
                    backgroundImageLayer.name = "__GAIA_BACKGROUND_IMAGE__" + firstLayer.name;
                }
            }

            let index = backgroundImageLayer ? 1 : 0;
            for (; index < props.layer.layers.length; index++) {
                const subLayer = props.layer.layers[index];
                if (subLayer.hidden) {
                    continue;
                }
                //logger.log(`for eatch sublayer = ${subLayer.name} sublayer.type = ${subLayer.type}`)
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
                    layers.push(gklayer);
                }
            }

            if (backgroundImageLayer) {
                backgroundImageLayer.layers = layers;
                backgroundImageLayer.layers = sortGroupLayers(backgroundImageLayer.layers, backgroundImageLayer, this);
                this.layers = [backgroundImageLayer];
                this.layers = sortGroupLayers(this.layers, this, props.parent);
            } else {
                this.layers = layers;
                this.layers = sortGroupLayers(this.layers, this, props.parent);
            }
            // this.layers = this.layers.concat(this.masks);
            // //logger.log(`------------------ before`);
            // printLayers(0, this);
            // logger.log(
            //   `sortedLayer name = ${this.name} layers.length = ${this.layers.length}, sortedLayer.layers[0].name = ${this.layers[0].name}`
            // );
            // //logger.log(`------------------ middle`);
            // printLayers(0, this);
            // //logger.log(`------------------ end`);
            if (!this.notContainOverfow) {
                this.style.overflow = "hidden";
            }
        }
        logger.log(`((((((${this.type})))))) layer.name = ${this.name},  styles = `, this.style);
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

    //logger.log(`from text=${originText}, to text=${layer.text}`);
    let nativeObject = layer.sketchObject;
    let attString = nativeObject.attributedStringValue();
    let attributedStringArray = [];
    /**
     * MSAttributedStringColorAttribute = "<MSImmutableColor: 0x600000478d00>
     (D9AB5C20-E9E7-4E8E-99EC-4EB1281A57D5)"; NSFont =
     "\"PingFangSC-Semibold 24.00
     */
    // logger.log(`attString = ${attString}`)
    for (let index = 0; index < attString.length(); index++) {
        let charAtIndex = attString.string().substringWithRange(NSMakeRange(index, 1));
        let attribute = attString.attributesAtIndex_effectiveRange(index, NSMakeRange(0, attString.length()));
        let charObject = {};
        charObject.char = charAtIndex;
        charObject.style = {
            color: normalizeColor(`#${attribute["MSAttributedStringColorAttribute"].hexValue()}`),
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
            NSFont.fontWithName_size(subAttribute.style.fontFamily, subAttribute.style.fontSize)
        );
        // logger.log(`str = ${subAttribute.char}, size=`, size);
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
    if (a.color !== b.color || a.fontSize !== b.fontSize || a.fontFamily !== b.fontFamily) {
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
                borderRadius: Math.round(thisLayer.style.borderRadius),
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
                borderRadius: Math.round(thisLayer.style.borderRadius),
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
                width: borderLayer.style.width - 2 * (borderLayer.style.borderWidth || 1),
                height: borderLayer.style.height - 2 * (borderLayer.style.borderWidth || 1),
                borderRadius: Math.round(borderLayer.style.borderRadius),
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

    return [...sortedLayers];
}

export function revFindRealGroup(layer, style) {
    if (layer.layers && layer.layers.length == 1 && sketch.fromNative(layer.layers[0]).type == "Group") {
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
    let index = 0;
    for (; layer.layers && index < layer.layers.length; index++) {
        const element = layer.layers[index];
        if (element.type == "Group") {
            if (!isAllText(element)) {
                return false;
            }
        } else if (element.type != "Text") {
            return false;
        }
    }
    if (index > 0) {
        return true;
    }
    return false;
}

export function isEmptyLayer(layer) {
    if (layer.style.borderStyle != undefined || layer.style.backgroundColor != undefined) {
        return false;
    }
    return true;
}

export function containText(layer) {
    if (layer.type == "Text") {
        return true;
    }
    let index = 0;
    for (; layer.layers && index < layer.layers.length; index++) {
        const element = layer.layers[index];
        if (containText(element)) {
            return true;
        }
    }
    return false;
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

    // logger.log(
    //   `layer = ${layer.name} layer.type=${layer.type} can treatAsImageLayer = ${isImage}`
    // );
    return isImage;
}
