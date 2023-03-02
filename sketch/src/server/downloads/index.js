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

import * as cp from "@skpm/child_process";
import * as fs from "@skpm/fs";
import * as path from "@skpm/path";
import { getFileNameByType, getPathByType, getServerJSON } from "../server-helper";
import { getProjectByID } from "../projects";
import * as Console from "@skpm/console";
import { getToken } from "../../helper";
import { Iconfont, Token } from "../../contants";
import dayjs from "dayjs";

const console = Console();

export function downloadLibrary(type, projectId, toFolder) {
    return new Promise((resolve, reject) => {
        let dir;
        if (toFolder) {
            dir = toFolder;
        } else {
            dir = path.join(getPathByType(type), projectId);
        }

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        let token = getToken();
        let serverConfigJSON = getServerJSON();
        let fileName = getFileNameByType(type);
        if (serverConfigJSON) {
            const downloadSpawn = cp.spawn(
                "curl",
                [
                    "--request",
                    "GET",
                    "--header",
                    `'PRIVATE-TOKEN: ${token}'`,
                    `'${serverConfigJSON["domain"]}/api/${
                        serverConfigJSON["version"]
                    }/projects/${projectId}/repository/blobs/master?filepath=${encodeURIComponent(
                        `${fileName}`
                    )}'`,
                    ">",
                    fileName
                ],
                { cwd: dir, shell: "/bin/sh" }
            );

            downloadSpawn.on("close", async (code) => {
                if (code === 0) {
                    let projectInfo = await getProjectByID(projectId);
                    if (type === Iconfont) {
                        let subdirs = fs.readdirSync(dir);
                        subdirs &&
                        subdirs.forEach((subdir) => {
                            if (
                                fs.existsSync(path.join(dir, subdir)) &&
                                fs.statSync(path.join(dir, subdir)).isDirectory()
                            ) {
                                try {
                                    fs.rmdirSync(path.join(dir, subdir));
                                } catch (error) {
                                }
                            }
                        });

                        let zipPath = path.join(dir, fileName);
                        const unzip = cp.spawn("unzip", ["-o", zipPath], {
                            cwd: path.dirname(zipPath),
                            shell: "/bin/sh"
                        });
                        unzip.on("close", (code) => {
                            if (fs.existsSync(zipPath)) {
                                fs.unlinkSync(zipPath);
                            }
                            resolve({ libraryFolder: path.dirname(zipPath) });
                        });
                    } else if (type === Token) {
                        resolve({ libraryFolder: dir, fileName: fileName });
                    } else {
                        let newFileName = `${projectInfo.name}(${
                            projectInfo.desc.updateNick
                        },${dayjs
                            .unix(projectInfo.lastModifiedAt)
                            .format("YYYY-MM-DD HH:MM:ss")}).sketch`;
                        let targetPath = path.join(dir, newFileName);
                        fs.renameSync(path.join(dir, fileName), targetPath);
                        resolve({ libraryFolder: dir, fileName: newFileName });
                    }
                } else {
                    reject(new Error("下载失败"));
                }
            });
        }
    });
}
