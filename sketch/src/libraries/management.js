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

import { getOwnedProjectsByType, removeAllMembers, renameProject } from "../server/projects";
import * as Settings from "sketch/settings";
import { Component, Iconfont, OwnedLibraries, Page, Style, Token } from "../contants";
import { searchUser } from "../server/user";
import { getServerJSON } from "../server/server-helper";
import { logger } from "../logger";

export function onManagementDestroy() {
    Settings.setSettingForKey(OwnedLibraries, null);
}

export function registerManagementIPC(context, webContents) {
    webContents.on("searchUser", (keyWord) => {
        searchUser(keyWord)
            .then((user) => {})
            .catch((error) => {
                logger.log(error);
            });
    });
    webContents.on("renameLibrary", (libraryInfo, newLibraryName) => {
        let newDesc = { ...libraryInfo.desc };
        newDesc.libraryName = newLibraryName;
        renameProject(libraryInfo.projectID, newDesc)
            .then(() => {
                webContents.executeJavaScript(
                    `onDidRenameLibrary(${JSON.stringify({
                        success: true,
                    })})`
                );
            })
            .catch((error) => {
                webContents.executeJavaScript(
                    `onDidRenameLibrary(${JSON.stringify({
                        errorMessage: error.message,
                    })})`
                );
            });
    });
    webContents.on("removeServerLibrary", (libraryInfo) => {
        removeAllMembers(libraryInfo.projectID)
            .then(async () => {
                webContents.executeJavaScript(
                    `onDidRemoveServerLibrary(${JSON.stringify({
                        success: true,
                    })})`
                );
            })
            .catch((error) => {
                webContents.executeJavaScript(
                    `onDidRemoveServerLibrary(${JSON.stringify({
                        errorMessage: error.message,
                    })})`
                );
            });
    });

    webContents.on("getOwnedLibraries", async (forceReload) => {
        let libraries = [];
        let ownedLibraries = Settings.settingForKey(OwnedLibraries);
        if (ownedLibraries && !forceReload) {
            libraries = ownedLibraries;
        } else {
            libraries.push({
                name: "组件库",
                links: [],
                groupData: {
                    type: Component,
                },
            });
            libraries.push({
                name: "样式库",
                links: [],
                groupData: {
                    type: Style,
                },
            });
            libraries.push({
                name: "图标库",
                links: [],
                groupData: {
                    type: Iconfont,
                },
            });
            libraries.push({
                name: "页面库",
                links: [],
                groupData: {
                    type: Page,
                },
            });
            libraries.push({
                name: "Design Token库",
                links: [],
                groupData: {
                    type: Token,
                },
            });
            let serverConfig = getServerJSON();
            if (serverConfig) {
                try {
                    for (let i = 0; i < libraries.length; i++) {
                        let projects = await getOwnedProjectsByType(libraries[i].groupData.type);
                        for (let j = 0; projects && j < projects.length; j++) {
                            let project = projects[j];
                            libraries[i].links.push({
                                projectID: String(project.id),
                                private: project.private,
                                name: project.name,
                                lastModifiedAt: project.lastModifiedAt,
                                desc: project.desc,
                            });
                        }
                    }
                } catch (e) {
                    logger.log(e);
                }
                Settings.setSettingForKey(OwnedLibraries, libraries);
            }
        }
        webContents.executeJavaScript(
            `onDidGetOwnedLibraries(${JSON.stringify({
                libraries,
            })})`
        );
    });
}
