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

import {Link, PrimaryButton, Spinner, SpinnerSize, Stack, TextField,} from "@fluentui/react";
import React, {useEffect, useState} from "react";
import URLParse from "url-parse";

declare var window: any;

interface ITokenProps {}

export function Token(props: ITokenProps) {
  const [domain, setDomain] = useState(null);
  const [settingToken, setSettingToken] = useState(false);
  const [token, setToken] = useState<any>(null);

  useEffect(() => {
    window.onDidGetServerDomain = function (data: any) {
      if (data && data.domain) {
        let url: any = new URLParse(data.domain);
        url.pathname = "/profile/account";
        setDomain(url.toString());
      }
    };
  });

  useEffect(() => {
    window.postMessage("getServerDomain");
  }, []);

  return (
    <Stack
      styles={{
        root: {
          width: "100%",
          height: "100%",
        },
      }}
      tokens={{ childrenGap: 12 }}
      verticalAlign={"center"}
      horizontalAlign={"center"}
    >
      <TextField
        label={"请输入Private Token"}
        onChange={(event, newValue) => {
          setToken(newValue);
        }}
      />
      <Link
        underline
        onClick={() => {
          window.postMessage("openUrl", domain);
        }}
      >
        点击此处前往拷贝Private Token
      </Link>
      <PrimaryButton
        text={"点击授权"}
        onClick={() => {
          setSettingToken(true);
          window.postMessage("setUserPrivateToken", token);
        }}
        disabled={!token || token.length <= 0}
      >
        {settingToken ? (
          <Spinner
            size={SpinnerSize.xSmall}
            styles={{
              root: {
                position: "absolute",
                right: 5,
              },
            }}
          />
        ) : null}
      </PrimaryButton>
    </Stack>
  );
}
