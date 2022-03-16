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
    //console.log(`VCView = ${layer.name}`);
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
    this.convertToStyles(layer);
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
        styleValue = new VCStyle(reactStyle, this.lang, this.type);
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

  isRax() {
    return this.lang === "Rax";
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

  isDX() {
    return this.lang === "DX";
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
    if (this.isRax()) {
      let headers = ["import View from 'rax-view';"];
      if (this.scrollDirection != "None") {
        headers.push("import ScrollView from 'rax-scrollview';");
      }
      return headers;
    }
    return [];
  }

  generateLeft() {
    let left = "";
    if (this.isRax()) {
      left = "<View ";
      if (this.scrollDirection == "Horizontal") {
        left =
          "<ScrollView " +
          "ref={(scrollView) => {\n" +
          "this.horizontalScrollView = scrollView;\n" +
          "}}\n" +
          "horizontal={true}";
      } else if (this.scrollDirection == "Vertical") {
        left =
          "<ScrollView " +
          "ref={(scrollView) => {\n" +
          "this.horizontalScrollView = scrollView;\n" +
          "}}";
      }
      left += this.generateStyle() + ">\n";
      return left;
    } else if (this.isVue() || this.isReact()) {
      return left + "<div " + this.generateStyle() + ">\n";
    } else if (this.isMiniApp()) {
      return left + "<view " + this.generateStyle() + ">\n";
    } else if (this.isGaiaX()) {
      return left + `{"type": "view", "id": "${this.getUniqueClassName()}"`;
    } else if (this.isDX()) {
      return (
        left +
        ` ${this.canFrameLayout() ? "<FrameLayout " : "<LinearLayout "} ` +
        this.generateStyle() +
        ">\n"
      );
    }
  }

  getUniqueClassName(index = this.index, type = this.type) {
    return `${type}_${index}`;
  }

  generateStyle(index = this.index, type = this.type) {
    let st = "";
    if (this.isRax() || this.isReact()) {
      st += `className =\"${this.getUniqueClassName(index, type)}\"`;
    } else if (this.isVue()) {
      st += `class=\"${this.getUniqueClassName(index, type)}\"`;
      if (this.children.length > 0) {
        st +=
          "  :style=\"{ display: ['-webkit-box', '-ms-flexbox', 'flex'] }\"";
      }
    } else if (this.isMiniApp()) {
      st += `class=\"${this.getUniqueClassName(index, type)}\"`;
    } else if (this.isDX()) {
      // console.log(
      //   `this.type=${this.type}, this.styles=${JSON.stringify(this.styles)}`
      // );
      let styles = this.styles[0].value && this.styles[0].value.style;
      if (styles != undefined || Object.keys(styles).length > 0) {
        for (let index = 0; index < Object.keys(styles).length; index++) {
          const styleKey = Object.keys(styles)[index];
          if (
            styleKey == "position" ||
            styleKey == "letterSpacing" ||
            styleKey == "overflow" ||
            styleKey == "name" ||
            styleKey == "type" ||
            styleKey == "borderStyle" ||
            styleKey == "backgroundImage" ||
            styleKey == "alignItems" ||
            styleKey == "lineHeight"
          ) {
            continue;
          }
          // if (styleKey == 'justifyContent' && styles[styleKey] == 'space-between') {
          //   for (let index2 = this.children.length - 1; index2 > 0; index2--) {
          //     let child = this.children[index2];
          //     if (styles['flexDirection'] == 'column') {

          //     } else {
          //       let marginLeft = child.styles[0].value.style.marginLeft || 0;
          //       child.styles[0].value.style.marginLeft += 1;
          //     }

          //     break;
          //   }
          //   continue;
          // }
          if (styles[styleKey]) {
            if (styleKey == "flexDirection") {
              if (!this.canFrameLayout()) {
                if (styles[styleKey] == "column") {
                  st += `orientation = "vertical" \n`;
                } else {
                  st += `orientation = "horizontal" \n`;
                }
              }
            } else if (styleKey == "opacity") {
              st += `alpha = "${styles[styleKey]}" \n`;
            } else if (styleKey == "fontSize") {
              st += `textSize = "${styles[styleKey]}" \n`;
            } else if (styleKey == "textAlign") {
              st += `textGravity = "${styles[styleKey]}" \n`;
            } else if (styleKey == "borderRadius") {
              st += `cornerRadiusLeftTop = "${styles["borderRadius"]}" \n`;
              st += `cornerRadiusRightTop = "${styles["borderRadius"]}" \n`;
              st += `cornerRadiusLeftBottom = "${styles["borderRadius"]}" \n`;
              st += `cornerRadiusRightBottom = "${styles["borderRadius"]}" \n`;
            } else if (styleKey == "borderTopLeftRadius") {
              st += `cornerRadiusLeftTop = "${styles[styleKey]}" \n`;
            } else if (styleKey == "borderTopRightRadius") {
              st += `cornerRadiusRightTop = "${styles[styleKey]}" \n`;
            } else if (styleKey == "borderBottomLeftRadius") {
              st += `cornerRadiusLeftBottom = "${styles[styleKey]}" \n`;
            } else if (styleKey == "borderBottomRightRadius") {
              st += `cornerRadiusRightBottom = "${styles[styleKey]}" \n`;
            } else if (styleKey == "color") {
              st += `textColor = "${styles[styleKey]}" \n`;
            } else if (styleKey == "top") {
              st += `marginTop = "${styles[styleKey]}" \n`;
            } else if (styleKey == "left") {
              st += `marginLeft = "${styles[styleKey]}" \n`;
            } else if (styleKey == "right") {
              st += `marginRight = "${styles[styleKey]}" \n`;
            } else if (styleKey == "bottom") {
              st += `marginBottom = "${styles[styleKey]}" \n`;
            } else if (styleKey == "marginTop") {
              if (this.parentFrameLayout) {
                st += `marginTop = "${this.innerFrame.top}" \n`;
              } else {
                st += `${styleKey} = "${styles[styleKey]}" \n`;
              }
            } else if (styleKey == "marginRight") {
              if (this.parentFrameLayout) {
                st += `marginRight = "${this.innerFrame.right}" \n`;
              } else {
                st += `${styleKey} = "${styles[styleKey]}" \n`;
              }
            } else if (styleKey == "marginBottom") {
              if (this.parentFrameLayout) {
                st += `marginBottom = "${this.innerFrame.bottom}" \n`;
              } else {
                st += `${styleKey} = "${styles[styleKey]}" \n`;
              }
            } else if (styleKey == "marginLeft") {
              if (this.parentFrameLayout) {
                st += `marginLeft = "${this.innerFrame.left}" \n`;
              } else {
                st += `${styleKey} = "${styles[styleKey]}" \n`;
              }
            } else if (styleKey == "fontWeight") {
              if (
                !isNaN(Number(styles[styleKey])) &&
                Number(styles[styleKey]) > 400
              ) {
                st += `isBold = "true" \n`;
              }
            } else if (styleKey == "fontStyle") {
              if (styles[styleKey] == "italic") {
                st += `isItalic = "true" \n`;
              }
            } else if (styleKey == "textDecoration") {
              if (styles[styleKey] == "underline") {
                st += `isUnderline = "true" \n`;
              } else if (styles[styleKey] == "line-through") {
                st += `isStrikeThrough = "true" \n`;
              }
            } else if (styleKey == "flexGrow") {
              st += `weight = "1" \n`;
            } else {
              st += `${styleKey} = "${styles[styleKey]}" \n`;
            }
          }
        }
        // if (styles["width"] == undefined && this.children.length == 1) {
        //   st += `width = "match_parent" \n`;
        // }
        // if (styles["height"] == undefined) {
        //   st += `height = "match_parent" \n`;
        // }
        if (this.parentFrameLayout) {
          if (
            styles["marginTop"] == undefined &&
            styles["top"] == undefined &&
            Number(this.innerFrame.top) != 0
          ) {
            st += `marginTop = "${this.innerFrame.top}" \n`;
          }
          if (
            styles["marginLeft"] == undefined &&
            styles["left"] == undefined &&
            Number(this.innerFrame.left) != 0
          ) {
            st += `marginLeft = "${this.innerFrame.left}" \n`;
          }
        }
      }
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
    if (this.isRax()) {
      right = "</View>\n";
      if (this.scrollDirection != "None") {
        right = "</ScrollView>";
      }
    } else if (this.isVue() || this.isReact()) {
      right = "</div>\n";
    } else if (this.isMiniApp()) {
      right = "</view>\n";
    } else if (this.isGaiaX()) {
      right = "}\n";
    } else if (this.isDX()) {
      right = `${
        this.canFrameLayout() ? "</FrameLayout>" : "</LinearLayout>"
      }\n`;
    }
    return right;
  }

  generateViewTree() {
    let tree = "";
    if (this.isGaiaX()) {
      tree += this.generateLeft();
      if (this.children && this.children.length > 0) {
        tree += `,"layers": [`;
      }
      for (let index = 0; index < this.children.length; index++) {
        const la = this.children[index];
        //console.log(`tree = `, tree)
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
    //console.log(`treeeee = `, tree)
    return tree;
  }

  generateCSSTree(index = this.index, type = this.type) {
    let tree = "";
    this.styles.forEach((element) => {
      if (this.isGaiaX()) {
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
