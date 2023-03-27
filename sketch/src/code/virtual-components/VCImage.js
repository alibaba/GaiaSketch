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

import VCView from "./VCView";
import VCStyle from "./VCStyle";
import { logger } from "../../logger";

export default class VCImage extends VCView {
    constructor(layer, lang, index) {
        super(layer, lang, index);
         logger.log(`VCImage = ${layer.name}`);
    }

    convertToStyles(layer) {
        if (layer !== undefined && layer.style !== undefined) {
            let imageStyle;
            if (this.isReact() || this.isMiniApp()) {
                imageStyle = Object.assign(
                    {
                        border: "0 solid black",
                        position: "relative",
                        boxSizing: "border-box",
                        display: "flex",
                        flexDirection: "column",
                        alignContent: "flex-start",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "center center",
                        flexShrink: 0,
                    },
                    layer.style
                );
            } else {
                imageStyle = {
                    ...layer.style,
                };
            }
            if (this.isReact()) {
                imageStyle = Object.assign(imageStyle, {
                    backgroundImage: `url(${this.source})`,
                    backgroundSize: this.resizeMode,
                });
            }

            let styleValue = new VCStyle(imageStyle, this.lang, this.type);

            if (styleValue && styleValue.style && styleValue.style.position == "absolute") {
                this.position = "absolute";
            }

            let style = {
                key: this.getUniqueClassName(),
                value: styleValue,
            };
            this.styles.push(style);
        }
    }

    getImportStatement() {

        return [];
    }

    generateLeft() {
        if (this.isReact()) {
            let label = "<div";
            return `${label} ` + this.generateStyle() + " />\n";
        } else if (this.isVue()) {
            let left = "";
            let label = "<img";
            if (this.lang.lastIndexOf("weex") !== -1) {
                label = "<image";
            }
            return left + `${label} ` + this.generateStyle() + this.generateAnother() + " />\n";
        } else if (this.isMiniApp()) {
            let label = "<image";
            return `${label} ` + this.generateStyle() + this.generateAnother() + " />\n";
        } else if (this.isGaiaX()) {
            return `{"type": "image", "id": "${this.getUniqueClassName()}"`;
        }
    }

    generateAnother() {
        if (this.source !== undefined) {
            let s = "\n";
           if (this.isReact()) {
            } else if (this.isVue()) {
                s += "src=";
                s += `\"${this.source}\"`;
            } else if (this.isMiniApp()) {
                s += 'src="{{';
                s += `${this.getUniqueClassName()}`;
                s += '}}"\n';
                s += `mode=\"${this.miniAppMode(this.resizeMode)}\"`;
            }
            return s;
        }
        return "";
    }

    generateRight() {
        if (this.isGaiaX()) {
            return "}\n";
        }
        return "";
    }

    generateSchema() {
        let name = this.getUniqueClassName();
        let properties = {
            name: name,
            type: "string",
            title: "图片",
            default: `${this.source}`,
            "x-componentType": "uploader",
        };
        let schema = [properties];
        return schema;
    }

    generateAssignModuleInfo() {
        let moduleinfo = `${this.getUniqueClassName()} = \"${this.source}\",\n`;
        return moduleinfo;
    }

    generateMockData(mock) {
        //logger.log(`this.url=${this.source}`);
        mock[this.getUniqueClassName()] = { url: this.source };
    }
}
