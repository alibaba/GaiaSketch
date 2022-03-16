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

import * as fs from "@skpm/fs";
import * as path from "@skpm/path";
import * as Settings from "sketch/settings";
import {Iconfont, RelatedServerProject} from "../../contants";
import {getAllSketchLibraries, getPathByType} from "../server-helper";

export function checkAllLocalLibraries(type) {
  return new Promise((resolve, reject) => {
    let needUpdateLibraries = [];
    if (type === Iconfont) {
      let dirs = fs.readdirSync(getPathByType(Iconfont));
      let projects = Settings.settingForKey(`${type}-libraries`);
      if (projects && dirs) {
        for (let i = 0; i < dirs.length; i++) {
          let dir = path.join(getPathByType(Iconfont), dirs[i]);
          let relatedProject =
            Settings.settingForKey(RelatedServerProject) || {};
          let relatedProjectInfo = relatedProject[dir];
          if (relatedProjectInfo) {
            if (relatedProjectInfo["libraryType"] === type) {
              for (let j = 0; j < projects.length; j++) {
                let project = projects[j];
                if (project.projectID === relatedProjectInfo["projectID"]) {
                  if (
                    project.lastModifiedAt !==
                    relatedProjectInfo["lastModifiedAt"]
                  ) {
                    needUpdateLibraries.push(project);
                  }
                  break;
                }
              }
            }
          }
        }
        resolve(needUpdateLibraries);
      } else {
        resolve([]);
      }
    } else {
      let libraries = getAllSketchLibraries();
      let projects = Settings.settingForKey(`${type}-libraries`);
      if (libraries && projects) {
        for (let i = 0; libraries && i < libraries.length; i++) {
          let library = libraries[i];
          let libDocument = library.getDocument();
          let relatedProject =
            Settings.settingForKey(RelatedServerProject) || {};
          let relatedProjectInfo =
            relatedProject[path.dirname(decodeURIComponent(libDocument.path))];
          if (relatedProjectInfo) {
            for (let j = 0; j < projects.length; j++) {
              let project = projects[j];
              if (relatedProjectInfo["projectID"] === project.projectID) {
                if (
                  project.lastModifiedAt !==
                  relatedProjectInfo["lastModifiedAt"]
                ) {
                  needUpdateLibraries.push(project);
                }
                break;
              }
            }
          }
        }
        resolve(needUpdateLibraries);
      } else {
        resolve([]);
      }
    }
  });
}

export function checkUpdate(type, projectID) {}
