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
import { upperCaseFirst } from "upper-case-first";
import { extractEffectStyle, getAngle, normalizeAngle, normalizeColor } from "../code-helper";
import { logger } from "../../logger";

export default class GKLayer {
    // layers: any;
    // style: any;
    // parent: any;
    // id: any;
    // type: any;
    // name: any;
    // imageData: any;
    // symbolId: any;
    // originLayer: any;
    // masks: any[];
    // scrollDirection: ScrollDirection;
    // source?: any;
    // path?: string;
    // innerFrame?: any;

    constructor(props) {
        this.layers = [];
        this.masks = [];
        this.style = {};
        this.parent = props.parent;
        this.scrollDirection = "None";

        if (props.layer === undefined) {
            return;
        }
        //logger.log(`props.layer.id=${props.layer.id}, layer name=${props.layer.name}`);
        // //logger.log(`candidatesForMasking=${props.layer.sketchObject.closestClippingLayer()}`);
        this.id = props.layer.id;
        this.type = props.layer.type;
        this.name = props.layer.name;
        this.style.name = this.name;
        this.style.type = this.type;
        this.imageData = undefined;
        this.symbolId = props.layer.symbolId;
        // //logger.log(`this.index=${this.index}`);
        if (this.symbolId === undefined) {
            this.symbolId = this.id;
        }
        // this.originLayer = layer;

        Object.assign(this.style, {
            left: Math.round(props.layer.frame.x),
            top: Math.round(props.layer.frame.y),
            width: Math.max(Math.round(props.layer.frame.width), 0),
            height: Math.max(Math.round(props.layer.frame.height), 0),
        });

        this.innerFrame = { ...this.style };

        // logger.log(`props.layer.name=${props.layer.name}`);
        // //logger.log(`origin style=${JSON.stringify(this.style)}`);
        // if (props.layer.type == "Text") {
        //   logger.log(`props.layer=`, props.layer);
        // }
        if (props.scale) {
            if (!props.layer.sketchObject.hasFixedWidth()) {
                this.style.width = Math.floor(this.style.width * (props.scale.to.width / props.scale.from.width));
            }
            if (!props.layer.sketchObject.hasFixedHeight()) {
                this.style.height = Math.floor(this.style.height * (props.scale.to.height / props.scale.from.height));
            }

            if (!props.layer.sketchObject.hasFixedLeft()) {
                if (props.layer.sketchObject.hasFixedWidth()) {
                    this.style.left = Math.floor(
                        (this.style.left * (props.scale.to.width - this.style.width)) /
                            (props.scale.from.width - this.style.width)
                    );
                } else {
                    this.style.left = Math.floor(this.style.left * (props.scale.to.width / props.scale.from.width));
                }
            }
            if (!props.layer.sketchObject.hasFixedTop()) {
                if (props.layer.sketchObject.hasFixedHeight()) {
                    this.style.top = Math.floor(
                        (this.style.top * (props.scale.to.height - this.style.height)) /
                            (props.scale.from.height - this.style.height)
                    );
                } else {
                    this.style.top = Math.floor(this.style.top * (props.scale.to.height / props.scale.from.height));
                }
            }
        }
        //logger.log(`modified style=${JSON.stringify(this.style)}`);

        //TODO: this.style.type = this.type; for test
        // this.style.type = this.type;

        // logger.log(`layer=${this.name}, opacity=${props.layer.style.opacity}`);

        this.style.opacity = Number(props.layer.style.opacity).toFixed(2);
        if (this.style.opacity == 1) {
            delete this.style.opacity;
        }

        if (this.type == "Text") {
            this.style.textAlign = props.layer.alignment || props.layer.style.alignment;
        }

        let rotation = props.layer.sketchObject.rotation();

        if (props.layer.style !== undefined) {
            if (props.layer.style.fills !== undefined && props.layer.style.fills.length > 0) {
                for (let i = props.layer.style.fills.length - 1; i >= 0; i--) {
                    let fi = props.layer.style.fills[i];
                    if (fi.enabled) {
                        if (fi.fillType === sketch.Style.FillType.Color) {
                            if (this.type === "Text") {
                                this.style.color = normalizeColor(fi.color);
                            } else {
                                this.style.backgroundColor = normalizeColor(fi.color);
                            }
                        } else if (fi.fillType === sketch.Style.FillType.Gradient) {
                            if (fi.gradient.gradientType === sketch.Style.GradientType.Linear) {
                                let degree = getAngle(
                                    fi.gradient.from.x,
                                    fi.gradient.from.y,
                                    fi.gradient.to.x,
                                    fi.gradient.to.y,
                                    rotation
                                );
                                let angle = normalizeAngle(degree);
                                let linearString = "linear-gradient(";
                                if (angle !== undefined) {
                                    linearString += `${angle}`;
                                } else {
                                    linearString += `${degree}deg`;
                                }
                                fi.gradient.stops.forEach((element) => {
                                    // 在x5内核上，gradient不支持颜色值包含alpha
                                    linearString += `,${normalizeColor(element.color, false)}`;
                                });
                                linearString += ")";
                                this.style.backgroundImage = linearString;
                                delete this.style.backgroundColor;

                                let linearString2 = "@linearGradient{";
                                if (angle === undefined) {
                                    angle = "toTop";
                                } else {
                                    let splitArray = angle.split(" ");
                                    let tmpAngle = "";
                                    for (let i = 0; i < splitArray.length; i++) {
                                        if (i == 0) {
                                            tmpAngle += splitArray[i];
                                        } else {
                                            tmpAngle += upperCaseFirst(splitArray[i]);
                                        }
                                    }
                                    angle = tmpAngle;
                                }
                                linearString2 += `'${angle}'`;
                                fi.gradient.stops.forEach((element) => {
                                    // 在x5内核上，gradient不支持颜色值包含alpha
                                    let color = normalizeColor(element.color, false);
                                    if (color.length > 7) {
                                        let alphaString = color.substring(color.length - 2);
                                        color = `#${alphaString}${color.substring(1, color.length - 2)}`;
                                    }
                                    linearString2 += `,'${color}'`;
                                });
                                linearString2 += "}";
                                this.style.backgroundGradient = linearString2;
                            }
                            // else if (fi.gradient.gradientType === 'Radial') {
                            //   let radialString = `radial-gradient(at 0% 0%`;
                            //   fi.gradient.stops.forEach(element => {
                            //     // 在x5内核上，gradient不支持颜色值包含alpha
                            //     radialString += `,${element.color.slice(0,-2)} ${element.position*100}%`;
                            //   });
                            //   radialString += ')';
                            //   this.style.backgroundImage = radialString;
                            // }

                            if (this.type == "Text") {
                                delete this.style.color;
                            }
                        }
                        break;
                    }
                }
            }

            //设置 borderRadius
            this.extractBorderStyle(props.layer);

            // if (props.layer.style.innerShadows !== undefined && props.layer.style.innerShadows.length > 0) {
            //   let boxShadowString = '';
            //   props.layer.style.innerShadows.forEach(shadow => {
            //     let insetString = 'inset ';
            //     insetString += `${shadow.x}px ${shadow.y}px 0 0 ${shadow.color}`;
            //     insetString += ', ';
            //     boxShadowString += insetString;
            //   });
            //   if (boxShadowString.length > 0) {
            //     boxShadowString = boxShadowString.substring(0, boxShadowString.length - 2);
            //     this.style.boxShadow = boxShadowString;
            //   }
            // }
            Object.assign(this.style, extractEffectStyle(props.layer));

            // 处理border
            // //logger.log(`props.layer.style.sketchObject.hasEnabledBorder() = ${props.layer.style.sketchObject.hasEnabledBorder()}`)
            if (props.layer.type != "Text" && props.layer.style.sketchObject.hasEnabledBorder()) {
                if (this.type !== "Group") {
                    props.layer.style.borders.forEach((border) => {
                        if (border.enabled) {
                            if (border.fillType === "Color") {
                                //logger.log(`border.color = ${border.color}`)
                                this.style.borderColor = normalizeColor(border.color);
                                this.style.borderWidth = border.thickness;
                                this.style.borderStyle = "solid";
                            } else if (border.fillType === "Gradient") {
                                let linearString = "linear-gradient(";
                                linearString += `${getAngle(
                                    border.gradient.from.x,
                                    border.gradient.from.y,
                                    border.gradient.to.x,
                                    border.gradient.to.y
                                )}deg`;
                                border.gradient.stops.forEach((element) => {
                                    // 在x5内核上，gradient不支持颜色值包含alpha
                                    linearString += `,${normalizeColor(element.color, false)}`;
                                });
                                linearString += ")";
                                this.style.borderImage = linearString;
                                this.style.borderWidth = border.thickness;
                                this.style.borderStyle = "solid";
                            }
                        }
                    });
                }
            }
        }
    }

