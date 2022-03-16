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
    let schema = this.generateSchema();
    let tree = this.generateViewTree();
    let css = this.generateCSSTree();
    // console.log(`schema = `, schema);
    // console.log(`tree = `, tree);
    // console.log(`css = `, css);
    if (this.lang == "GaiaX") {
      let mock = {};
      this.generateMockData(mock);
      // //console.log(`mock`, mock)
      mock = JSON.stringify(mock);
      let databinding = this.generateDatabinding();
      return { tree, css, schema, mock, databinding };
    } else if (this.lang == "DX") {
      let mock = {};
      this.generateMockData(mock);
      mock = JSON.stringify(mock);
      return { tree, mock };
    }

    return { tree, css, schema };
  }

  convertLayerToView(layer) {
    let view;
    if (layer) {
      // console.log(`layer.type=${layer.type}, layer.name=${layer.name}`);
      if (layer.type == "Text") {
        view = new VCText(layer, this.lang, this.index);
        this.index += 1;
      } else if (layer.type == "Image") {
        view = new VCImage(layer, this.lang, this.index);
        this.index += 1;
      } else if (layer.type == "BackgroundImage") {
        view = new VCBackgroundImage(layer, this.lang, this.index);
        this.index += 2;
      } else {
        view = new VCView(layer, this.lang, this.index);
        this.index += 1;
      }
      layer.layers.forEach((ele) => {
        let vi = this.convertLayerToView(ele);
        view.children.push(vi);
      });
    } else {
    }
    return view;
  }

  generateViewTree() {
    throw new Error("Method not implemented.");
  }

  generateCSSTree() {
    let tree = "";
    if (this.artboards[0] && this.lang !== "DX") {
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
