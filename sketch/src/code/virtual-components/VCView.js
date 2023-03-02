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

import VCStyle from "./VCStyle";
import { logger } from "../../logger";

export default class VCView {
    // lang: CodeType;
    // children: any;
    // type: any;
    // index: number;
    // styles?: any;
    // scrollDirection: any;
    // numberOfLines: any;
    // text: any;
    // source: any;
    // resizeMode: any;
    // position: string;
    // innerFrame: any;
    // parentFrameLayout: boolean;

    constructor(layer, lang, index = 0) {
        // logger.log(`VCView = ${layer.name}`);
        this.layer = layer;
        this.lang = lang;
        this.children = [];
        this.type = layer.type;
        this.innerFrame = layer.innerFrame;
        this.scrollDirection = layer.scrollDirection;
        this.index = index;
        this.styles = [];
        this.source = layer.source;
        this.resizeMode = layer.resizeMode;
        this.numberOfLines = layer.numberOfLines;
        this.text = layer.text;
        this.parentFrameLayout = false;
    }

    convertToStyles(layer) {
        if (layer !== undefined && layer.style !== undefined) {
            let styleValue;
            if (this.isReact() || this.isMiniApp()) {
                let reactStyle = Object.assign(
                    {
                        border: "0 solid black",
                        position: "relative",
                        boxSizing: "border-box",
                        display: "flex",
                        flexDirection: "column",
                        alignContent: "flex-start",
                        flexShrink: 0,
                    },
                    layer.style
                );
                // logger.log(`             layer.name = ${layer.name}`);
                styleValue = new VCStyle(reactStyle, this.lang, this.type);
            } else {
                styleValue = new VCStyle(layer.style, this.lang, this.type);
            }
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


    isReact() {
        return this.lang === "React";
    }

    isVue() {
        return this.lang.indexOf("Vue") == 0;
    }

    isMiniApp() {
        return this.lang.indexOf("Mini-App") != -1;
    }

    isGaiaX() {
        return this.lang === "GaiaX";
    }


    canFrameLayout() {
        let frameLayout = false;
        if (!frameLayout && this.children && this.children.length > 0) {
            for (let index = 0; index < this.children.length; index++) {
                const child = this.children[index];
                if (child.position == "absolute") {
                    frameLayout = true;
                    break;
                }
            }
            if (frameLayout) {
                for (let index = 0; index < this.children.length; index++) {
                    const child = this.children[index];
                    child.parentFrameLayout = true;
                }
            }
        }
        return frameLayout;
    }

    getImportStatement() {

        return [];
    }

    generateLeft() {
        let left = "";
         if (this.isVue() || this.isReact()) {
            return left + "<div " + this.generateStyle() + ">\n";
        } else if (this.isMiniApp()) {
            return left + "<view " + this.generateStyle() + ">\n";
        } else if (this.isGaiaX()) {
            return left + `{"type": "view", "id": "${this.getUniqueClassName()}"`;
        }
    }

    getUniqueClassName(index = this.index, type = this.type) {
        return `${type}_${index}`;
    }

    generateStyle(index = this.index, type = this.type) {
        let st = "";
        if ( this.isReact()) {
            st += `className =\"${this.getUniqueClassName(index, type)}\"`;
        } else if (this.isVue()) {
            st += `class=\"${this.getUniqueClassName(index, type)}\"`;
            if (this.children.length > 0) {
                st += "  :style=\"{ display: ['-webkit-box', '-ms-flexbox', 'flex'] }\"";
            }
        } else if (this.isMiniApp()) {
            st += `class=\"${this.getUniqueClassName(index, type)}\"`;
        }
        return st;
    }

    generateAnother(index = this.index) {
        let st = "";
        return st;
    }

    generateMiddle() {
        return "";
    }

    generateRight() {
        let right = "";
        if (this.isVue() || this.isReact()) {
            right = "</div>\n";
        } else if (this.isMiniApp()) {
            right = "</view>\n";
        } else if (this.isGaiaX()) {
            right = "}\n";
        }
        return right;
    }

    generateViewTree() {
        let tree = "";
        if (this.isGaiaX() ) {
            tree += this.generateLeft();
            if (this.children && this.children.length > 0) {
                tree += `,"layers": [`;
            }
            for (let index = 0; index < this.children.length; index++) {
                const la = this.children[index];
                if (index > 0) {
                    tree += ",";
                }
                tree += la.generateViewTree();
            }
            if (this.children && this.children.length > 0) {
                tree += `]`;
            }
            tree += this.generateRight();
        } else {
            tree += this.generateLeft();
            this.children.forEach((la) => {
                tree += la.generateViewTree();
            });
            tree += this.generateMiddle();
            tree += this.generateRight();
        }
        // logger.log(`treeeee = `, tree)
        return tree;
    }

    generateCSSTree(index = this.index, type = this.type) {
        let tree = "";
        this.styles.forEach((element) => {
            if (this.isGaiaX() ) {
                tree += `#${element.key} {\n`;
            } else {
                tree += `.${element.key} {\n`;
            }
            tree += element.value.generateCSS(2);
            tree += "}\n";
            tree += "\n";
        });

        this.children.forEach((la) => {
            tree += la.generateCSSTree();
        });
        return tree;
    }

    generateSchema() {
        let schema = [];
        this.children.forEach((la) => {
            schema = schema.concat(la.generateSchema());
        });
        return schema;
    }

    miniAppMode(mode) {
        let miniAppContentMode = "aspectFill";
        if (mode == "contain") {
            miniAppContentMode = "scaleToFill";
        }
        return miniAppContentMode;
    }

    generateAssignModuleInfo() {
        let moduleinfo = "";
        this.children.forEach((la) => {
            moduleinfo += la.generateAssignModuleInfo();
        });
        return moduleinfo;
    }

    generateMockData(mock) {
        this.children.forEach((la) => {
            la.generateMockData(mock);
        });
    }
}
