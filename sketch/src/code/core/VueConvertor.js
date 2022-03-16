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

import {Convertor} from "./Convertor";

export default class VueConvertor extends Convertor {
  generateViewTree() {
    let tree = "<template>\n";
    if (this.artboards[0]) {
      tree += this.artboards[0].generateViewTree(1);
    }
    tree += "</template>\n\n";
    tree += "<script>\n";
    tree += "export default {\n";
    tree += "  name: 'Example'\n";
    tree += "}\n";
    tree += "</script>\n\n";
    tree += "<style scoped>\n";
    tree += "  @import './index.css';\n";
    tree += "</style>\n";
    return tree;
  }
}
