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

import * as Console from "@skpm/console";
import { getToken, setToken } from "../helper";
import { isTokenValid } from "./user";
import { getServerJSON, initServerJSON } from "./server-helper";


export function registerServerIPC(context, webContents) {
    initServerJSON(context);
    let serverConfig = getServerJSON();
    if (serverConfig) {
        webContents.on("getServerDomain", () => {
            webContents.executeJavaScript(
                `onDidGetServerDomain(${JSON.stringify({
                    domain: serverConfig["domain"]
                })})`
            );
        });
        webContents.on("setUserPrivateToken", (token) => {
            isTokenValid(token)
                .then(() => {
                    webContents.executeJavaScript(
                        `onDidSetUserPrivateToken(${JSON.stringify({ success: true })})`
                    );
                })
                .catch((error) => {
                    webContents.executeJavaScript(
                        `onDidSetUserPrivateToken(${JSON.stringify({ success: false })})`
                    );
                });
        });
        webContents.on("getUserPrivateToken", () => {
            let token = getToken();
            webContents.executeJavaScript(
                `onDidGetUserPrivateToken(${JSON.stringify({
                    isValid: !!token
                })})`
            );
        });
    } else {
        setToken(null);
    }
}
