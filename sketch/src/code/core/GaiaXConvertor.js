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

import { Convertor } from "./Convertor";
import {logger} from "../../logger";

export default class GaiaXConvertor extends Convertor {
    generateViewTree() {
        let tree = "";
        if (this.artboards[0]) {
            tree += this.artboards[0].generateViewTree();
        }
        let jsonTree = JSON.parse(tree);
        if (jsonTree != undefined) {
            jsonTree["package"] = {
                engines: {
                    gaiax: ">=0.0.1"
                },
                id: jsonTree["id"],
                version: "0",
                priority: "0",
                dependencies: {}
            };
            jsonTree["type"] = "gaia-template";
        }
        return JSON.stringify(jsonTree);
    }

    generateMockData(mock) {
        if (this.artboards[0]) {
            this.artboards[0].generateMockData(mock);
        }
    }

    generateDatabinding() {
        return {
            data: {},
            event: {}
        };
    }
}
