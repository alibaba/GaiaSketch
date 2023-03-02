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
import { normalizeColor, toCSSRGBA } from "../code-helper";
import { logger } from "../../logger";
export default class GKText extends GKLayer {
    // text: any;
    // numberOfLines: any;
    // fixedWidth: any;
    // alignment: any;
    constructor(props) {
        super(props);
        if (props.layer === undefined) {
            return;
        }
        // //logger.log( `text layer id = ${this.symbolId}`);
        this.text = props.layer.text;

        // text-align https://developer.mozilla.org/en-US/docs/Web/CSS/text-align
        this.style.textAlign = props.layer.style.alignment;
        if (this.style.textAlign === "natural") {
            //  'natural'	Indicates the default alignment for script
            this.style.textAlign = "left";
        }

        let nativeObject = props.layer.sketchObject;

        if (nativeObject.font() !== undefined) {
            let fontFamily = String(nativeObject.font().fontName());
            if (fontFamily.indexOf("PingFangSC") == 0) {
                this.style.fontWeight = this.getFontWeight(fontFamily);
            } else {
                this.style.fontFamily = fontFamily;
            }
        }
        let width = Math.ceil(nativeObject.attributedStringValue().size().width);
        let height = Math.ceil(nativeObject.attributedStringValue().size().height);
        //logger.log(`width=${width}, this.style.width=${this.style.width}`);
        if (width < this.style.width) {
            if (this.style.textAlign == "right") {
                this.style.left = this.style.left + (this.style.width - width);
            }
        }
        this.style.fontSize = nativeObject.fontSize();
        if (nativeObject.lineHeight() > 0 && this.style.lineHeight >= this.style.fontSize) {
            this.style.lineHeight = nativeObject.lineHeight();
        }
        if (props.layer.style.lineHeight) {
            this.style.lineHeight = props.layer.style.lineHeight;
        }
        if (this.style.color === undefined && this.style.backgroundImage == undefined) {
            this.style.color = normalizeColor(toCSSRGBA(nativeObject.textColor()));
        }
        // logger.log(`layer.text=${props.layer.text}`);
        //logger.log(`layer.fixedWidth=${layer.fixedWidth}`);
        this.fixedWidth = props.layer.fixedWidth;
        let textArray = this.text.split("\n");
        // logger.log(`textArray = `, textArray);
        if (textArray.length > 1) {
            this.numberOfLines = textArray.length;
        } else {
            // logger.log(
            //   `this.style.height=${this.style.height}, this.style.lineHeight=${this.style.lineHeight}, height=${height}`
            // );
            if (this.style.lineHeight) {
                this.numberOfLines = Math.ceil(this.style.height / this.style.lineHeight);
            } else if (this.style.height != undefined && height != undefined) {
                this.numberOfLines = Math.ceil(this.style.height / height);
            }
        }

        if (this.numberOfLines == 1 && this.style.lineHeight == undefined) {
            this.style.lineHeight = this.style.height;
        }
        //logger.log(`this.numberOfLines=${this.numberOfLines}`)
        // this.text = this.text.replace(/\n/g, "\\n");
        //logger.log(`text = ${this.text}, text style = `, this.style)
        this.style.letterSpacing = nativeObject.characterSpacing() || "inherit";
        // //logger.log(
        //   `nativeObject.paragraphStyle().paragraphSpacing()=${nativeObject
        //     .paragraphStyle()
        //     .paragraphSpacing()}`
        // );
        if (props.layer.style?.borders?.length > 0) {
            for (let i = 0; i < props.layer.style?.borders?.length; i++) {
                let border = props.layer.style?.borders[0];
                if (border.enabled && border.fillType == "Color") {
                    this.style["-webkit-text-stroke"] = `${border.thickness}px ${normalizeColor(border.color)}`;
                }
            }
        }
        if (props.layer.style.textStrikethrough === "single") {
            this.style.textDecoration = "line-through";
        }
        if (props.layer.style.textUnderline === "single") {
            this.style.textDecoration = "underline";
        }
        logger.log(`((((((${this.type})))))) layer.name = ${this.name},  styles = `, this.style);
    }

    getFontWeight(fontFamily) {
        let fontWeight;
        if (fontFamily == "PingFangSC-Semibold") {
            fontWeight = 600;
        } else if (fontFamily == "PingFangSC-Medium") {
            fontWeight = 500;
        } else if (fontFamily == "PingFangSC-Thin") {
            fontWeight = 100;
        } else if (fontFamily == "PingFangSC-Light") {
            fontWeight = 300;
        } else if (fontFamily == "PingFangSC-Ultralight") {
            fontWeight = 200;
        }
        return fontWeight;
    }
}
