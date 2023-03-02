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
import { fetch2 } from "../fetch";
import * as md5 from "blueimp-md5";
import dayjs from "dayjs";
import { Iconfont } from "../../contants";
import * as path from "@skpm/path";
import * as cp from "@skpm/child_process";
import { getGroupIDByType } from "../groups";
import { addUserToProject } from "../user";
import { buildDescription, getFileNameByType, updateProjectDescription } from "../server-helper";

export function createNewRepository(info) {
    return new Promise((resolve, reject) => {
        let branchName = md5(String(dayjs().valueOf()));
        fetch2(`/projects/${info.projectID}/repository/branches`, true, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                branch_name: branchName,
                id: info.projectID,
                ref: "master"
            })
        })
            .then(() => {
                resolve(branchName);
            })
            .catch((error) => {
                reject(error);
            });
    });
}

export function updateLibrary(info) {
    return new Promise(async (resolve, reject) => {
        let newInfo = { ...info };
        if (fs.existsSync(info.filePath)) {
            if (!info.projectID) {
                let projectID = await createLibrary(info);
                if (projectID) {
                    newInfo.projectID = projectID;
                } else {
                    reject(new Error("创建库失败"));
                }
            }
            createNewRepository(newInfo)
                .then((newBranch) => {
                    newInfo.branchName = newBranch;
                    zipFile(newInfo.type, newInfo.filePath, (newPath) => {
                        newInfo.filePath = newPath;
                        doUpload(newInfo)
                            .then(() => {
                                resolve();
                            })
                            .catch((error) => {
                                reject(new Error("上传失败"));
                            });
                    });
                })
                .catch((error) => {
                    reject(error);
                });
        }
    });
}

export function doUpload(info) {
    return new Promise((resolve, reject) => {
        let base64String = fs.readFileSync(info.filePath, { encoding: "base64" });
        fetch2(`/projects/${info.projectID}/repository/files`, true, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                branch_name: info.branchName,
                content: base64String,
                commit_message: "update",
                encoding: "base64",
                file_path: getFileNameByType(info.type)
            })
        })
            .then(() => {
                if (info.type === Iconfont && path.extname(info.filePath) === ".zip") {
                    fs.unlinkSync(info.filePath);
                }
                createMergeRequest(info, info.branchName, "master").then((res) => {
                    acceptMergeRequest(info, res)
                        .then(() => {
                            resolve();
                        })
                        .catch((error) => {
                            reject(error);
                        });
                });
            })
            .catch((error) => {
                reject(error);
            });
    });
}

export function createLibrary(info) {
    return new Promise(async (resolve, reject) => {
        let projectName = md5(String(dayjs().valueOf()));
        fetch2(`/projects`, true, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: projectName,
                namespace_id: await getGroupIDByType(info.type),
                visibility_level: `${info.isPrivate ? 0 : 10}`
            })
        })
            .then((response) => {
                uploadGiKeep(response.id)
                    .then(() => {
                        addUserToProject(response.id, 40)
                            .then(() => {
                                resolve(response.id);
                            })
                            .catch((error) => {
                                reject(error);
                            });
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

function zipFile(type, filepath, callback) {
    if (type === Iconfont) {
        const newPath = path.join(filepath, "gaia-iconfont.zip");
        if (fs.existsSync(newPath)) {
            try {
                fs.rmdirSync(newPath);
            } catch (error) {
            }
        }
        const zip = cp.spawn("zip", ["-r", "gaia-iconfont.zip", "*"], {
            cwd: filepath.replace(" ", " "),
            shell: "/bin/sh"
        });
        zip.on("close", () => {
            callback(newPath);
        });
    } else {
        callback(filepath);
    }
}

function uploadGiKeep(projectID) {
    return new Promise((resolve, reject) => {
        fetch2(`/projects/${projectID}/repository/files`, true, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                branch_name: "master",
                content: "Empty~",
                commit_message: "init",
                file_path: ".gitkeep"
            })
        })
            .then(() => {
                resolve();
            })
            .catch((error) => {
                reject(error);
            });
    });
}

function createMergeRequest(info, fromBranch, toBranch) {
    return new Promise(async (resolve, reject) => {
        fetch2(`/projects/${info.projectID}/merge_requests`, true, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: info.projectID,
                source_branch: fromBranch,
                target_branch: toBranch,
                title: "merge request",
                remove_source_branch: "1",
                description: await buildDescription(info)
            })
        })
            .then((res) => {
                resolve(res);
            })
            .catch((error) => {
                reject(error);
            });
    });
}

function acceptMergeRequest(info, mergeRequest) {
    return new Promise((resolve, reject) => {
        fetch2(
            `/projects/${mergeRequest.project_id}/merge_request/${mergeRequest.id}/merge`,
            true,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    merge_request_id: `${mergeRequest.id}`,
                    id: mergeRequest.project_id,
                    should_remove_source_branch: "1"
                })
            }
        )
            .then(() => {
                updateProjectDescription(info)
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
