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

import { Image, ImageFit, Stack, Text } from "@fluentui/react";
import React from "react";

interface IDefaultProps {
}

export function Default(props: IDefaultProps) {
    return (
        <Stack
            styles={{
                root: {
                    margin: 8,
                    padding: 5,
                    height: "100%"
                }
            }}
            verticalAlign={"center"}
            horizontalAlign={"center"}
            tokens={{ childrenGap: 12 }}
        >
            <Image
                draggable={false}
                src={"./icon.png"}
                imageFit={ImageFit.centerContain}
                styles={{
                    root: {
                        height: 150,
                        width: 150
                    }
                }}
            />
            <Text styles={{ root: { fontSize: 30, fontWeight: 500 } }}>
                Gaia Sketch
            </Text>
        </Stack>
    );
}
