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
    DirectionalHint,
    Dropdown,
    DropdownMenuItemType,
    FontWeights,
    getTheme,
    HighContrastSelector,
    IButtonStyles,
    Icon,
    IconButton,
    IDropdownOption,
    IIconProps,
    Image,
    ImageFit,
    INavLink,
    mergeStyleSets,
    Nav,
    ResponsiveMode,
    Spinner,
    SpinnerSize,
    Stack,
    Text
} from "@fluentui/react";
import React, { useEffect, useState } from "react";
import { Empty } from "../empty";
import { BarType } from "../../constants";

declare var window: any;

const theme = getTheme();

interface IComponentProps {
}

export function Component(props: IComponentProps) {
    const [loading, setLoading] = useState(false);
    const [options, setOptions] = useState<any>([]);
    const [areaContent, setAreaContent] = useState<any>(null);
    const [selectedLibraryInfo, setSelectedLibraryInfo] = useState<any>(null);
    const [needUpdateLibraries, setNeedUpdateLibraries] = useState<any>([]);
    const [forceReload, setForceReload] = useState(false);

    useEffect(() => {
        window.onDidAutoCheckUpdates = (data: any) => {
            if (data && data.updateLibraries && selectedLibraryInfo) {
                let libraries = [];
                for (let i = 0; i < data.updateLibraries.length; i++) {
                    let library = data.updateLibraries[i];
                    if (library.projectID === selectedLibraryInfo.projectID) {
                        libraries.push(library);
                    }
                }
                setNeedUpdateLibraries(libraries);
            } else {
                setNeedUpdateLibraries([]);
            }
        };
    });

    useEffect(() => {
        window.onDidDeleteComponents = () => {
            setSelectedLibraryInfo(null);
            setAreaContent(null);
            setOptions([]);
            setLoading(true);
            setTimeout(() => {
                window.postMessage("getComponentLibraries", true);
            }, 200);
        };
        window.onDidGetComponentLibraries = (data: any) => {
            if (data) {
                let localLibraries: any = [];
                let remoteLibraries: any = [];
                for (let i = 0; data.libraries && i < data.libraries.length; i++) {
                    let library = data.libraries[i];
                    let currentLibraries;
                    if (library.type == "Local") {
                        currentLibraries = localLibraries;
                    } else if (library.type == "Server") {
                        currentLibraries = remoteLibraries;
                    }
                    let disable = !(library.enabled && library.valid);
                    currentLibraries.push({
                        key: (library.libraryID || library.projectID) + library.name,
                        text: library.name,
                        data: { icon: `${library.private ? "Lock" : null}` },
                        disable,
                        metaInfo: library
                    });
                }
                let newOptions: any = [];
                newOptions.push({
                    key: "Header1",
                    text: "本地组件库",
                    itemType: DropdownMenuItemType.Header
                });
                newOptions = newOptions.concat(localLibraries);
                newOptions.push({
                    key: "Header2",
                    text: "远程组件库",
                    itemType: DropdownMenuItemType.Header
                });
                newOptions = newOptions.concat(remoteLibraries);
                setOptions(newOptions);
                if (data.selectedLibrary && !selectedLibraryInfo) {
                    setSelectedLibraryInfo(data.selectedLibrary);
                } else {
                    setLoading(false);
                }
            } else {
                setOptions([
                    {
                        key: "Header",
                        text: "本地组件库",
                        itemType: DropdownMenuItemType.Header
                    }
                ]);
            }
        };
    });

    useEffect(() => {
        setTimeout(() => {
            window.postMessage("getComponentLibraries");
        }, 200);
    }, []);

    useEffect(() => {
        window.onDidGetComponents = (data: any) => {
            setLoading(false);
            setAreaContent(
                <Nav
                    styles={{
                        root: {
                            width: "100%",
                            height: "100%"
                        }
                    }}
                    groups={data.groups}
                    onRenderLink={(link?: INavLink | any): JSX.Element => {
                        if (link) {
                            if (link.thumbnail) {
                                return (
                                    <Stack
                                        styles={{
                                            root: {
                                                width: "100%",
                                                height: "100%",
                                                position: "relative"
                                            }
                                        }}
                                        draggable={true}
                                        onDragStart={(e) => {
                                            e.currentTarget.style.border = "dashed";
                                            e.currentTarget.style.borderWidth = "1px";
                                            e.dataTransfer.setData(
                                                "text/plain",
                                                `${selectedLibraryInfo.libraryID}/${
                                                    link.key
                                                }/${encodeURIComponent(link.fullName)}`
                                            );
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.border = "none";
                                        }}
                                        horizontal={true}
                                        verticalAlign={"center"}
                                        tokens={{ childrenGap: 10 }}
                                    >
                                        <Stack.Item
                                            styles={{
                                                root: {
                                                    width: "50px",
                                                    padding: "5px",
                                                    height: "90%"
                                                }
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    backgroundColor: "white",
                                                    borderRadius: 3
                                                }}
                                            >
                                                <Image
                                                    draggable={false}
                                                    src={link.thumbnail}
                                                    loading={"lazy"}
                                                    imageFit={ImageFit.centerContain}
                                                    styles={{
                                                        root: {
                                                            width: "80%",
                                                            height: "80%"
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </Stack.Item>
                                        <Stack.Item
                                            styles={{
                                                root: {
                                                    position: "absolute",
                                                    left: "60px",
                                                    right: 0,
                                                    top: 0,
                                                    bottom: 0,
                                                    textAlign: "left"
                                                }
                                            }}
                                        >
                                            <Text
                                                draggable={false}
                                                styles={{
                                                    root: {
                                                        width: "100%",
                                                        height: "100%"
                                                    }
                                                }}
                                            >
                                                {link.name}
                                            </Text>
                                        </Stack.Item>
                                    </Stack>
                                );
                            }
                            return <Text>{link.name}</Text>;
                        }
                        return <></>;
                    }}
                />
            );
        };
    });

    useEffect(() => {
        if (selectedLibraryInfo) {
            if (selectedLibraryInfo.libraryID) {
                setLoading(true);
                setTimeout(() => {
                    window.postMessage("getComponents", selectedLibraryInfo, forceReload);
                    setForceReload(false);
                }, 100);
            } else {
                setLoading(false);
                setAreaContent(
                    <Empty
                        barType={BarType.Component}
                        libraryInfo={selectedLibraryInfo}
                        onDidLoaded={(libraryInfo: any) => {
                            setTimeout(() => {
                                window.postMessage("getComponentLibraries", true);
                                setSelectedLibraryInfo(
                                    Object.assign(
                                        { ...selectedLibraryInfo },
                                        { libraryID: libraryInfo.libraryID }
                                    )
                                );
                            }, 100);
                        }}
                    />
                );
            }
        }
    }, [selectedLibraryInfo, forceReload]);

    useEffect(() => {
        window.onDidUpdateLibrary = (data: any) => {
            if (data && data.type === BarType.Component && data.libraryInfo) {
                for (let i = 0; i < needUpdateLibraries.length; i++) {
                    let library = needUpdateLibraries[i];
                    if (library.projectID === selectedLibraryInfo.projectID) {
                        needUpdateLibraries.splice(i, 1);
                        setNeedUpdateLibraries(needUpdateLibraries);
                        break;
                    }
                }
                setTimeout(() => {
                    window.postMessage("getComponentLibraries", true);
                    setForceReload(true);
                    setSelectedLibraryInfo(
                        Object.assign(
                            { ...selectedLibraryInfo },
                            { libraryID: data.libraryInfo.libraryID }
                        )
                    );
                }, 100);
            } else {
                setLoading(false);
            }
        };
    });

    useEffect(() => {
        window.onDidImportComponents = (data: any) => {
            if (data && data.libraryID) {
                setLoading(true);
                setTimeout(() => {
                    window.postMessage("getComponentLibraries", true);
                    setSelectedLibraryInfo(data);
                }, 100);
            }
        };
    });

    return (
        <Stack styles={{ root: { height: "100%" } }}>
            <Stack
                styles={{
                    root: {
                        height: "35px",
                        paddingLeft: "70px",
                        paddingTop: "5px",
                        paddingRight: "5px"
                    }
                }}
                tokens={{ childrenGap: 3 }}
                horizontal={true}
                verticalAlign={"center"}
            >
                <Stack.Item grow={1}>
                    <Dropdown
                        responsiveMode={ResponsiveMode.unknown}
                        placeholder="请选择组件库..."
                        options={options}
                        notifyOnReselect={true}
                        selectedKey={
                            selectedLibraryInfo &&
                            (selectedLibraryInfo.libraryID || selectedLibraryInfo.projectID) +
                            selectedLibraryInfo.name
                        }
                        onRenderCaretDown={() => {
                            return (
                                <Stack
                                    styles={{ root: { width: "100%", height: "100%" } }}
                                    horizontalAlign={"center"}
                                    verticalAlign={"center"}
                                >
                                    <IconButton
                                        iconProps={{ iconName: "Sync" }}
                                        styles={{ root: { width: 22, height: 22 } }}
                                        onClick={(event: any) => {
                                            event.stopPropagation();
                                            setTimeout(() => {
                                                window.postMessage("getComponentLibraries", true);
                                            }, 200);
                                        }}
                                    />
                                </Stack>
                            );
                        }}
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
                        calloutProps={{
                            calloutMaxHeight: 500,
                            calloutMinWidth: 200
                        }}
                        onChange={(
                            event: any,
                            option?: IDropdownOption | any,
                            index?: number
                        ) => {
                            if (option) {
                                setSelectedLibraryInfo(option && option["metaInfo"]);
                            }
                        }}
                    />
                </Stack.Item>
                <Stack.Item>
                    <IconButton
                        split
                        iconProps={{
                            iconName: "Refresh"
                        }}
                        styles={{
                            icon: {
                                color: "white"
                            },
                            splitButtonMenuButton: {
                                backgroundColor: "transparent",
                                width: 28,
                                border: "none"
                            },
                            splitButtonMenuIcon: { color: "white" },
                            splitButtonDivider: {
                                backgroundColor: theme.palette.whiteTranslucent40,
                                width: 1,
                                right: 26,
                                position: "absolute",
                                top: 4,
                                bottom: 4
                            },
                            splitButtonContainer: {
                                selectors: {
                                    [HighContrastSelector]: { border: "none" }
                                }
                            }
                        }}
                        onClick={() => {
                            if (loading) {
                                return;
                            }
                            if (selectedLibraryInfo) {
                                setLoading(true);
                                setTimeout(() => {
                                    window.postMessage(
                                        "getComponents",
                                        selectedLibraryInfo,
                                        true
                                    );
                                }, 100);
                            } else {
                                setTimeout(() => {
                                    window.postMessage("getComponentLibraries", true);
                                }, 100);
                            }
                        }}
                        menuProps={{
                            directionalHintForRTL: DirectionalHint.rightTopEdge,
                            items: [
                                {
                                    key: "Import",
                                    text: "导入",
                                    iconProps: { iconName: "Import" },
                                    onClick: () => {
                                        setTimeout(() => {
                                            window.postMessage("importComponents");
                                        }, 100);
                                    }
                                },
                                {
                                    key: "Delete",
                                    text: "移除",
                                    disabled: !!!selectedLibraryInfo,
                                    iconProps: { iconName: "Delete" },
                                    onClick: () => {
                                        setTimeout(() => {
                                            window.postMessage(
                                                "deleteComponents",
                                                selectedLibraryInfo
                                            );
                                        }, 100);
                                    }
                                },
                                {
                                    key: "Update",
                                    text: `${
                                        selectedLibraryInfo &&
                                        haveUpdate(needUpdateLibraries, selectedLibraryInfo)
                                            ? "有更新，立即更新"
                                            : "更新"
                                    }`,
                                    disabled:
                                        !!!selectedLibraryInfo ||
                                        selectedLibraryInfo["type"] != "Server",
                                    iconProps: { iconName: "CloudImportExport" },
                                    onClick: () => {
                                        setLoading(true);
                                        setTimeout(() => {
                                            window.postMessage(
                                                "updateLibrary",
                                                BarType.Component,
                                                selectedLibraryInfo
                                            );
                                        }, 100);
                                    },
                                    onRenderIcon: () => {
                                        let updateTip =
                                            selectedLibraryInfo &&
                                            haveUpdate(needUpdateLibraries, selectedLibraryInfo);
                                        return (
                                            <Icon
                                                iconName={"CloudImportExport"}
                                                styles={{
                                                    root: {
                                                        color: `${
                                                            updateTip ? "red" : theme.palette.themePrimary
                                                        }`,
                                                        fontSize: 20,
                                                        marginLeft: 4,
                                                        marginRight: 4
                                                    }
                                                }}
                                            />
                                        );
                                    }
                                }
                            ],
                            directionalHintFixed: true
                        }}
                    />
                    {selectedLibraryInfo &&
                    haveUpdate(needUpdateLibraries, selectedLibraryInfo) ? (
                        <div
                            style={{
                                position: "absolute",
                                top: 8,
                                right: 5,
                                backgroundColor: "red",
                                width: 8,
                                height: 8,
                                borderRadius: 4
                            }}
                        />
                    ) : null}
                </Stack.Item>
            </Stack>
            <Stack
                styles={{
                    root: {
                        padding: 5,
                        height: "100%",
                        overflowY: "auto"
                    }
                }}
                className={"component-class"}
            >
                {loading ? (
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                    >
                        <Spinner size={SpinnerSize.small} label={"加载中..."} />
                    </div>
                ) : (
                    areaContent
                )}
            </Stack>
        </Stack>
    );
}

const cancelIcon: IIconProps = { iconName: "Cancel" };

const contentStyles = mergeStyleSets({
    container: {
        display: "flex",
        flexFlow: "column nowrap",
        alignItems: "stretch"
    },
    header: [
        theme.fonts.xLargePlus,
        {
            flex: "1 1 auto",
            borderTop: `4px solid ${theme.palette.themePrimary}`,
            display: "flex",
            alignItems: "center",
            fontSize: "20px",
            fontWeight: FontWeights.semibold,
            padding: "12px 12px 14px 24px"
        }
    ],
    body: {
        flex: "4 4 auto",
        padding: "0 24px 24px 24px",
        overflowY: "hidden",
        selectors: {
            p: { margin: "14px 0" },
            "p:first-child": { marginTop: 0 },
            "p:last-child": { marginBottom: 0 }
        }
    }
});

const iconButtonStyles: Partial<IButtonStyles> = {
    root: {
        color: theme.palette.neutralPrimary,
        marginLeft: "auto",
        marginTop: "4px",
        marginRight: "2px"
    },
    rootHovered: {
        color: theme.palette.neutralDark
    }
};

function haveUpdate(updateLibraries: any, library: any) {
    let update = false;
    for (let i = 0; i < updateLibraries.length; i++) {
        if (updateLibraries[i].projectID === library.projectID) {
            update = true;
            break;
        }
    }
    return update;
}
