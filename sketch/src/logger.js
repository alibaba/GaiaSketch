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
export var logger = {
    info: function (...args) {
        !isProduction() && console.info(...args);
    },
    log: function (...args) {
        !isProduction() && console.log(...args);
    },
    warn: function (...args) {
        console.warn(...args);
    },
    error: function (...args) {
        console.error(...args);
    },
};

export function printLayers(layer, depth = 0) {
    if (isProduction()) {
        return;
    }
    let prefix = "";
    for (let i = 0; i < depth; i++) {
        prefix += "  ";
    }
    logger.log(
        `${prefix}${layer.name}(${layer.type}${layer.shapeType ? "/" + layer.shapeType : ""}} ${JSON.stringify({
            x: Math.round(layer.frame.x),
            y: Math.round(layer.frame.y),
            width: Math.round(layer.frame.width),
            height: Math.round(layer.frame.height),
        })}`
    );
    layer.layers &&
        layer.layers.forEach((sublayer) => {
            printLayers(sublayer, depth + 1);
        });
    if (depth == 0) {
        logger.log(" ");
    }
}

export function isProduction(params) {
    return process.env.BUILD_MODE === "production";
}
