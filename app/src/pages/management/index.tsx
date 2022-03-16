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
import "./index.css";
import {
  ContextualMenuItemType,
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  DirectionalHint,
  getTheme,
  Icon,
  IconButton,
  INavLink,
  Nav,
  PrimaryButton,
  Spinner,
  SpinnerSize,
  Stack,
  Text,
  TextField,
} from "@fluentui/react";

declare var window: any;

const theme = getTheme();

export function Management() {
  const [loading, setLoading] = useState(false);
  const [usering, setUsering] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [libraries, setLibraries] = useState([]);
  const [showModifyLibrary, setShowModifyLibrary] = useState<any>(null);
  const [newLibraryName, setNewLibraryName] = useState<any>(null);
  const [updating, setUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showAddUser, setShowAddUser] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      window.postMessage("getOwnedLibraries");
    }, 100);
  }, []);

  useEffect(() => {
    window.onDidGetOwnedLibraries = (data: any) => {
      setLoading(false);
      if (data && data.libraries) {
        setLibraries(data.libraries);
      }
    };
    window.onDidRenameLibrary = (data: any) => {
      setUpdating(false);
      setShowModifyLibrary(null);
      if (data && data.success) {
        setLoading(true);
        setErrorMessage(null);
        window.postMessage("getOwnedLibraries", true);
      } else {
        setErrorMessage(data.errorMessage);
      }
    };

    window.onDidRemoveServerLibrary = (data: any) => {
      setUpdating(false);
      if (data && data.success) {
        setLoading(true);
        setErrorMessage(null);
        window.postMessage("getOwnedLibraries", true);
      } else {
        setErrorMessage(data.errorMessage);
      }
    };
  });

  return (
    <Stack
      styles={{
        root: {
          padding: 4,
          height: "100%",
        },
      }}
      tokens={{ childrenGap: 5 }}
    >
      <Stack
        horizontalAlign={"end"}
        horizontal={true}
        styles={{ root: { width: "100%" } }}
      >
        <IconButton
          iconProps={{ iconName: "Refresh" }}
          styles={{ root: { width: 28, color: "white" } }}
          onClick={() => {
            setLoading(true);
            setTimeout(() => {
              window.postMessage("getOwnedLibraries", true);
            }, 100);
          }}
        />
      </Stack>
      <Stack
        styles={{
          root: {
            border: `1px dashed ${theme.palette.whiteTranslucent40}`,
            borderRadius: theme.effects.roundedCorner4,
            overflowY: "auto",
            height: "100%",
            margin: 4,
            marginTop: 35,
          },
        }}
      >
        {loading ? (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Spinner size={SpinnerSize.small} label={"加载中..."} />
          </div>
        ) : (
          <Nav
            groups={libraries}
            onRenderLink={(link?: INavLink | any): JSX.Element => {
              return (
                <Stack
                  styles={{ root: { width: "100%" } }}
                  tokens={{ childrenGap: 8 }}
                  horizontal={true}
                  verticalAlign={"center"}
                >
                  <Stack.Item grow={1} styles={{ root: { textAlign: "left" } }}>
                    <Text>{link.name}</Text>
                  </Stack.Item>
                  <IconButton
                    iconProps={{ iconName: "More" }}
                    styles={{
                      icon: { color: "white" },
                      menuIcon: { color: "white" },
                    }}
                    menuProps={{
                      directionalHintForRTL: DirectionalHint.rightTopEdge,
                      items: [
                        {
                          key: "section",
                          itemType: ContextualMenuItemType.Section,
                          sectionProps: {
                            title: `已选择：${link.name}`,
                            items: [
                              {
                                key: "EditLibrary",
                                text: "修改库名",
                                iconProps: { iconName: "Edit" },
                                onRenderIcon: () => {
                                  return onRenderIcon("Edit");
                                },
                                onClick: () => {
                                  setShowModifyLibrary(link);
                                },
                              },
                              // {
                              //   key: "AddUser",
                              //   text: "添加人员",
                              //   iconProps: { iconName: "Add" },
                              //   onRenderIcon: () => {
                              //     return onRenderIcon("Add");
                              //   },
                              //   onClick: () => {
                              //     setShowAddUser(link);
                              //   },
                              // },
                              // {
                              //   key: "Remove",
                              //   text: "删除人员",
                              //   onRenderIcon: () => {
                              //     return onRenderIcon("Remove");
                              //   },
                              //   iconProps: { iconName: "Remove" },
                              //   onClick: () => {},
                              // },
                              {
                                key: "RemoveLink",
                                text: "从服务端删除",
                                onRenderIcon: () => {
                                  return onRenderIcon("RemoveLink");
                                },
                                iconProps: { iconName: "RemoveLink" },
                                onClick: () => {
                                  window.postMessage(
                                    "removeServerLibrary",
                                    link
                                  );
                                },
                              },
                            ],
                          },
                        },
                      ],
                    }}
                  />
                </Stack>
              );
            }}
          />
        )}
      </Stack>
      {errorMessage ? (
        <Dialog
          hidden={false}
          onDismiss={() => {
            setErrorMessage(null);
          }}
          dialogContentProps={{
            type: DialogType.largeHeader,
            title: "修改失败",
            subText: errorMessage,
          }}
          modalProps={{
            isBlocking: true,
            styles: { main: { maxWidth: 200 } },
          }}
        >
          <DialogFooter>
            <PrimaryButton
              text={"知道了"}
              onClick={() => {
                setErrorMessage(null);
              }}
            />
          </DialogFooter>
        </Dialog>
      ) : null}
      {showModifyLibrary ? (
        <Dialog
          hidden={false}
          onDismiss={() => {
            setShowModifyLibrary(null);
          }}
          dialogContentProps={{
            type: DialogType.largeHeader,
            title: "修改库名",
          }}
          modalProps={{
            isBlocking: true,
            styles: { main: { maxWidth: 200 } },
          }}
        >
          <TextField
            label={"新库名"}
            placeholder={"请输入新库名"}
            defaultValue={showModifyLibrary.name}
            onChange={(event, newValue) => {
              setNewLibraryName(newValue);
            }}
          />
          <DialogFooter>
            <DefaultButton
              onClick={() => {
                setShowModifyLibrary(null);
              }}
              text="取消"
            />
            <PrimaryButton
              disabled={!newLibraryName || newLibraryName.length <= 0}
              onClick={() => {
                setUpdating(true);
                setTimeout(() => {
                  window.postMessage(
                    "renameLibrary",
                    showModifyLibrary,
                    newLibraryName
                  );
                }, 100);
              }}
              text="修改"
            >
              {updating ? (
                <Spinner
                  size={SpinnerSize.xSmall}
                  styles={{
                    root: {
                      position: "absolute",
                      right: 5,
                    },
                  }}
                />
              ) : null}
            </PrimaryButton>
          </DialogFooter>
        </Dialog>
      ) : null}
      {/*{showAddUser ? (*/}
      {/*  <Dialog*/}
      {/*    hidden={false}*/}
      {/*    onDismiss={() => {*/}
      {/*      setShowAddUser(null);*/}
      {/*    }}*/}
      {/*    dialogContentProps={{*/}
      {/*      type: DialogType.largeHeader,*/}
      {/*      title: "添加人员",*/}
      {/*    }}*/}
      {/*    modalProps={{*/}
      {/*      isBlocking: true,*/}
      {/*      styles: { main: { maxWidth: 200 } },*/}
      {/*    }}*/}
      {/*  >*/}
      {/*    <TextField*/}
      {/*      label={"人员"}*/}
      {/*      placeholder={"请输入新人员id"}*/}
      {/*      defaultValue={showAddUser.name}*/}
      {/*      onChange={(event, newValue) => {*/}
      {/*        window.postMessage("searchUser", newValue);*/}
      {/*      }}*/}
      {/*    />*/}
      {/*    <DialogFooter>*/}
      {/*      <DefaultButton*/}
      {/*        onClick={() => {*/}
      {/*          setShowAddUser(null);*/}
      {/*        }}*/}
      {/*        text="取消"*/}
      {/*      />*/}
      {/*      <PrimaryButton*/}
      {/*        disabled={!newLibraryName || newLibraryName.length <= 0}*/}
      {/*        onClick={() => {*/}
      {/*          setUsering(true);*/}
      {/*          setTimeout(() => {}, 100);*/}
      {/*        }}*/}
      {/*        text="添加"*/}
      {/*      >*/}
      {/*        {usering ? (*/}
      {/*          <Spinner*/}
      {/*            size={SpinnerSize.xSmall}*/}
      {/*            styles={{*/}
      {/*              root: {*/}
      {/*                position: "absolute",*/}
      {/*                right: 5,*/}
      {/*              },*/}
      {/*            }}*/}
      {/*          />*/}
      {/*        ) : null}*/}
      {/*      </PrimaryButton>*/}
      {/*    </DialogFooter>*/}
      {/*  </Dialog>*/}
      {/*) : null}*/}
    </Stack>
  );
}
function onRenderIcon(iconName: string) {
  return (
    <Icon
      iconName={iconName}
      styles={{
        root: {
          fontSize: 15,
          marginLeft: 4,
          marginRight: 4,
        },
      }}
    />
  );
}
