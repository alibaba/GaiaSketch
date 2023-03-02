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

import { Stack } from "@fluentui/react";
import React from "react";
import { BarType } from "../constants";
import { ExportMeasure } from "./export-measure";
import { ExportCode } from "./export-code";
import { Component } from "./components";
import { Default } from "./default";
import { Style } from "./styles";
import { Page } from "./pages";
import { Iconfont } from "./iconfonts";
import { Upload } from "./upload";
import { Management } from "./management";

interface IPageProps {
    barType: BarType;
}

export function MainPage(props: IPageProps) {
    return (
        <Stack
            styles={{
                root: {
                    width: "100%",
                    height: "100%"
                }
            }}
        >
            {props.barType == BarType.Unknown ? <Default /> : null}
            {props.barType == BarType.ExportMeasure ? <ExportMeasure /> : null}
            {props.barType == BarType.ExportCode ? <ExportCode /> : null}
            {props.barType == BarType.Component ? <Component /> : null}
            {props.barType == BarType.Style ? <Style /> : null}
            {props.barType == BarType.Iconfont ? <Iconfont /> : null}
            {props.barType == BarType.Page ? <Page /> : null}
            {props.barType == BarType.Upload ? <Upload /> : null}
            {props.barType == BarType.Management ? <Management /> : null}
        </Stack>
    );
}
