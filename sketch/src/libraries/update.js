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

import {checkAllLocalLibraries} from "../server/update";
import {Component, Iconfont, Page, RelatedServerProject, Style,} from "../contants";
import {downloadLibrary} from "../server/downloads";
import * as md5 from "blueimp-md5";
import * as sketch from "sketch/dom";
import * as Settings from "sketch/settings";
import * as path from "@skpm/path";
import {getSelectedLibrary, getServerJSON} from "../server/server-helper";

let updateInterval;

export function registerUpdateIPC(context, webContents) {
  let serverConfig = getServerJSON();
  if (serverConfig) {
    setupCheckUpdateInterval(context, webContents);
    webContents.on("updateLibrary", (type, projectInfo) => {
      downloadLibrary(type, projectInfo.projectID)
        .then(async (data) => {
          let libraryInfo;
          if (type === Iconfont) {
            let relatedProject =
              Settings.settingForKey(RelatedServerProject) || {};
            relatedProject[data.libraryFolder] = {
              libraryType: type,
              projectID: projectInfo.projectID,
              libraryID: md5(projectInfo.projectID),
              lastModifiedAt: projectInfo.lastModifiedAt,
            };
            Settings.setSettingForKey(RelatedServerProject, relatedProject);
            libraryInfo = {
              ...projectInfo,
              libraryID: md5(projectInfo.projectID),
            };
          } else {
            let relatedProject =
              Settings.settingForKey(RelatedServerProject) || {};
            if (relatedProject[data.libraryFolder]) {
              let selectedLibrary = await getSelectedLibrary(type, projectInfo);
              if (selectedLibrary) {
                selectedLibrary.remove();
              }
            }
            let library = sketch.Library.getLibraryForDocumentAtPath(
              path.join(data.libraryFolder, data.fileName)
            );
            relatedProject[data.libraryFolder] = {
              libraryType: type,
              projectID: projectInfo.projectID,
              libraryID: String(library.id),
              lastModifiedAt: projectInfo.lastModifiedAt,
            };
            // console.log(relatedProject);
            Settings.setSettingForKey(RelatedServerProject, relatedProject);
            libraryInfo = {
              ...projectInfo,
              libraryID: String(library.id),
            };
          }
          webContents.executeJavaScript(
            `onDidUpdateLibrary(${JSON.stringify({
              type,
              libraryInfo,
            })})`
          );
        })
        .catch((error) => {
          console.log(error);
          webContents.executeJavaScript("onDidUpdateLibrary()");
        });
    });
  }
}

export function setupCheckUpdateInterval(context, webContents) {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
  updateInterval = setInterval(async () => {
    let needUpdateLibraries = await checkAllLocalLibraries(Component);
    needUpdateLibraries = needUpdateLibraries.concat(
      await checkAllLocalLibraries(Style)
    );
    needUpdateLibraries = needUpdateLibraries.concat(
      await checkAllLocalLibraries(Iconfont)
    );
    needUpdateLibraries = needUpdateLibraries.concat(
      await checkAllLocalLibraries(Page)
    );
    webContents.executeJavaScript(
      `onDidAutoCheckUpdates(${JSON.stringify({
        updateLibraries: needUpdateLibraries,
      })})`
    );
  }, 1000 * 60);
}
