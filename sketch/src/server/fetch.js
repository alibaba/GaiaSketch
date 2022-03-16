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

import * as fetch from "sketch-polyfill-fetch";
import * as Console from "@skpm/console";
import parseURL from "url-parse";
import {getToken} from "../helper";
import {getServerJSON} from "./server-helper";

const console = Console();

export function fetch2(api, user = true, config) {
  return new Promise((resolve, reject) => {
    let serverConfigJSON = getServerJSON();
    if (serverConfigJSON) {
      let apiUrl = parseURL(
        `${serverConfigJSON["domain"]}/api/${serverConfigJSON["version"]}${api}`
      );
      let query = apiUrl.query;
      if (!query) {
        query = "";
      }
      if (user) {
        let token = getToken();
        if (token) {
          query += `&private_token=${token}`;
        }
      } else {
        query += `&private_token=${serverConfigJSON["token"]}`;
      }
      apiUrl.set("query", query);
      let apiConfig = config || {
        method: "GET",
      };
      fetch(apiUrl.toString(), apiConfig)
        .then((response) => {
          return response.json();
        })
        .then((json) => {
          // console.log(`url = ${apiUrl.toString()}`);
          // console.log(json);
          // console.log(apiConfig);
          // console.log(
          //   "--------------------------------------------------------"
          // );
          resolve(json);
        })
        .catch((e) => {
          // console.log(`url = ${apiUrl.toString()}`);
          // console.log(apiConfig);
          // console.log(e);
          // console.log(
          //   "--------------------------------------------------------"
          // );
          reject(e);
        });
    } else {
      reject(new Error("服务配置错误"));
    }
  });
}
