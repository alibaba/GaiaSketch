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

export default class VCBackgroundImage extends VCView {
  constructor(layer, lang, index) {
    super(layer, lang, index);
    //console.log(`VCBackgroundImage = ${layer.name}`);
  }

  convertToStyles(layer) {
    if (layer !== undefined && layer.style !== undefined) {
      let style1 = {
        key: this.getUniqueClassName(),
        value: new VCStyle(layer.style, this.lang, this.type),
      };
      this.styles.push(style1);
      let absoluteStyle;
      if (this.isReact() || this.isMiniApp()) {
        absoluteStyle = Object.assign(
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
          layer.style,
          {
            top: 0,
            left: 0,
            marginLeft: 0,
            marginTop: 0,
            position: "absolute",
          }
        );
      } else {
        absoluteStyle = {
          ...layer.style,
          top: 0,
          left: 0,
          marginLeft: 0,
          marginTop: 0,
          position: "absolute",
        };
      }
      if (this.isReact()) {
        absoluteStyle = Object.assign(absoluteStyle, {
          backgroundImage: `url(${this.source})`,
          backgroundSize: this.resizeMode,
        });
      }
      let style2 = {
        key: this.getUniqueClassName(this.index + 1, "Image"),
        value: new VCStyle(absoluteStyle, this.lang, this.type),
      };
      this.styles.push(style2);
    }
  }

  getImportStatement() {
    if (this.isRax()) {
      return [
        "import Picture from 'rax-picture';",
        "import View from 'rax-view';",
      ];
    }
    return [];
  }

  generateLeft() {
    let left = "";
    if (this.isRax()) {
      return (
        left +
        "<View " +
        this.generateStyle() +
        ">\n" +
        "<Picture " +
        this.generateStyle(this.index + 1, "Image") +
        this.generateAnother(this.index + 1) +
        " />\n"
      );
    } else if (this.isReact()) {
      let label = "<div";
      let middle =
        `${label} ` +
        this.generateStyle(this.index + 1, "Image") +
        this.generateAnother(this.index + 1) +
        " />\n";
      return left + "<div " + this.generateStyle() + ">\n" + middle;
    } else if (this.isVue()) {
      let label = "<img";
      if (this.lang.lastIndexOf("weex") !== -1) {
        label = "<image";
      }
      let middle =
        `${label} ` +
        this.generateStyle(this.index + 1, "Image") +
        this.generateAnother(this.index + 1) +
        " />\n";
      return left + "<div " + this.generateStyle() + ">\n" + middle;
    } else if (this.isMiniApp()) {
      return (
        left +
        "<view " +
        this.generateStyle() +
        ">\n" +
        "<image " +
        this.generateStyle(this.index + 1, "Image") +
        this.generateAnother(this.index + 1) +
        " />\n"
      );
    } else if (this.isGaiaX()) {
      left = `{"type":"view", "id": "${this.getUniqueClassName(
        this.index,
        "View"
      )}", "layers": [{"type":"image","id":"${this.getUniqueClassName(
        this.index + 1,
        "Image"
      )}"}]`;
      //console.log(`layer left = `, left);
      return left;
    }
    return "\n";
  }

  generateMiddle() {
    return "";
  }

  generateAnother(index) {
    if (this.source !== undefined) {
      let s = "\n";
      if (this.isRax()) {
        s += "source={{";
        s += `uri: ${this.getUniqueClassName(index, "Image")}`;
        s += "}}\n";
        s += `resizeMode=\"${this.resizeMode}\"`;
      } else if (this.isVue()) {
        s += "src=";
        s += `\"${this.source}\"`;
      } else if (this.isMiniApp()) {
        s += 'src="{{';
        s += `${this.getUniqueClassName(index, "Image")}`;
        s += '}}"\n';
        s += `mode=\"${this.miniAppMode(this.resizeMode)}\"`;
      }
      return s;
    }
    return "";
  }

  generateRight() {
    if (this.isRax()) {
      let right = "";
      return right + "</View>\n";
    } else if (this.isVue() || this.isReact()) {
      let right = "";
      return right + "</div>\n";
    } else if (this.isMiniApp()) {
      return "</view>";
    } else if (this.isGaiaX()) {
      //console.log(`layer right = }`);
      return "}";
    } else {
      return "\n";
    }
  }

  generateSchema() {
    let schema;
    let name = this.getUniqueClassName(this.index + 1, "Image");
    let properties = {
      name: name,
      type: "string",
      title: "图片",
      default: `${this.source}`,
      "x-componentType": "uploader",
    };
    schema = [properties];
    this.children.forEach((la) => {
      schema = schema.concat(la.generateSchema());
    });
    return schema;
  }

  generateAssignModuleInfo() {
    let moduleInfo = `${this.getUniqueClassName(this.index + 1, "Image")} = \"${
      this.source
    }\",\n`;
    this.children.forEach((la) => {
      moduleInfo += la.generateAssignModuleInfo();
    });
    return moduleInfo;
  }

  generateMockData(mock) {
    mock[this.getUniqueClassName(this.index + 1, "Image")] = {
      url: this.source,
    };
    this.children.forEach((la) => {
      la.generateMockData(mock);
    });
  }
}
