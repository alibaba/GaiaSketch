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

import {
    Checkbox,
    Dialog,
    DialogFooter,
    DialogType,
    Dropdown,
    getTheme,
    Icon,
    IDropdownOption,
    Link,
    PrimaryButton,
    ResponsiveMode,
    Spinner,
    SpinnerSize,
    Stack,
    Text,
    TextField
} from "@fluentui/react";
import React, { useEffect, useState } from "react";
import { BarType } from "../../constants";

const theme = getTheme();

declare var window: any;

interface IUploadProps {
}

export function Upload(props: IUploadProps) {
    const [libraryOptions, setLibraryOptions] = useState<any>([]);
    const [filePath, setFilePath] = useState();
    const [libraryType, setLibraryType] = useState<any>();
    const [libraryInfo, setLibraryInfo] = useState<any>();
    const [showAddTextField, setShowAddTextField] = useState(false);
    const [newLibraryName, setNewLibraryName] = useState<any>();
    const [uploading, setUploading] = useState(false);
    const [isPrivate, setIsPrivate] = useState(false);
    const [showErrorMessage, setShowErrorMessage] = useState<any>(null);
    const [showSuccessMessage, setShowSuccessMessage] = useState<any>(null);

    useEffect(() => {
        function getOptions(data: any) {
            let remoteLibraries = [];
            for (let i = 0; data.libraries && i < data.libraries.length; i++) {
                let library = data.libraries[i];
                if (library.type == "Server") {
                    let disable = !(library.enabled && library.valid);
                    remoteLibraries.push({
                        key: (library.libraryID || library.projectID) + library.name,
                        text: library.name,
                        data: { icon: `${library.private ? "Lock" : null}` },
                        disable,
                        metaInfo: library
                    });
                }
            }
            return remoteLibraries;
        }

        window.onDidGetComponentLibraries = (data: any) => {
            setLibraryOptions(getOptions(data));
        };
        window.onDidGetStyleLibraries = (data: any) => {
            setLibraryOptions(getOptions(data));
        };
        window.onDidGetIconfontLibraries = (data: any) => {
            setLibraryOptions(getOptions(data));
        };
        window.onDidGetPageLibraries = (data: any) => {
            setLibraryOptions(getOptions(data));
        };
        window.onDidGetTokenLibraries = (data: any) => {
            setLibraryOptions(getOptions(data));
        };
    });

    useEffect(() => {
        window.onDidSelectUploadLibrary = (data: any) => {
            setFilePath(data.filePath);
        };
    });

    useEffect(() => {
        window.onDidUpload = (data: any) => {
            setUploading(false);
            if (data && data.success) {
                setShowErrorMessage(null);
                setShowSuccessMessage("上传成功！");
            } else {
                setShowSuccessMessage(null);
                setShowErrorMessage(data.errorMessage || "上传失败，请重试！");
            }
        };
    });

    return (
        <Stack
            styles={{
                root: {
                    margin: 8,
                    marginTop: "35px",
                    height: "100%"
                }
            }}
            tokens={{ childrenGap: 10 }}
        >
            <Stack
                styles={{
                    root: {
                        padding: 5,
                        border: `1px dashed ${theme.palette.whiteTranslucent40}`,
                        borderRadius: theme.effects.roundedCorner4
                    }
                }}
                tokens={{ childrenGap: 10 }}
            >
                <Text styles={{ root: { fontSize: 20 } }}>上传</Text>
                <Stack tokens={{ childrenGap: 12 }}>
                    <Dropdown
                        placeholder="请选择上传的库的类型..."
                        label="库类型"
                        responsiveMode={ResponsiveMode.unknown}
                        options={[
                            { key: "Component", text: "组件库（.sketch）" },
                            { key: "Style", text: "样式库（.sketch）" },
                            { key: "Iconfont", text: "图标库（Directory）" },
                            { key: "Page", text: "页面库（.sketch）" },
                            { key: "Token", text: "Design Token（.xlsx）" }
                        ]}
                        onChange={(event: any, option?: IDropdownOption) => {
                            if (option) {
                                setLibraryType(option.key);
                                window.postMessage(`get${option.key}Libraries`);
                            }
                        }}
                    />
                    <Stack tokens={{ childrenGap: 3 }}>
                        <Dropdown
                            disabled={!libraryType || showAddTextField}
                            placeholder="请选择库..."
                            label="库名称"
                            responsiveMode={ResponsiveMode.unknown}
                            options={libraryOptions}
                            onRenderOption={(option: any) => {
                                return (
                                    <div
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            display: "flex",
                                            alignItems: "center"
                                        }}
                                    >
                                        {option.data && option.data.icon && (
                                            <div style={{ width: "20px" }}>
                                                <Icon
                                                    style={{ marginRight: "8px" }}
                                                    iconName={option.data.icon}
                                                    title={option.data.icon}
                                                />
                                            </div>
                                        )}
                                        <Text>{option.text}</Text>
                                    </div>
                                );
                            }}
                            onChange={(event: any, option?: IDropdownOption | any) => {
                                if (option) {
                                    setLibraryInfo(option);
                                    if (option.metaInfo) {
                                        setIsPrivate(option.metaInfo.private);
                                    }
                                }
                            }}
                        />
                        <Link
                            styles={{ root: { fontSize: 12 } }}
                            onClick={() => {
                                setShowAddTextField(!showAddTextField);
                            }}
                        >
                            是否要新增库? 请点击此处新增
                        </Link>
                    </Stack>
                    {showAddTextField ? (
                        <TextField
                            label={"库名称"}
                            disabled={!libraryType}
                            placeholder={"请输入新增的库的名称"}
                            onChange={(event: any, newValue?: string) => {
                                setNewLibraryName(newValue);
                            }}
                        />
                    ) : null}
                    <TextField
                        label={"选择文件"}
                        value={filePath}
                        disabled={!libraryType}
                        placeholder={"点击选择要上传的文件"}
                        onClick={() => {
                            let fileType = "sketch";
                            if (libraryType === "Iconfont") {
                                fileType = "zip";
                            } else if (libraryType === "Token") {
                                fileType = "xlsx";
                            }
                            window.postMessage("selectUploadLibrary", fileType);
                        }}
                    />
                    <Checkbox
                        label="私有"
                        checked={isPrivate}
                        onChange={(event: any, checked?: boolean) => {
                            setIsPrivate(!!checked);
                        }}
                    />
                    <PrimaryButton
                        text={"立即上传"}
                        disabled={!libraryType || !filePath || uploading}
                        onClick={() => {
                            setUploading(true);
                            if (!showAddTextField && libraryInfo) {
                                window.postMessage("upload", {
                                    projectID: libraryInfo.metaInfo.projectID,
                                    libraryName: libraryInfo.metaInfo.name,
                                    filePath,
                                    type: getBarType(libraryType),
                                    isPrivate
                                });
                            } else if (showAddTextField && newLibraryName) {
                                window.postMessage("upload", {
                                    libraryName: newLibraryName,
                                    filePath,
                                    type: getBarType(libraryType),
                                    isPrivate
                                });
                            }
                        }}
                    >
                        {uploading ? (
                            <Spinner
                                size={SpinnerSize.xSmall}
                                styles={{
                                    root: {
                                        position: "absolute",
                                        right: 70
                                    }
                                }}
                            />
                        ) : null}
                    </PrimaryButton>
                </Stack>
            </Stack>
            {showSuccessMessage && showSuccessMessage.length > 0 ? (
                <Dialog
                    hidden={false}
                    onDismiss={() => {
                        setShowSuccessMessage(null);
                    }}
                    dialogContentProps={{
                        type: DialogType.normal,
                        title: "上传成功",
                        subText: showSuccessMessage
                    }}
                    modalProps={{
                        isBlocking: true
                    }}
                >
                    <DialogFooter>
                        <PrimaryButton
                            onClick={() => {
                                setShowSuccessMessage(null);
                            }}
                            text="OK"
                        />
                    </DialogFooter>
                </Dialog>
            ) : null}
            {showErrorMessage && showErrorMessage.length > 0 ? (
                <Dialog
                    hidden={false}
                    onDismiss={() => {
                        setShowErrorMessage(null);
                    }}
                    dialogContentProps={{
                        type: DialogType.normal,
                        title: "上传失败",
                        subText: showErrorMessage
                    }}
                    modalProps={{
                        isBlocking: true
                    }}
                >
                    <DialogFooter>
                        <PrimaryButton
                            onClick={() => {
                                setShowErrorMessage(null);
                            }}
                            text="OK"
                        />
                    </DialogFooter>
                </Dialog>
            ) : null}
        </Stack>
    );
}

function getBarType(type: string) {
    if (type === "Component") {
        return BarType.Component;
    } else if (type === "Iconfont") {
        return BarType.Iconfont;
    } else if (type === "Style") {
        return BarType.Style;
    } else if (type == "Page") {
        return BarType.Page;
    } else if (type == "Token") {
        return BarType.Token;
    }
}
