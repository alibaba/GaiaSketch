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

import { getRootDir } from "../helper";
import * as path from "@skpm/path";
import * as fs from "@skpm/fs";
import { getOwnedProjectsByType, getProjectByID } from "./projects";
import dayjs from "dayjs";
import * as Settings from "sketch/settings";
import * as sketch from "sketch/dom";
import * as Console from "@skpm/console";
import { Iconfont, RelatedServerProject, ServerConfigJSON, Token } from "../contants";
import { fetch2 } from "./fetch";
import { getCurrentUser } from "./user";
import { logger } from "../logger";
export function getPathByType(type) {
    let typePath = path.join(getRootDir(), type);
    if (!fs.existsSync(typePath)) {
        fs.mkdirSync(typePath);
    }
    return typePath;
}

export function getFileNameByType(type) {
    let fileName = `index.sketch`;
    if (type === Iconfont) {
        fileName = `index.zip`;
    } else if (type === Token) {
        fileName = `index.xlsx`;
    }
    return fileName;
}

export function requestProjects(type) {
    return new Promise(async (resolve, reject) => {
        let libraries = [];
        let projects = [];
        let serverConfig = getServerJSON();
        if (serverConfig) {
            projects = (await getOwnedProjectsByType(type)) || [];
        }
        if (type === Token) {
        } else if (type === Iconfont) {
            let dirs = fs.readdirSync(getPathByType(Iconfont));
            for (let i = 0; i < dirs.length; i++) {
                let dir = path.join(getPathByType(Iconfont), dirs[i]);
                let relatedProject = Settings.settingForKey(RelatedServerProject) || {};
                let relatedProjectInfo = relatedProject[dir];
                if (relatedProjectInfo) {
                    if (relatedProjectInfo["libraryType"] === type) {
                        for (let j = 0; j < projects.length; j++) {
                            let project = projects[j];
                            if (project.id === relatedProjectInfo["projectID"]) {
                                libraries.push({
                                    libraryID: relatedProjectInfo["libraryID"],
                                    projectID: String(project.id),
                                    private: project.private,
                                    type: "Server",
                                    name: project.name,
                                    lastModifiedAt: project.lastModifiedAt,
                                    path: path.join(getPathByType(Iconfont), String(project.id)),
                                    desc: project.desc,
                                });
                                break;
                            }
                        }
                    }
                }
            }
            let localIconfonts = getLocalIconfonts() || [];
            libraries = libraries.concat(localIconfonts);
        } else {
            let sketchLibraries = getAllSketchLibraries();
            for (let i = 0; i < sketchLibraries.length; i++) {
                let sketchLibrary = sketchLibraries[i];
                let libDocument = sketchLibrary.getDocument();
                // logger.log(
                //   `sketch library ${sketchLibrary.name} id = ${libDocument.id}`
                // );
                let relatedProject = Settings.settingForKey(RelatedServerProject) || {};
                let relatedProjectInfo = relatedProject[path.dirname(decodeURIComponent(libDocument.path))];
                if (relatedProjectInfo) {
                    if (relatedProjectInfo["libraryType"] === type) {
                        for (let j = 0; j < projects.length; j++) {
                            let project = projects[j];
                            if (project.id === relatedProjectInfo["projectID"]) {
                                libraries.push({
                                    disabled: !sketchLibrary.enabled || !sketchLibrary.valid,
                                    libraryID: String(libDocument.id),
                                    projectID: String(project.id),
                                    private: project.private,
                                    type: "Server",
                                    name: project.name,
                                    lastModifiedAt: project.lastModifiedAt,
                                    desc: project.desc,
                                });
                            }
                        }
                    }
                } else {
                    libraries.push({
                        disabled: !sketchLibrary.enabled || !sketchLibrary.valid,
                        libraryID: String(libDocument.id),
                        type: "Local",
                        name: sketchLibrary.name,
                        lastModifiedAt: dayjs(sketchLibrary.lastModifiedAt).unix(),
                    });
                }
            }
        }
        for (let i = 0; i < projects.length; i++) {
            let project = projects[i];
            let found = false;
            for (let j = 0; j < libraries.length; j++) {
                if (libraries[j].type === "Server" && libraries[j].projectID === project.id) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                libraries.push({
                    projectID: project.id,
                    type: "Server",
                    private: project.private,
                    name: project.desc.libraryName,
                    lastModifiedAt: project.lastModifiedAt,
                    desc: project.desc,
                });
            }
        }
        // logger.log(libraries);
        Settings.setSettingForKey(`${type}-libraries`, libraries);
        resolve(libraries);
    });
}

export function getSelectedLibrary(type, libraryInfo) {
    return new Promise((resolve, reject) => {
        let selectedLibrary;
        let libraries = getAllSketchLibraries();
        for (let i = 0; libraries && i < libraries.length; i++) {
            let library = libraries[i];
            if (library.id === libraryInfo.libraryID) {
                let libDocument = library.getDocument();
                let relatedProject = Settings.settingForKey(RelatedServerProject) || {};
                let relatedProjectInfo = relatedProject[path.dirname(decodeURIComponent(libDocument.path))];
                if (relatedProjectInfo) {
                    if (
                        (relatedProjectInfo["projectID"] === libraryInfo.projectID &&
                            relatedProjectInfo["libraryType"]) === type
                    ) {
                        selectedLibrary = library;
                        break;
                    }
                } else {
                    if (library.name === libraryInfo.name) {
                        selectedLibrary = library;
                        break;
                    }
                }
            }
        }

        if (selectedLibrary) {
            resolve(selectedLibrary);
        } else {
            reject(new Error("找不到库"));
        }
    });
}

