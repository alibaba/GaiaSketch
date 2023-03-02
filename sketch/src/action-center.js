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

import { onCloseDocument, onManualOpenPanel, onOpenPanel, onShutdown } from "./panel";
import { onLayerToCodeSelectionChanged } from "./layer-to-code";
import { componentOnSelectionChanged } from "./libraries/component";
import { pageOnSelectionChanged } from "./libraries/page";
import { iconfontOnSelectionChanged } from "./libraries/iconfont";
import { ExportCode, ExportMeasure } from "./contants";
import {setLastSelectedLanguages, setLatestBarType, setToken} from "./helper";
import * as Settings from "sketch/settings";
import UI from "sketch/ui";

export function onManualOpenAction(context) {
    onManualOpenPanel(context);
}

export function onOpenDocumentAction(context) {
    onOpenPanel(context);
}

export function onShutdownAction(context) {
    onShutdown(context);
}

export function onCloseDocumentAction(context) {
    onCloseDocument(context);
}

export function onSelectionChanged(context) {
    onLayerToCodeSelectionChanged(context);
    componentOnSelectionChanged(context);
    pageOnSelectionChanged(context);
    iconfontOnSelectionChanged(context);
}

export function onExportCodeAction(context) {
    onOpenPanel(context, ExportCode);
}

export function onExportMeasureAction(context) {
    onOpenPanel(context, ExportMeasure);
}

export function onResetAction(context) {
    setToken(null);
    setLastSelectedLanguages(undefined);
    UI.message("Reset Success!");
}
