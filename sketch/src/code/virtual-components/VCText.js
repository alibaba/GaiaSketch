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

export default class VCText extends VCView {
  constructor(layer, lang, index) {
    super(layer, lang, index);
    //console.log(`VCText = ${layer.name}`);
  }

  convertToStyles(layer) {
    if (layer !== undefined && layer.style !== undefined) {
      let styleValue;
      if (layer.fixedWidth) {
        layer.style.maxWidth = layer.style.width;
      }
      if (this.isReact() || this.isMiniApp()) {
        let reactStyle = Object.assign(
          {
            border: "0 solid black",
            whiteSpace: "pre-wrap",
            position: "relative",
            boxSizing: "border-box",
            display: "block",
            flexDirection: "column",
            alignContent: "flex-start",
            flexShrink: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
          },
          layer.style
        );
        if (this.numberOfLines) {
          if (parseInt(this.numberOfLines) === 1) {
            reactStyle.whiteSpace = "nowrap";
          } else {
            reactStyle.display = "-webkit-box";
            reactStyle.webkitBoxOrient = "vertical";
            reactStyle.webkitLineClamp = String(this.numberOfLines);
          }
        }

        styleValue = new VCStyle(reactStyle, this.lang, this.type);
      } else if (this.isGaiaX()) {
        let additionalStyle = {};
        if (this.numberOfLines) {
          additionalStyle["lines"] = this.numberOfLines;
        }
        let gaiaxStyle = Object.assign({}, layer.style, additionalStyle);
        styleValue = new VCStyle(gaiaxStyle, this.lang, this.type);
      } else {
        styleValue = new VCStyle(layer.style, this.lang, this.type);
      }
      if (
        styleValue &&
        styleValue.style &&
        styleValue.style.position == "absolute"
      ) {
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
    if (this.isRax()) {
      return ["import Text from 'rax-text';"];
    }
    return [];
  }

  generateLeft() {
    let left = "";
    if (this.isRax()) {
      left += "<Text " + this.generateStyle() + this.generateAnother() + ">\n";
    } else if (this.isVue() || this.isReact()) {
      let label = "<span";
      if (this.lang.lastIndexOf("weex") !== -1) {
        label = "<text";
      }
      left +=
        `${label} ` + this.generateStyle() + this.generateAnother() + ">\n";
    } else if (this.isMiniApp()) {
      left += `<text ` + this.generateStyle() + this.generateAnother() + ">\n";
    } else if (this.isGaiaX()) {
      return left + `{"type": "text", "id": "${this.getUniqueClassName()}"`;
    } else if (this.isDX()) {
      return (
        left +
        `<FastTextView  ${this.generateStyle()} ${this.generateAnother()} text="@data{${this.getUniqueClassName()}}" >\n`
      );
    }
    return left;
  }

  generateAnother() {
    if (this.numberOfLines !== undefined) {
      if (this.isRax()) {
        let s = "\n";
        s += `numberOfLines=\{${this.numberOfLines}\}`;
        return s;
      } else if (this.isDX()) {
        let s = "\n";
        s += `maxLines="${this.numberOfLines}"`;
        return s;
      }
    }
    return "";
  }

  generateRight() {
    if (this.isRax()) {
      return "</Text>\n";
    } else if (this.isVue() || this.isReact()) {
      return "</span>\n";
    } else if (this.isMiniApp()) {
      return "</text>\n";
    } else if (this.isGaiaX()) {
      return "}\n";
    } else if (this.isDX()) {
      return "</FastTextView>\n";
    }
  }

  generateMiddle() {
    let middle = "";
    if (this.isMiniApp()) {
      middle += `{{${this.getUniqueClassName()}}}` + "\n";
    } else {
      if (!this.isDX()) {
        middle += `{${this.getUniqueClassName()}}` + "\n";
      }
    }
    return middle;
  }

  generateSchema() {
    let name = this.getUniqueClassName();
    let properties = {
      name: name,
      type: "string",
      title: "文案",
      default: `${this.text}`,
    };
    return [properties];
  }

  generateAssignModuleInfo() {
    //console.log(`this.text=${this.text}`);
    return `${this.getUniqueClassName()} = \"${this.text.replace(
      "\n",
      ""
    )}\",\n`;
  }

  generateMockData(mock) {
    if (this.text && typeof this.text == "string") {
      mock[this.getUniqueClassName()] = this.text;
    }
  }
}
