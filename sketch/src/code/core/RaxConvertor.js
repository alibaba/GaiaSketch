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
import ImportStatements from "./ImportStatements";

/**
 * GKLayer 转到 rax 的基础模块
 * 暂时不做View层级的优化，这个一定要解决，否则View太冗余，会影响性能
 */
export default class RaxConvertor extends Convertor {
  generateViewTree() {
    let tree = "import {createElement, render, Component} from 'rax';\n";
    tree += "import './index.css';\n";
    tree += ImportStatements.getImportsSatements();
    tree += "\n\n";
    tree += "class Example extends Component {\n";
    tree += "render() {\n";
    tree += "let {\n";
    tree += this.artboards[0].generateAssignModuleInfo();
    tree += "\n";
    tree +=
      "} = (this.props.data && this.props.data.moduleinfo) ? this.props.data.moduleinfo : {};\n";
    tree += "return (\n";
    if (this.artboards[0]) {
      tree += this.artboards[0].generateViewTree();
    }
    tree += ");\n";
    tree += "}\n";
    tree += "}\n\n";
    tree += "export default Example;\n";
    tree += "// render(<Example />);\n";
    return tree;
  }
}