export function getLatestSelectedLibrary(type) {
    return Settings.settingForKey(`latest-selected-${type}-library`);
}

export function setLatestSelectedLibrary(type, libraryInfo) {
    Settings.setSettingForKey(`latest-selected-${type}-library`, libraryInfo);
}

export function getLocalIconfonts() {
    return Settings.settingForKey("local-iconfonts");
}

export function setLocalIconfonts(libraryInfo) {
    let locals = getLocalIconfonts() || [];
    let alreadyExists = false;
    for (let i = 0; i < locals.length; i++) {
        if (locals["libraryID"] === libraryInfo.libraryID) {
            locals.splice(i, 1, libraryInfo);
            alreadyExists = true;
            break;
        }
    }
    if (!alreadyExists) {
        locals.unshift(libraryInfo);
    }
    Settings.setSettingForKey("local-iconfonts", locals);
}

export function deleteLocalIconfonts(libraryInfo) {
    let locals = getLocalIconfonts() || [];
    for (let i = 0; i < locals.length; i++) {
        if (locals[i]["libraryID"] === libraryInfo.libraryID) {
            locals.splice(i, 1);
            try {
                fs.rmdirSync(libraryInfo.path);
            } catch (error) {}
            break;
        }
    }
    Settings.setSettingForKey("local-iconfonts", locals);
}

export function getAllSketchLibraries() {
    let libraries = [];
    let sketchLibraries = sketch.Library.getLibraries() || [];
    for (let i = 0; i < sketchLibraries.length; i++) {
        let sketchLibrary = sketchLibraries[i];
        if (sketchLibrary.valid) {
            libraries.push(sketchLibrary);
        }
    }
    return libraries;
}

export function buildDescription(info) {
    return new Promise(async (resolve, reject) => {
        let desc;
        if (info.type === Token) {
            desc = info.libraryName;
        } else {
            let userInfo = await getCurrentUser();
            desc = {
                updateUsername: userInfo.name,
                updateNick: userInfo.nick,
                updateUID: userInfo.id,
                updateExternUID: userInfo.empId,
                libraryName: info.libraryName,
                updateTime: `${dayjs().unix()}`,
                supportVersion: sketch.version.sketch.replace("'", ""),
            };
        }
        resolve(desc);
    });
}

export function updateProjectDescription(info, newDesc) {
    return new Promise(async (resolve, reject) => {
        let projectInfo = await getProjectByID(info.projectID);
        if (projectInfo) {
            let updateDesc;
            let newDesString;
            if (newDesc) {
                if (typeof newDesc == "string") {
                    newDesString = newDesc;
                } else {
                    newDesString = JSON.stringify(newDesc);
                }
            }
            if (typeof projectInfo.desc == "string") {
                updateDesc = newDesString || projectInfo.desc;
            } else {
                updateDesc = newDesString;
                if (!updateDesc) {
                    let desc = await buildDescription(info);
                    if (typeof desc == "string") {
                        updateDesc = desc;
                    } else {
                        updateDesc = JSON.stringify(desc);
                    }
                }
            }
            fetch2(`/projects/${info.projectID}`, true, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: info.projectID,
                    description: updateDesc,
                }),
            })
                .then(() => {
                    resolve();
                })
                .catch((error) => {
                    reject(error);
                });
        }
    });
}

export function initServerJSON(context) {
    const resourcesPath = context.plugin.urlForResourceNamed("").path();
    let configPath = path.join(resourcesPath, ServerConfigJSON);
    let exist = false;
    if (fs.existsSync(configPath)) {
        let serverConfig;
        try {
            serverConfig = JSON.parse(fs.readFileSync(configPath, { encoding: "utf8" }));
            if (Object.keys(serverConfig).length > 0) {
                setServerJSON(serverConfig);
                exist = true;
            }
        } catch (err) {
            console.error("read server.config.json error!!!");
        }
    }
    if (!exist) {
        setServerJSON(null);
    }
    return exist;
}

export function getServerJSON() {
    return Settings.settingForKey(ServerConfigJSON);
}

export function setServerJSON(serverConfig) {
    Settings.setSettingForKey(ServerConfigJSON, serverConfig);
}

export function getRefreshIntervalByType(type) {
    let serverJSON = getServerJSON();
    let interval = -1;
    if (serverJSON && serverJSON["groups"]) {
        for (let i = 0; i < serverJSON["groups"].length; i++) {
            let group = serverJSON["groups"][i];
            if (group.type === type) {
                if (group.interval !== undefined) {
                    interval = Number(group.interval);
                    break;
                }
            }
        }
    }
    return interval;
}

export function getServerNameByType(type) {
    let serverJSON = getServerJSON();
    let name;
    if (serverJSON && serverJSON["groups"]) {
        for (let i = 0; i < serverJSON["groups"].length; i++) {
            let group = serverJSON["groups"][i];
            if (group.type === type) {
                name = group.name;
                break;
            }
        }
    }
    return name;
}
