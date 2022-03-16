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

import React, {useEffect, useState} from "react";
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
import {ExportCodePage} from "./export-code-page";

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
  const [codeFolder, setCodeFolder] = useState(null);
  const [multiSelection, setMultiSelection] = useState(false);
  const [selectedArtboards, setSelectArtboards] = useState([]);

  useEffect(() => {
    window.onDidGetPageOptions = function (data: any) {
      setLoading(false);
      setSelectArtboards([]);
      if (data.options && data.options.length > 0) {
        setPreviewContent(
          <ExportCodePage
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
  });

  useEffect(() => {
    if (multiSelection) {
      setSelectArtboards([]);
      setTimeout(() => {
        setLoading(true);
        window.postMessage("getPageOptions");
      }, 200);
    } else {
      setExportingLayer(null);
      setPreviewContent(getTips());
    }
  }, [multiSelection]);

  useEffect(() => {
    setLoading(true);
    window.postMessage("getSelectedLayerPreview");
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
        <Stack
          horizontal
          horizontalAlign="space-between"
          verticalAlign="center"
        >
          <Text>请选择要导出的图层</Text>
          <Stack
            tokens={{ childrenGap: 2 }}
            horizontal={true}
            verticalAlign={"center"}
          >
            <Checkbox
              label="多选"
              styles={{
                checkbox: { width: 15, height: 15 },
                text: { lineHeight: 15 },
              }}
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
                    window.postMessage("getPageOptions");
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
      <Dropdown
        label="语言类型"
        placeholder={"请选择要导出的语言"}
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
            key: "Rax",
            text: "Rax",
          },
          {
            key: "Mini-App",
            text: "小程序",
          },
        ]}
        responsiveMode={ResponsiveMode.unknown}
        onChange={(
          event: React.FormEvent<HTMLDivElement>,
          option?: IDropdownOption,
          index?: number
        ) => {
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
              window.postMessage("exportCode", selectedArtboards, languages);
            } else {
              window.postMessage(
                "exportCode",
                [{ key: exportingLayer.id, name: exportingLayer.name }],
                languages
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
          <DialogFooter>
            <Stack tokens={{ childrenGap: 8 }}>
              {codeFolder ? (
                <>
                  {languages && languages.includes("GaiaX") ? (
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
          </DialogFooter>
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
