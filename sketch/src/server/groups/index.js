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

import {fetch2} from "../fetch";
import {getServerNameByType} from "../server-helper";

export function getGroupByName(name) {
  return new Promise((resolve, reject) => {
    fetch2(`/groups?search=${name}`, false)
      .then((groups) => {
        for (let i = 0; groups && i < groups.length; i++) {
          let group = groups[i];
          if (group.name === name) {
            resolve({
              id: group.id,
              name: group.name,
              path: group.path,
              desc: group.description,
            });
            return;
          }
        }
        resolve();
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export function getGroupNameByType(type) {
  return new Promise((resolve, reject) => {
    let groupName = getServerNameByType(type);
    if (groupName) {
      resolve(groupName);
    } else {
      reject(new Error("找不到配置的库"));
    }
  });
}

export function getGroupIDByType(type) {
  return new Promise(async (resolve, reject) => {
    let groupName = getServerNameByType(type);
    if (groupName) {
      let group = await getGroupByName(groupName);
      if (group) {
        resolve(group.id);
      } else {
        reject(new Error("找不到Group"));
      }
    } else {
      reject(new Error("找不到配置的库"));
    }
  });
}
