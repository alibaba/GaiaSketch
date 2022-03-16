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

import {getGroupByName, getGroupNameByType} from "../groups";
import * as Console from "@skpm/console";
import {fetch2} from "../fetch";
import {isAccessProject} from "../user";
import dayjs from "dayjs";
import {updateProjectDescription} from "../server-helper";

const console = Console();

export function getAllProjectsByType(type) {
  return new Promise(async (resolve, reject) => {
    let groupName = await getGroupNameByType(type);
    if (groupName) {
      let group = await getGroupByName(groupName);
      let projects = await getAllProjectsByGroupID(group.id);
      if (projects) {
        resolve(projects);
      } else {
        reject(new Error("获取库列表失败"));
      }
    } else {
      reject(new Error("找不到库"));
    }
  });
}

export function getAllProjectsByGroupID(groupID) {
  return new Promise((resolve, reject) => {
    fetch2(`/groups/${groupID}/projects?order_by=updated_at`, false)
      .then((projects) => {
        let results = [];
        for (let i = 0; projects && i < projects.length; i++) {
          let project = projects[i];
          if (!project.archived) {
            results.push(buildProjectInfo(project));
          }
        }
        resolve(results);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export function getOwnedProjectsByType(type) {
  return new Promise((resolve, reject) => {
    getAllProjectsByType(type)
      .then((projects) => {
        let promiseArray = [];
        let result = [];
        projects.forEach((projectInfo) => {
          if (!projectInfo.private) {
            result.push(projectInfo);
          } else {
            promiseArray.push(
              isAccessProject(projectInfo.id)
                .then(() => {
                  result.push(projectInfo);
                })
                .catch((error) => {})
            );
          }
        });
        Promise.all(promiseArray).then(() => {
          result.sort(function (a, b) {
            if (a.lastModifiedAt > b.lastModifiedAt) {
              return -1;
            }
            if (a.lastModifiedAt < b.lastModifiedAt) {
              return 1;
            }
            return 0;
          });
          resolve(result);
        });
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export function getProjectByID(projectId) {
  return new Promise((resolve, reject) => {
    fetch2(`/projects/${projectId}`)
      .then((projectInfo) => {
        resolve(buildProjectInfo(projectInfo));
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export function buildProjectInfo(project) {
  let desc;
  try {
    desc = JSON.parse(project.description);
  } catch (e) {
    desc = {
      libraryName: project.description,
      lastModifiedAt: dayjs(project.updated_at).unix(),
    };
  }
  return {
    id: String(project.id),
    name: desc && desc.libraryName,
    private: project.visibility_level === 0,
    lastModifiedAt: desc && desc.lastModifiedAt,
    desc,
  };
}

export function renameProject(projectID, newDesc) {
  return new Promise((resolve, reject) => {
    updateProjectDescription(
      {
        projectID,
      },
      newDesc
    )
      .then(() => {
        resolve();
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export function getAllMembers(projectID) {
  return new Promise((resolve, reject) => {
    fetch2(`/projects/${projectID}/members`)
      .then((users) => {
        resolve(users);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export function removeAllMembers(projectID) {
  return new Promise((resolve, reject) => {
    fetch2(`/projects/${projectID}/members`)
      .then((users) => {
        let promiseArray = [];
        for (let i = 0; i < users.length; i++) {
          promiseArray.push(
            removeUser(projectID, users[i].id)
              .then(() => {})
              .catch((error) => {})
          );
        }
        Promise.all(promiseArray)
          .then(() => {
            resolve();
          })
          .catch((error) => {
            reject(error);
          });
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export function removeUser(projectID, userID) {
  return new Promise((resolve, reject) => {
    fetch2(`/projects/${projectID}/members/${userID}`, true, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: projectID,
        user_id: userID,
      }),
    })
      .then(() => {
        resolve();
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export function archiveProject(projectID) {
  return new Promise((resolve, reject) => {
    fetch2(`/projects/${projectID}/archive`, true, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: projectID,
      }),
    })
      .then(() => {
        resolve();
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export function removeServerProject() {
  return new Promise((resolve, reject) => {});
}
