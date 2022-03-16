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

import {FontIcon, getTheme, Image, ImageFit, mergeStyles, Separator, Stack,} from "@fluentui/react";
import React, {useEffect, useState} from "react";
import {BarType} from "../constants";

const iconClass = mergeStyles({
  fontSize: 20,
  height: 20,
  width: 20,
  margin: "0 15px",
});

interface IBarProps {
  barType: BarType;
  onClick: any;
}

const theme = getTheme();

export function Bar(props: IBarProps) {
  const [content, setContent] = useState<any>(null);

  useEffect(() => {
    let options = [
      { type: BarType.Component, icon: "WebComponents" },
      { type: BarType.Style, icon: "Color" },
      { type: BarType.Iconfont, icon: "Font" },
      { type: BarType.Page, icon: "PageEdit" },
      { type: BarType.Upload, icon: "CloudUpload" },
      { type: BarType.Management, icon: "WorkforceManagement" },
      { type: "Divider" },
      { type: BarType.ExportMeasure, icon: "Documentation" },
      { type: BarType.ExportCode, icon: "Code" },
    ];
    let contents: any = [];
    options.forEach((option) => {
      if (option.type === "Divider") {
        contents.push(<Separator />);
      } else {
        contents.push(
          <div
            style={{
              width: "100%",
              height: "60px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
            }}
            onMouseOver={(event: any) => {
              if (props.barType != option.type) {
                event.target.style.color = theme.palette.white;
              }
            }}
            onMouseOut={(event: any) => {
              if (props.barType != option.type) {
                event.target.style.color = theme.palette.whiteTranslucent40;
              }
            }}
            onClick={() => {
              props && props.onClick && props.onClick(option.type);
            }}
          >
            <FontIcon
              iconName={option.icon}
              className={iconClass}
              style={{
                color: `${
                  props.barType == option.type
                    ? theme.palette.themePrimary
                    : theme.palette.whiteTranslucent40
                }`,
              }}
            />
          </div>
        );
      }
    });
    setContent(contents);
  }, [props.barType]);

  return (
    <Stack
      styles={{
        root: {
          width: 45,
          height: "100%",
          cursor: "pointer",
        },
      }}
    >
      <div
        style={{
          width: "100%",
          height: "60px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: "pointer",
        }}
      >
        <Image
          draggable={false}
          src={"./icon.png"}
          imageFit={ImageFit.centerContain}
          styles={{
            root: {
              height: 35,
              width: 35,
            },
          }}
        />
      </div>
      {content}
    </Stack>
  );
}
