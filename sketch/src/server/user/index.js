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

import * as Settings from "sketch/settings";
import { fetch2 } from "../fetch";
import { getToken, setToken } from "../../helper";

export function getCurrentUser() {
    return new Promise((resolve, reject) => {
        let savedUser = Settings.settingForKey("user-info");
        if (savedUser) {
            resolve(savedUser);
        } else {
            let token = getToken();
            if (token) {
                fetch2(`/user`, true)
                    .then((userInfo) => {
                        let user = {
                            nick: userInfo.name,
                            id: userInfo.id,
                            name: userInfo.username,
                            avatarUrl: userInfo["avatar_url"],
                            email: userInfo.email,
                            empId: userInfo.extern_uid
                        };
                        Settings.setSettingForKey("user-info", user);
                        resolve(user);
                    })
                    .catch((error) => {
                        reject(error);
                    });
            } else {
                reject(new Error("token非法"));
            }
        }
    });
}

export function removeUserInfo() {
    Settings.setSettingForKey("user-info", null);
}

export function isAccessProject(projectId) {
    return new Promise(async (resolve, reject) => {
        let user = await getCurrentUser();
        if (user) {
            fetch2(`/projects/${projectId}/members/${user.id}`)
                .then((user) => {
                    if (user.id) {
                        resolve();
                    } else {
                        reject(new Error("not found"));
                    }
                })
                .catch((error) => {
                    reject(error);
                });
        }
    });
}

export function addUserToProject(projectID, accessLevel = 30) {
    return new Promise(async (resolve, reject) => {
        let user = await getCurrentUser();
        if (user) {
            fetch2(`/projects/${projectID}/members`, false, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    user_id: user.id,
                    id: projectID,
                    access_level: accessLevel
                })
            })
                .then(() => {
                    resolve();
                })
                .catch((error) => {
                    reject(error);
                });
        } else {
            reject(new Error("请先填入Private Token"));
        }
    });
}

export function isTokenValid(token) {
    return new Promise((resolve, reject) => {
        setToken(token);
        fetch2(`/user`, true)
            .then((userInfo) => {
                if (userInfo && userInfo.id) {
                    resolve();
                } else {
                    setToken(null);
                    reject(new Error("token非法"));
                }
            })
            .catch((error) => {
                setToken(null);
                reject(error);
            });
    });
}

export function searchUser(keyword) {
    return new Promise((resolve, reject) => {
        fetch2(`/user?search=${keyword}`, true)
            .then((userInfo) => {
                if (userInfo && userInfo.id) {
                    resolve(userInfo);
                } else {
                    reject(new Error("查不到用户"));
                }
            })
            .catch((error) => {
                reject(error);
            });
    });
}
