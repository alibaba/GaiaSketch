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

import VCView from "../virtual-components/VCView";
import VCText from "../virtual-components/VCText";
import VCImage from "../virtual-components/VCImage";
import VCBackgroundImage from "../virtual-components/VCBackgroundImage";
import { logger } from "../../logger";

export class Convertor {
    // artboards: any;
    // index: number;
    // lang: CodeType;
    // rootView: any;

    constructor(lang) {
        this.lang = lang;
        this.index = 0;
        this.artboards = [];
    }

    convert(page) {
        if (page.layers && page.layers.length == 1) {
            let view = this.convertLayerToView(page.layers[0]);
            this.artboards.push(view);
        } else {
            let view = this.convertLayerToView(page);
            this.artboards.push(view);
        }
        this.convertToStyles(this.artboards[0]);
        let schema = this.generateSchema();
        let tree = this.generateViewTree();
        let css = this.generateCSSTree();
        // logger.log(`schema = `, schema);
        // logger.log(`tree = `, tree);
        // logger.log(`css = `, css);
        if (this.lang.startsWith("GaiaX")) {
            let mock = {};
            this.generateMockData(mock);
            // //logger.log(`mock`, mock)
            mock = JSON.stringify(mock);
            let databinding = this.generateDatabinding();
            return { tree, css, schema, mock, databinding };
        }

        return { tree, css, schema };
    }

    convertLayerToView(layer, depth = 1) {
        let view;
        if (layer) {
            let prefix = "";
            for (let i = 0; i < depth; i++) {
                prefix += "  ";
            }
            // logger.log(`${prefix}${layer.type}, layer.name=${layer.name}`);
            if (layer.type === "Text") {
                view = new VCText(layer, this.lang, this.index);
                this.index += 1;
            } else if (layer.type === "Image") {
                view = new VCImage(layer, this.lang, this.index);
                this.index += 1;
            } else if (layer.type === "BackgroundImage") {
                view = new VCBackgroundImage(layer, this.lang, this.index);
                this.index += 3;
            } else {
                view = new VCView(layer, this.lang, this.index);
                this.index += 1;
            }
            layer.layers.forEach((ele) => {
                let vi = this.convertLayerToView(ele, depth+1);
                view.children.push(vi);
            });
        }
        return view;
    }

    convertToStyles(view) {
        if (view) {
            view.convertToStyles(view.layer)
        }
        for (let i = 0; i < view?.children.length; i++) {
            this.convertToStyles(view.children[i]) ;
        }
    }

    generateViewTree() {
        throw new Error("Method not implemented.");
    }

    generateCSSTree() {
        let tree = "";
        if (this.artboards[0] ) {
            tree += this.artboards[0].generateCSSTree(0);
        }
        return tree;
    }

    generateSchema() {
        let schema = [];
        if (this.artboards[0]) {
            schema = schema.concat(this.artboards[0].generateSchema(0));
        }
        return JSON.stringify(schema);
    }

    generateMockData(mock) {}

    generateDatabinding() {}
}
