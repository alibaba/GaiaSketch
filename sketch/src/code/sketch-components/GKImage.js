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
import {Rectangle} from "sketch/dom";
import {assetsDir, extractEffectStyle, layerToBase64, normalizeColor,} from "../code-helper";
import * as md5 from "blueimp-md5";
import * as fs from "@skpm/fs";
import * as path from "@skpm/path";

export default class GKImage extends GKLayer {
  // layerToImage?: boolean;
  // resizeMode?: string;
  // source?: string;

  constructor(props) {
    super(props);
    this.layerToImage = props.layerToImage;
    this.type = "Image";
    this.style.type = "Image";
    let containFills = false;
    if (
      props.layer.style.fills !== undefined &&
      props.layer.style.fills.length > 0
    ) {
      containFills = true;
    }
    if (props.customStyle) {
      this.style.top = props.customStyle.top;
      this.style.left = props.customStyle.left;
    }
    if (props.layer.image !== undefined && !containFills) {
      if (this.source == undefined) {
        let data = props.layer.image.nsdata;
        let base64String = data.base64EncodedStringWithOptions(0);
        let assetsPath = assetsDir();
        let md5String = md5(String(base64String));
        fs.writeFileSync(
          path.join(assetsPath, `${md5String}.png`),
          base64String,
          {
            encoding: "base64",
          }
        );
        this.source = `https://via.placeholder.com/${this.style.width}x${this.style.height}`;
      }
    } else {
      if (props.layerToImage || containFills) {
        let targetLayer = props.layer;
        if (props.layer.type == "Group" && props.layer.layers.length > 0) {
          targetLayer = props.layer.layers[0];
        }
        let coppedShadows = Object.assign([], targetLayer.style.shadows);
        let coppedBorders = Object.assign([], targetLayer.style.borders);
        targetLayer.style.shadows = [];
        let newBorders = [];
        let needToHandleBorder;
        for (let index = 0; index < targetLayer.style.borders.length; index++) {
          const element = targetLayer.style.borders[index];
          if (element.enabled) {
            if (element.position == "Outside") {
              needToHandleBorder = element;
            } else {
              newBorders.push(element);
            }
          } else {
            newBorders.push(element);
          }
        }

        targetLayer.style.borders = newBorders;
        let originRect = props.layer.frame;
        if (
          originRect.width != this.style.width ||
          originRect.height != this.style.height
        ) {
          props.layer.frame = new Rectangle(
            props.layer.frame.x,
            props.layer.frame.y,
            this.style.width,
            this.style.height
          );
        }
        // console.log(
        //   `image props.layer.frame.width=${props.layer.frame.width}, props.layer.frame.height=${props.layer.frame.height}`
        // );
        layerToBase64(props.layer);
        this.source = `https://via.placeholder.com/${this.style.width}x${this.style.height}`;
        props.layer.frame = new Rectangle(
          originRect.x,
          originRect.y,
          originRect.width,
          originRect.height
        );

        targetLayer.style.shadows = coppedShadows;
        targetLayer.style.borders = coppedBorders;

        if (props.layer.type == "Group") {
          if (needToHandleBorder && needToHandleBorder.fillType === "Color") {
            this.style.borderColor = normalizeColor(needToHandleBorder.color);
            this.style.borderWidth = needToHandleBorder.thickness;
            this.style.borderStyle = "solid";
          }
          Object.assign(this.style, extractEffectStyle(targetLayer));
        } else if (
          needToHandleBorder &&
          needToHandleBorder.fillType === "Color"
        ) {
          this.style.borderColor = normalizeColor(needToHandleBorder.color);
          this.style.borderWidth = needToHandleBorder.thickness;
          this.style.borderStyle = "solid";
        } else if (needToHandleBorder == undefined) {
          delete this.style.borderColor;
          delete this.style.borderWidth;
          delete this.style.borderStyle;
        }

        this.extractBorderStyle(targetLayer);

        if (
          props.parent &&
          (targetLayer.style.shadows.length > 0 || needToHandleBorder)
        ) {
          props.parent.notContainOverfow = true;
        }
      }
    }
    this.resizeMode = "contain";
    //console.log(`layer.name=${props.layer.name}, resizeMode=${this.resizeMode}`);
    delete this.style.backgroundColor;
    delete this.style.transform;
    delete this.style.backgroundImage;
  }
}
