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

import {Image, ImageFit, PrimaryButton, Spinner, SpinnerSize, Stack,} from "@fluentui/react";
import React, {useEffect, useState} from "react";
import {BarType} from "../constants";

interface IEmptyProps {
  libraryInfo: any;
  onDidLoaded: any;
  barType: BarType;
}

declare var window: any;

export function Empty(props: IEmptyProps) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.onDidDownloadComponentLibrary = function (data: any) {
      setLoading(false);
      props.onDidLoaded && props.onDidLoaded(data && data.libraryInfo);
    };
    window.onDidDownloadStyleLibrary = function (data: any) {
      setLoading(false);
      props.onDidLoaded && props.onDidLoaded(data && data.libraryInfo);
    };
    window.onDidDownloadIconfontLibrary = function (data: any) {
      setLoading(false);
      props.onDidLoaded && props.onDidLoaded(data && data.libraryInfo);
    };
    window.onDidDownloadPageLibrary = function (data: any) {
      setLoading(false);
      props.onDidLoaded && props.onDidLoaded(data && data.libraryInfo);
    };
  }, []);

  return (
    <Stack
      styles={{ root: { width: "100%", height: "100%", padding: 12 } }}
      tokens={{ childrenGap: 20 }}
      horizontalAlign={"center"}
      verticalAlign={"center"}
    >
      <Image
        src={"./empty.png"}
        imageFit={ImageFit.centerContain}
        styles={{ root: { width: 260, height: 260, borderRadius: 5 } }}
      />
      <PrimaryButton
        text={loading ? "下载中" : "点击下载"}
        styles={{ root: { width: "90%" } }}
        disabled={loading}
        onClick={() => {
          setTimeout(() => {
            setLoading(true);
            window.postMessage(
              getDownloadMessageName(props.barType),
              props.libraryInfo
            );
          }, 200);
        }}
      >
        {loading ? (
          <Spinner
            size={SpinnerSize.xSmall}
            styles={{
              root: {
                position: "absolute",
                right: 70,
              },
            }}
          />
        ) : null}
      </PrimaryButton>
    </Stack>
  );
}

function getDownloadMessageName(barType: BarType) {
  if (barType == BarType.Component) {
    return "downloadComponentLibrary";
  } else if (barType == BarType.Style) {
    return "downloadStyleLibrary";
  } else if (barType == BarType.Iconfont) {
    return "downloadIconfontLibrary";
  } else if (barType == BarType.Page) {
    return "downloadPageLibrary";
  }
}
