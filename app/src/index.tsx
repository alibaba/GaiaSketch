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

import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import { createTheme, initializeIcons, loadTheme } from "@fluentui/react";

const darkTheme = createTheme({
    defaultFontStyle: { fontFamily: "monaco", fontSize: 12 },
    palette: {
        themePrimary: "#0091ff",
        themeLighterAlt: "#00060a",
        themeLighter: "#001729",
        themeLight: "#002b4d",
        themeTertiary: "#005799",
        themeSecondary: "#007fe0",
        themeDarkAlt: "#199cff",
        themeDark: "#3dabff",
        themeDarker: "#70c1ff",
        neutralLighterAlt: "#2d2d2d",
        neutralLighter: "#363636",
        neutralLight: "#434343",
        neutralQuaternaryAlt: "#4c4c4c",
        neutralQuaternary: "#535353",
        neutralTertiaryAlt: "#707070",
        neutralTertiary: "#c8c8c8",
        neutralSecondary: "#d0d0d0",
        neutralPrimaryAlt: "#dadada",
        neutralPrimary: "#ffffff",
        neutralDark: "#f4f4f4",
        black: "#f8f8f8",
        white: "#242424"
    }
});

loadTheme(darkTheme);

initializeIcons();

ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    document.getElementById("root")
);
