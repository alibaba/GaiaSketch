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
  ComboBox,
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  getTheme,
  IComboBox,
  IComboBoxOption,
  IconButton,
  PrimaryButton,
  SelectableOptionMenuItemType,
  Spinner,
  SpinnerSize,
  Stack,
  Text,
} from "@fluentui/react";
import React, {useEffect, useState} from "react";
import * as XLSX from "xlsx";
import {ExportMeasurePage} from "./export-measure-page";

interface IExportMeasureProps {}

const theme = getTheme();

declare var window: any;

export function ExportMeasure(props: IExportMeasureProps) {
  const [areaContent, setAreaContent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [allowDesignToken, setAllowDesignToken] = useState(true);
  const [autoCut, setAutoCut] = useState(true);
  const [disableExportButton, setDisableExportButton] = useState(true);
  const [selectedArtboards, setSelectArtboards] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [tokenPath, setTokenPath] = useState(undefined);
  const [unit, setUnit] = useState("px");
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);
  const [tokenOptions, setTokenOptions] = useState([]);
  const [selectToken, setSelectToken] = useState<any>(null);

  useEffect(() => {
    window.onDidGetPageOptions = function (data: any) {
      setLoading(false);
      if (data.options && data.options.length > 0) {
        setAreaContent(
          <ExportMeasurePage
            options={data.options}
            onSelectedChanged={(items: any) => {
              setSelectArtboards(items);
            }}
          />
        );
      } else {
        setAreaContent(null);
      }
    };
    window.onDidSelectLocalDesignToken = function (data: any) {
      if (data && data.content) {
        let json: any = parseTokens(data.content);
        let tokens: any = Object.values(json);
        setTokens(tokens);
        if (data.filePath) {
          setTokenPath(data.filePath);
        }
      } else {
        setTokens([]);
      }
    };
    window.onDidExportedMeasure = function (data: any) {
      setExporting(false);
      if (data) {
        let result: any = { success: data.success };
        if (data.success) {
          result["message"] = "";
          result["filePath"] = data.filePath;
        } else {
          result["message"] = data.message || "Error!";
        }
        setExportResult(result);
      }
    };
  });

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      window.postMessage("getPageOptions");
    }, 200);
  }, []);

  useEffect(() => {
    if (selectedArtboards && selectedArtboards.length > 0) {
      setDisableExportButton(false);
    } else {
      setDisableExportButton(true);
    }
  }, [selectedArtboards]);

  useEffect(() => {
    if (!allowDesignToken) {
      setTokenPath(undefined);
      setTokens([]);
    }
  }, [allowDesignToken]);

  useEffect(() => {
    window.onDidGetTokenLibraries = function (data: any) {
      let newOptions: any = [
        {
          key: "new",
          text: "点击此处选择本地Design Token库",
          itemType: SelectableOptionMenuItemType.Normal,
        },
        {
          key: "divider",
          text: "-",
          itemType: SelectableOptionMenuItemType.Divider,
        },
        {
          key: "header",
          text: "远程Design Token库",
          itemType: SelectableOptionMenuItemType.Header,
        },
      ];
      if (data && data.libraries) {
        for (let i = 0; i < data.libraries.length; i++) {
          let library = data.libraries[i];
          newOptions.push({
            key: library.projectID,
            text: library.name,
            data: { icon: `${library.private ? "Lock" : null}` },
            metaInfo: library,
          });
        }
      }
      setTokenOptions(newOptions);
    };
  });

  useEffect(() => {
    window.onDidGetServerDesignToken = (data: any) => {
      if (data && data.content) {
        let json: any = parseTokens(data.content);
        let tokens: any = Object.values(json);
        setTokens(tokens);
      } else {
        setTokens([]);
      }
    };
  });

  useEffect(() => {
    window.postMessage("getTokenLibraries");
  }, []);

  return (
    <Stack
      tokens={{ childrenGap: 10 }}
      styles={{
        root: {
          margin: 8,
          marginTop: "35px",
        },
      }}
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
          <Text>请选择要导出的画板</Text>
          <IconButton
            iconProps={{ iconName: "Refresh" }}
            onClick={() => {
              setLoading(true);
              setAreaContent(null);
              setTimeout(() => {
                window.postMessage("getPageOptions");
              }, 200);
            }}
          />
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
          }}
        >
          {loading ? <Spinner size={SpinnerSize.small} /> : areaContent}
        </div>
      </Stack>
      <ComboBox
        label="单位"
        defaultSelectedKey={unit}
        allowFreeform={true}
        autoComplete={"on"}
        useComboBoxAsMenuWidth
        options={[
          { key: "px", text: "px" },
          { key: "dp", text: "dp" },
        ]}
        styles={{
          label: {
            fontSize: 12,
          },
        }}
        onChange={(
          event: React.FormEvent<IComboBox>,
          option?: IComboBoxOption,
          index?: number,
          value?: string
        ) => {
          if (option) {
            setUnit(String(option.key));
          } else {
            setUnit(String(value));
          }
        }}
      />
      {allowDesignToken ? (
        <Stack tokens={{ childrenGap: 3 }}>
          <Stack
            horizontal
            verticalAlign="center"
            tokens={{ childrenGap: 2 }}
            styles={{
              root: {
                height: 25,
              },
            }}
          >
            <Text variant={"small"}>Design Token</Text>
            <IconButton iconProps={{ iconName: "Info" }} />
          </Stack>
          <ComboBox
            placeholder="选择Design Token库"
            selectedKey={selectToken}
            text={tokenPath}
            useComboBoxAsMenuWidth
            options={tokenOptions}
            styles={{
              callout: {
                maxHeight: 100,
              },
            }}
            onChange={(
              event: React.FormEvent<IComboBox>,
              option?: IComboBoxOption,
              index?: number,
              value?: string
            ) => {
              setSelectToken(option?.key);
              setTokens([]);
              setTokenPath(undefined);
              if (index == 0) {
                window.postMessage("selectLocalDesignToken");
              } else if (option) {
                window.postMessage("getServerDesignToken", option.key);
              }
            }}
          />
        </Stack>
      ) : null}
      <Checkbox
        label="支持Design Token"
        defaultChecked={allowDesignToken}
        styles={{
          checkbox: {
            height: 18,
            width: 18,
          },
          text: {
            fontSize: 12,
          },
        }}
        onChange={(
          ev?: React.FormEvent<HTMLElement | HTMLInputElement>,
          checked?: boolean
        ) => {
          setAllowDesignToken(!!checked);
        }}
      />
      <Checkbox
        label="自动生成切图"
        defaultChecked={autoCut}
        styles={{
          checkbox: {
            height: 18,
            width: 18,
          },
          text: {
            fontSize: 12,
          },
        }}
        onChange={(
          ev?: React.FormEvent<HTMLElement | HTMLInputElement>,
          checked?: boolean
        ) => {
          setAutoCut(!!checked);
        }}
      />
      <PrimaryButton
        text="导出标注"
        disabled={disableExportButton || exporting}
        onClick={() => {
          let params: any = {
            tokens,
            artboards: selectedArtboards,
            autoCut,
            allowDesignToken,
            unit,
          };
          setExporting(true);
          window.postMessage("exportMeasure", params);
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
      {exportResult ? (
        <Dialog
          hidden={false}
          onDismiss={() => {
            setExportResult(null);
          }}
          dialogContentProps={{
            type: DialogType.normal,
            title: exportResult["success"] ? "Success !" : "Error !",
            subText: exportResult["message"],
          }}
          modalProps={{
            isBlocking: true,
          }}
        >
          <DialogFooter>
            <Stack tokens={{ childrenGap: 8 }}>
              {exportResult["success"] ? (
                <DefaultButton
                  onClick={() => {
                    window.postMessage(
                      "openInFinder",
                      exportResult["filePath"],
                      "index.html"
                    );
                  }}
                  text="Open In Finder"
                />
              ) : null}
              <PrimaryButton
                onClick={() => {
                  setExportResult(null);
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

function parseTokens(data: any) {
  const wb: any = XLSX.read(data, { type: "binary" });
  let json: any = {};
  if (wb && wb.SheetNames && wb.SheetNames.length > 0) {
    for (let index = 0; index < wb.SheetNames.length; index++) {
      const sheetName = wb.SheetNames[index];
      if (sheetName == "定义") {
        let ws = wb.Sheets[sheetName];
        let defines: any = XLSX.utils.sheet_to_json(ws, { header: 1 });
        if (defines && defines.length > 0) {
          defines = handleXlsx(defines);
          defines &&
            defines.forEach((defineElements: any) => {
              let currentKey;
              if (
                defineElements &&
                defineElements.length > 0 &&
                defineElements[0]
              ) {
                currentKey = defineElements[0];
              }
              if (currentKey) {
                if (json[currentKey] == undefined) {
                  json[currentKey] = {
                    rules: [],
                  };
                }
                json[currentKey].rules.push(defineElements.slice(1));
              }
            });
        }
      }
    }
    for (const key in json) {
      if (json.hasOwnProperty(key)) {
        let item = json[key];
        let attributeWS = wb.Sheets[key];
        if (attributeWS) {
          let rows: any = XLSX.utils.sheet_to_json(attributeWS, {
            header: 1,
          });
          if (rows && item.rules && rows.length > 0 && item.rules.length > 0) {
            rows = handleXlsx(rows);
            let step = item.rules.length;
            if (item.tokens == undefined) {
              item.tokens = [];
            }
            for (let index = 0; index < rows.length; ) {
              let tokenItem: any = {};
              let selectedRows = rows.slice(index, index + step);
              tokenItem["value"] = getTokenValue(selectedRows);
              combineRow(tokenItem, selectedRows);
              let fromIndex = index;
              let toIndex = fromIndex;
              for (
                let index2 = fromIndex + step;
                index2 < rows.length;
                index2 += step
              ) {
                const currentRows = rows.slice(index2, index2 + step);
                if (compareRow(selectedRows, currentRows)) {
                  combineRow(tokenItem, currentRows);
                } else {
                  toIndex = index2;
                  break;
                }
              }
              if (toIndex == fromIndex) {
                toIndex = rows.length;
              }
              item.tokens.push(tokenItem);
              index = toIndex;
            }
          }
        }
      }
    }
  }
  return json;
}

function compareRow(row1: any, row2: any) {
  let same = true;
  if (row1 && row2 && row1.length == row2.length) {
    for (let index = 0; index < row1.length; index++) {
      const element1 = row1[index];
      const element2 = row2[index];
      if (element1[0] != element2[0]) {
        same = false;
        break;
      }
    }
  }
  return same;
}

function getTokenValue(rows: any) {
  let values = [];
  for (let index = 0; index < rows.length; index++) {
    const element = rows[index];
    if (element && element.length > 0) {
      values.push(element[0]);
    }
  }
  return values;
}

function combineRow(json: any, row: any) {
  let tokens: any = [];
  if (json["token"]) {
    tokens = [...json["token"]];
  }
  let codes: any = [];
  if (json["code"]) {
    codes = [...json["code"]];
  }
  if (row[0].length >= 1) {
    let exist = false;
    let rowKey = row[0][1];
    for (let index = 0; index < tokens.length; index++) {
      const element = tokens[index];
      if (element == rowKey) {
        exist = true;
        break;
      }
    }
    if (!exist) {
      tokens.push(rowKey);
    }
    if (row[0].length >= 4) {
      codes.push({
        platform: row[0][2],
        snippet: row[0][3],
      });
    }
  }
  json["token"] = tokens;
  json["code"] = codes;
}

function handleXlsx(data: any) {
  let xlsx = [...data];
  if (xlsx && xlsx.length > 0) {
    for (let index = 0; index < xlsx.length; index++) {
      const elements = xlsx[index];
      for (let index2 = 0; index2 < elements.length; index2++) {
        const element = elements[index2];
        if (element == null && index - 1 >= 0) {
          elements[index2] = xlsx[index - 1][index2];
        }
      }
    }
  }
  return xlsx;
}
