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

import dialog from "@skpm/dialog";
import {updateLibrary} from "../server/upload";

export function registerUploadIPC(context, webContents) {
  webContents.on("selectUploadLibrary", (fileType) => {
    let filters = [];
    if (fileType === "sketch") {
      filters.push({ name: "Sketch", extensions: ["sketch"] });
    } else if (fileType === "zip") {
      filters.push({ name: "Iconfont", extensions: ["zip"] });
    } else if (fileType === "xlsx") {
      filters.push({ name: "Excel", extensions: ["xlsx"] });
    }
    dialog
      .showOpenDialog({
        filters,
        title: "请选择要上传的文件",
        properties: ["openFile", "openDirectory"],
      })
      .then(({ canceled, filePaths }) => {
        if (!canceled && filePaths && filePaths.length > 0) {
          let filePath = filePaths[0];
          webContents.executeJavaScript(
            `onDidSelectUploadLibrary(${JSON.stringify({ filePath })})`
          );
        }
      });
  });
  webContents.on("upload", (info) => {
    updateLibrary(info)
      .then(() => {
        webContents.executeJavaScript(
          `onDidUpload(${JSON.stringify({ success: true })})`
        );
      })
      .catch((error) => {
        webContents.executeJavaScript(
          `onDidUpload(${JSON.stringify({ errorMessage: "上传失败" })})`
        );
      });
  });
}