    extractBorderStyle(layer) {
        if (layer.type === "Shape" || layer.type === "ShapePath") {
            let nativeObject = layer.sketchObject;
            if (
                nativeObject.class() == "MSRectangleShape" ||
                (nativeObject.class() == "MSShapeGroup" && nativeObject.layers()[0].class() == "MSRectangleShape")
            ) {
                let targetObject;
                // //logger.log(`layer.name=${layer.name} is ${nativeObject.class()}`);

                if (nativeObject.class() == "MSRectangleShape") {
                    targetObject = nativeObject;
                } else {
                    targetObject = nativeObject.layers().firstObject();
                }
                let points = targetObject.points();
                // radius
                if (points.length == 4) {
                    let radiusTopLeft = Math.round(points.objectAtIndex(0).cornerRadius()),
                        radiusTopRight = Math.round(points.objectAtIndex(1).cornerRadius()),
                        radiusBottomRight = Math.round(points.objectAtIndex(2).cornerRadius()),
                        radiusBottomLeft = Math.round(points.objectAtIndex(3).cornerRadius());
                    if (
                        radiusTopLeft == radiusTopRight &&
                        radiusTopLeft == radiusBottomRight &&
                        radiusTopLeft == radiusBottomLeft &&
                        radiusTopLeft != 0
                    ) {
                        this.style.borderRadius = Math.round(
                            Math.min(radiusTopLeft, this.style.width / 2, this.style.height / 2)
                        );
                    } else {
                        this.style.borderBottomLeftRadius = Math.min(
                            radiusBottomLeft,
                            this.style.width / 2,
                            this.style.height / 2
                        );
                        this.style.borderBottomRightRadius = Math.min(
                            radiusBottomRight,
                            this.style.width / 2,
                            this.style.height / 2
                        );
                        this.style.borderTopLeftRadius = Math.min(
                            radiusTopLeft,
                            this.style.width / 2,
                            this.style.height / 2
                        );
                        this.style.borderTopRightRadius = Math.min(
                            radiusTopRight,
                            this.style.width / 2,
                            this.style.height / 2
                        );

                        if (
                            this.style.borderBottomLeftRadius === 0 &&
                            this.style.borderBottomRightRadius === 0 &&
                            this.style.borderTopLeftRadius === 0 &&
                            this.style.borderTopRightRadius === 0
                        ) {
                            delete this.style.borderBottomLeftRadius;
                            delete this.style.borderBottomRightRadius;
                            delete this.style.borderTopLeftRadius;
                            delete this.style.borderTopRightRadius;
                        } else {
                            if (layer.sketchObject.isFlippedVertical()) {
                                [this.style.borderTopLeftRadius, this.style.borderBottomLeftRadius] = [
                                    this.style.borderBottomLeftRadius,
                                    this.style.borderTopLeftRadius,
                                ];
                                [this.style.borderTopRightRadius, this.style.borderBottomRightRadius] = [
                                    this.style.borderBottomRightRadius,
                                    this.style.borderTopRightRadius,
                                ];
                            } else if (layer.sketchObject.isFlippedHorizontal()) {
                                [this.style.borderTopLeftRadius, this.style.borderTopRightRadius] = [
                                    this.style.borderTopRightRadius,
                                    this.style.borderTopLeftRadius,
                                ];
                                [this.style.borderBottomLeftRadius, this.style.borderBottomRightRadius] = [
                                    this.style.borderBottomRightRadius,
                                    this.style.borderBottomLeftRadius,
                                ];
                            }
                        }
                    }
                }
            } else if (nativeObject.class() == "MSOvalShape") {
                // 默认是个圆形，这个后续可能需要改下
                // logger.log(`layer.name=${layer.name} is MSOvalShape`);
                this.style.borderRadius = Math.round(this.style.width / 2);
            }
        }
        //logger.log(`this.style `, this.style)
    }
}
