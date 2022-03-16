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

import React, {useEffect, useState} from "react";
import "./App.css";
import {Separator, Stack} from "@fluentui/react";
import {MainPage} from "./pages/main-page";
import {Bar} from "./bar";
import {BarType} from "./constants";
import {Token} from "./pages/token";

declare var window: any;

function App() {
  const [showTokenInput, setShowTokenInput] = useState(false);

  const [currentSelectedItem, setCurrentSelectedItem] = useState(
    BarType.Unknown
  );

  useEffect(() => {
    window.onDidGetUserPrivateToken = function (data: any) {
      if (!data || !data.isValid) {
        setShowTokenInput(true);
      } else {
        setShowTokenInput(false);
      }
    };
    window.onDidSetUserPrivateToken = function (data: any) {
      if (data && data.success) {
        setShowTokenInput(false);
      } else {
        setShowTokenInput(true);
      }
    };
  });

  useEffect(() => {
    window.postMessage("getUserPrivateToken");
  }, []);

  useEffect(() => {
    window.onDidGetLatestBarType = function (data: any) {
      if (data && data.barType && data.barType !== currentSelectedItem) {
        window.postMessage("setLatestBarType", data.barType);
        setCurrentSelectedItem(data.barType);
      }
    };
    setTimeout(() => {
      window.postMessage("getLatestBarType");
    }, 100);
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{ position: "absolute", left: 0, right: 45, top: 0, bottom: 0 }}
      >
        {showTokenInput &&
        currentSelectedItem !== BarType.ExportCode &&
        currentSelectedItem !== BarType.ExportMeasure ? (
          <Token />
        ) : (
          <MainPage barType={currentSelectedItem} />
        )}
      </div>
      <Stack
        horizontal={true}
        styles={{
          root: {
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
          },
        }}
      >
        <Separator vertical styles={{ root: { padding: 0, margin: 0 } }} />
        <Stack.Item data-app-region="drag">
          <Bar
            barType={currentSelectedItem}
            onClick={(bar: BarType) => {
              window.postMessage("setLatestBarType", bar);
              setCurrentSelectedItem(bar);
            }}
          />
        </Stack.Item>
      </Stack>
    </div>
  );
}

export default App;
