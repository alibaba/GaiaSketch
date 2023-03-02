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

import React, { useEffect, useState } from "react";
import {
    Checkbox,
    DefaultButton,
    Dialog,
    DialogFooter,
    DialogType,
    Dropdown,
    getTheme,
    IconButton,
    IDropdownOption,
    Image,
    ImageFit,
    PrimaryButton,
    ResponsiveMode,
    Separator,
    Spinner,
    SpinnerSize,
    Stack,
    Text,
} from "@fluentui/react";
import { ArtboardsSelection } from "../artboards-selection";

const theme = getTheme();

declare var window: any;

interface IExportCodeProps {}

export function ExportCode(props: IExportCodeProps) {
    const [loading, setLoading] = useState(false);
    const [previewContent, setPreviewContent] = useState<any>(getTips());
    const [exportingLayer, setExportingLayer] = useState<any>(null);
    const [exporting, setExporting] = useState(false);
    const [languages, setLanguages] = useState<any>([]);
    const [errorMessage, setErrorMessage] = useState(null);
    const [codeFolder, setCodeFolder] = useState<any>(null);
    const [multiSelection, setMultiSelection] = useState(false);
    const [selectedArtboards, setSelectArtboards] = useState([]);
    const [autoImageShouldContainArtboardBackgroundColor, setAutoImageShouldContainArtboardBackgroundColor] =
        useState(false);
    const [keepArtboardBackgroundColor, setKeepArtboardBackgroundColor] = useState(true);
    const [autoFindNearestGroup, setAutoFindNearestGroup] = useState(true);

    useEffect(() => {
        window.onDidGetPageOptions = function (data: any) {
            setLoading(false);
            setSelectArtboards([]);
            if (data.options && data.options.length > 0) {
                setPreviewContent(
                    <ArtboardsSelection
                        options={data.options}
                        onSelectedChanged={(items: any) => {
                            setSelectArtboards(items);
                        }}
                    />
                );
            } else {
                setPreviewContent(null);
            }
        };
        window.onDidGetSelectedLayerPreview = (data: any) => {
            if (!multiSelection) {
                setLoading(false);
                if (data.previewPath) {
                    setPreviewContent(
                        <Image
                            src={data.previewPath}
                            styles={{ root: { width: "100%", height: "100%" } }}
                            imageFit={ImageFit.centerContain}
                        />
                    );
                    setExportingLayer(data);
                } else {
                    setPreviewContent(getTips());
                }
            }
            window.postMessage("getSelectedArtboards");
        };
        window.onDidExportCode = (data: any) => {
            setExporting(false);
            if (data) {
                if (data.errorMessage) {
                    setCodeFolder(null);
                    setErrorMessage(data.errorMessage);
                } else {
                    setErrorMessage(null);
                    setCodeFolder(data.codeFolder);
                }
            }
        };
        window.onDidGetLastSelectedLanguages = (data: any) => {
            if (data?.languages) {
                setLanguages(data?.languages);
            }
        };
        window.onDidGetSelectedArtboards = (data: any) => {
            if (data?.count > 1) {
                setMultiSelection(true);
            } else {
                setMultiSelection(false);
            }
        };
    });

    useEffect(() => {
        if (multiSelection) {
            setSelectArtboards([]);
            setTimeout(() => {
                setLoading(true);
                window.postMessage("getPageOptions", ["Artboard", "SymbolInstance"]);
            }, 200);
        } else {
            setExportingLayer(null);
            setPreviewContent(getTips());
            setTimeout(() => {
                window.postMessage("getSelectedLayerPreview");
            });
        }
    }, [multiSelection]);

    useEffect(() => {
        setLoading(true);
        window.postMessage("getSelectedArtboards");
        window.postMessage("getLastSelectedLanguages");
    }, []);

    return (
        <Stack
            styles={{
                root: {
                    margin: 8,
                    marginTop: "35px",
                    height: "100%",
                },
            }}
            tokens={{ childrenGap: 10 }}
        >
            <Stack
                styles={{
                    root: {
                        padding: 5,
                        border: `1px dashed ${theme.palette.whiteTranslucent40}`,
                        borderRadius: theme.effects.roundedCorner4,
                    },
                }}
                tokens={{ childrenGap: 5 }}
            >
                <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
                    <Text>请选择要导出的图层</Text>
                    <Stack tokens={{ childrenGap: 2 }} horizontal={true} verticalAlign={"center"}>
                        <Checkbox
                            label="多选"
                            styles={{
                                checkbox: { width: 15, height: 15 },
                                text: { lineHeight: 15 },
                            }}
                            checked={multiSelection}
                            onChange={(ev: any, checked?: boolean) => {
                                setMultiSelection(!!checked);
                            }}
                        />
                        <Separator vertical={true} />
                        <IconButton
                            iconProps={{ iconName: "Refresh" }}
                            onClick={() => {
                                setLoading(true);
                                setTimeout(() => {
                                    if (multiSelection) {
                                        window.postMessage("getPageOptions", ["Artboard", "SymbolInstance"]);
                                    } else {
                                        window.postMessage("getSelectedLayerPreview");
                                    }
                                }, 200);
                            }}
                        />
                    </Stack>
                </Stack>
                <div
                    style={{
                        height: "300px",
                        width: "100%",
                        maxHeight: "300px",
                        display: "flex",
                        boxShadow: theme.effects.elevation4,
                        borderRadius: theme.effects.roundedCorner4,
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    {loading ? <Spinner size={SpinnerSize.small} /> : previewContent}
                </div>
            </Stack>
            <Checkbox
                label="自动生成的图片是否包含画板背景色"
                checked={autoImageShouldContainArtboardBackgroundColor}
                styles={{
                    checkbox: {
                        height: 18,
                        width: 18,
                    },
                    text: {
                        fontSize: 12,
                    },
                }}
                onChange={(ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
                    setAutoImageShouldContainArtboardBackgroundColor(!!checked);
                }}
            />
            <Checkbox
                label="是否保留画板背景色"
                checked={keepArtboardBackgroundColor}
                styles={{
                    checkbox: {
                        height: 18,
                        width: 18,
                    },
                    text: {
                        fontSize: 12,
                    },
                }}
                onChange={(ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
                    setKeepArtboardBackgroundColor(!!checked);
                }}
            />
            {multiSelection ? (
                <Checkbox
                    label="是否自动从画板的子层级开始导出"
                    checked={autoFindNearestGroup}
                    styles={{
                        checkbox: {
                            height: 18,
                            width: 18,
                        },
                        text: {
                            fontSize: 12,
                        },
                    }}
                    onChange={(ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
                        setAutoFindNearestGroup(!!checked);
                    }}
                />
            ) : null}
            <Dropdown
                label="语言类型"
                placeholder={"请选择要导出的语言"}
                selectedKeys={languages}
                multiSelect
                options={[
                    {
                        key: "GaiaX",
                        text: "GaiaX",
                    },
                    {
                        key: "React",
                        text: "React",
                    },
                    {
                        key: "Vue",
                        text: "Vue",
                    },
                    {
                        key: "Mini-App",
                        text: "小程序",
                    },
                ]}
                responsiveMode={ResponsiveMode.unknown}
                onChange={(event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption, index?: number) => {
                    if (option) {
                        let selectedKeys = option.selected
                            ? [...languages, option.key as string]
                            : languages.filter((key: string) => key !== option.key);
                        setLanguages(selectedKeys);
                    }
                }}
            />
            <PrimaryButton
                text={"导出代码"}
                disabled={
                    (!multiSelection && !exportingLayer) ||
                    (multiSelection && selectedArtboards.length <= 0) ||
                    languages.length <= 0 ||
                    exporting
                }
                onClick={() => {
                    setExporting(true);
                    setTimeout(() => {
                        if (multiSelection) {
                            window.postMessage(
                                "exportCode",
                                selectedArtboards,
                                languages,
                                autoImageShouldContainArtboardBackgroundColor,
                                keepArtboardBackgroundColor,
                                autoFindNearestGroup
                            );
                        } else {
                            window.postMessage(
                                "exportCode",
                                [{ key: exportingLayer.id, name: exportingLayer.name }],
                                languages,
                                autoImageShouldContainArtboardBackgroundColor,
                                keepArtboardBackgroundColor
                            );
                        }
                    }, 200);
                }}
            >
                {exporting ? (
                    <Spinner
                        size={SpinnerSize.xSmall}
                        styles={{
                            root: {
                                position: "absolute",
                                right: 70,
                            },
                        }}
                    />
                ) : null}
            </PrimaryButton>
            {codeFolder ? (
                <Dialog
                    hidden={false}
                    onDismiss={() => {
                        setCodeFolder(null);
                    }}
                    dialogContentProps={{
                        type: DialogType.normal,
                        title: "导出成功",
                    }}
                    modalProps={{
                        isBlocking: true,
                    }}
                >
                    <Stack tokens={{ childrenGap: 8 }}>
                        {codeFolder ? (
                            <>
                                {languages && (languages.includes("GaiaX")) ? (
                                    <DefaultButton
                                        onClick={() => {
                                            window.postMessage("openInGaiaStudio", codeFolder);
                                        }}
                                        text="Open In Gaia Studio"
                                    />
                                ) : null}
                                <DefaultButton
                                    onClick={() => {
                                        window.postMessage("openInFinder", codeFolder);
                                    }}
                                    text="Open In Finder"
                                />
                            </>
                        ) : null}
                        <PrimaryButton
                            onClick={() => {
                                setCodeFolder(null);
                            }}
                            text="OK"
                        />
                    </Stack>
                </Dialog>
            ) : null}
            {errorMessage ? (
                <Dialog
                    hidden={false}
                    onDismiss={() => {
                        setErrorMessage(null);
                    }}
                    dialogContentProps={{
                        type: DialogType.normal,
                        title: "导出失败",
                        subText: errorMessage,
                    }}
                    modalProps={{
                        isBlocking: true,
                    }}
                >
                    <DialogFooter>
                        <Stack tokens={{ childrenGap: 8 }}>
                            <PrimaryButton
                                onClick={() => {
                                    setErrorMessage(null);
                                }}
                                text="OK"
                            />
                        </Stack>
                    </DialogFooter>
                </Dialog>
            ) : null}
        </Stack>
    );
}

function getTips() {
    return <Text variant={"small"}>请先在设计稿中选择一个要导出的图层</Text>;
}
