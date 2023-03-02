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

import { cssConvert } from "../code-helper";
import { logger } from "../../logger";

export default class VCStyle {
    // lang: string;
    // style: any;
    // type: any;

    constructor(style, lang, type) {
        this.lang = lang;
        this.style = style;
        this.type = type;

        if (
            this.style.top != undefined ||
            this.style.left != undefined ||
            this.style.bottom != undefined ||
            this.style.right != undefined
        ) {
            this.style.position = "absolute";
        }
        if (this.style.position && this.style.position == "absolute") {
            delete this.style.marginLeft;
            delete this.style.marginTop;
            delete this.style.marginBottom;
            delete this.style.marginRight;
        }

        if (this.style.marginLeft != undefined) {
            if (isNaN(Number(this.style.marginLeft))) {
                delete this.style.marginLeft;
            }
        }

        if (this.style.marginBottom != undefined) {
            if (isNaN(Number(this.style.marginBottom))) {
                delete this.style.marginBottom;
            }
        }

        if (this.style.marginRight != undefined) {
            if (isNaN(Number(this.style.marginRight))) {
                delete this.style.marginRight;
            }
        }

        if (this.style.marginTop != undefined) {
            if (isNaN(Number(this.style.marginTop))) {
                delete this.style.marginTop;
            }
        }
    }

    isReact() {
        return this.lang === "React";
    }

    isVue() {
        if (this.lang.indexOf("Vue") == 0) {
            return true;
        }
        return false;
    }

    isMiniApp() {
        return this.lang.indexOf("Mini-App") != -1;
    }

    isGaiaX() {
        return this.lang === "GaiaX";
    }


    vueShouldAddQuotationMark(key) {
        if (
            key === "left" ||
            key === "top" ||
            key === "width" ||
            key === "height" ||
            key === "fontSize" ||
            key === "lineHeight" ||
            key === "marginLeft" ||
            key === "marginRight" ||
            key === "marginTop" ||
            key === "marginBottom" ||
            key === "paddingLeft" ||
            key === "paddingRight" ||
            key === "paddingTop" ||
            key === "paddingBottom" ||
            key === "borderRadius" ||
            key === "borderWidth" ||
            key === "maxWidth"
        ) {
            return true;
        }
        return false;
    }

    isNumber(obj) {
        return obj === +obj;
    }

    generateCSS(type = 0) {
        // type=0 代表内联，,type = 1代表js和style放在同一个文件里，type=2代表放在单独的样式文件里
        let css = "";
        for (const key in this.style) {
            if (this.style.hasOwnProperty(key)) {
                const element = this.style[key];
                if (element != undefined && element != "NAN") {
                    if ((key.indexOf("margin") == 0 || key.indexOf("padding") == 0) && element == 0) {
                        continue;
                    }
                    if (key == "flexDirection" && element == "row") {
                        continue;
                    }
                    if (key == "backgroundGradient") {
                        continue;
                    }
                    let addAnnotation = false;
                    if (key == "name" || key == "type") {
                        addAnnotation = true;
                    }
                    if (addAnnotation) {
                        css += "/* ";
                    }
                    if (type == 2) {
                        css += cssConvert(key);
                    } else {
                        css += key;
                    }
                    css += ": ";
                    if ((this.isVue() || this.isReact() || this.isMiniApp()) && this.vueShouldAddQuotationMark(key)) {
                        css += element.toString();
                        if (this.isMiniApp()) {
                            css += "rpx";
                        } else {
                            css += "px";
                        }
                    } else {
                        css += element.toString();
                        if (
                            (this.isGaiaX() ) &&
                            this.isNumber(element) &&
                            key != "lines" &&
                            key != "flexGrow" &&
                            key != "fontWeight"
                        ) {
                            css += "px";
                        }
                    }
                    if (type == 2) {
                        css += ";";
                    } else {
                        css += ",";
                    }
                    if (addAnnotation) {
                        css += " */";
                    }

                    css += "\n";
                }
            }
        }
        return css;
    }

    shouldAddQuotationMark(value) {
        let shouldAdd = false;
        if (!this.isVue()) {
            if (typeof value === "string" || typeof value === "object") {
                shouldAdd = true;
            }
        }
        return shouldAdd;
    }
}
