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
  DetailsRow,
  FocusZone,
  GroupedList,
  GroupHeader,
  IGroup,
  IGroupHeaderProps,
  Selection,
  SelectionMode,
  SelectionZone,
  Stack,
  Text,
} from "@fluentui/react";
import React, {useEffect, useMemo, useState} from "react";
import "./export-code-page.css";

interface PageModel {
  id: string;
  name: string;
  selected: boolean;
  artboards: ArtboardModel[];
}

interface ArtboardModel {
  id: string;
  name?: string;
  selected?: boolean;
}

interface IExportCodePage {
  options: any;
  onSelectedChanged?: any;
}

export function ExportCodePage(props: IExportCodePage) {
  const [groups, setGroups] = useState([]);
  const [items, setItems] = useState([]);

  const selection = useMemo(() => {
    const s = new Selection({
      onSelectionChanged: () => {
        props.onSelectedChanged && props.onSelectedChanged(s.getSelection());
      },
    });
    s.setItems(items, true);
    for (let index = 0; index < items.length; index++) {
      const item: any = items[index];
      if (item.defaultSelected) {
        s.setKeySelected(item.key, true, false);
      }
    }
    return s;
  }, [items, groups]);

  useEffect(() => {
    let newGroups: any = [];
    let newItems: any = [];
    if (props.options) {
      for (let index = 0; index < props.options.length; index++) {
        const page: PageModel = props.options[index];
        let newPage = {
          key: page.id,
          name: page.name,
          count: (page.artboards && page.artboards.length) || 0,
          startIndex: newItems.length,
        };
        for (
          let index2 = 0;
          page.artboards && index2 < page.artboards.length;
          index2++
        ) {
          const artboard: ArtboardModel = page.artboards[index2];
          newItems.push({
            key: artboard.id,
            name: artboard.name,
            defaultSelected: artboard.selected,
          });
        }
        newGroups.push(newPage);
      }
    }
    setGroups(newGroups);
    setItems(newItems);
  }, [props.options]);

  return (
    <Stack
      styles={{
        root: {
          width: "100%",
          height: "100%",
          overflow: "auto",
        },
      }}
      className={"artboards-class"}
    >
      <FocusZone>
        <SelectionZone
          selection={selection}
          selectionMode={SelectionMode.multiple}
        >
          <GroupedList
            items={items}
            groupProps={{
              headerProps: {
                styles: {
                  check: {
                    width: 30,
                  },
                  expand: {
                    width: 30,
                  },
                },
              },
              onRenderHeader: (props?: IGroupHeaderProps) => {
                return (
                  <GroupHeader
                    onRenderTitle={() => {
                      return (
                        <Text
                          variant={"small"}
                        >{`${props?.group?.name} (${props?.group?.count})`}</Text>
                      );
                    }}
                    {...props}
                  />
                );
              },
            }}
            // eslint-disable-next-line react/jsx-no-bind
            onRenderCell={(
              nestingDepth?: number,
              item?: ArtboardModel,
              itemIndex?: number,
              group?: IGroup
            ): React.ReactNode => {
              return item && typeof itemIndex === "number" && itemIndex > -1 ? (
                <DetailsRow
                  styles={{
                    root: {
                      width: "100%",
                    },
                  }}
                  columns={[
                    {
                      key: "name",
                      name: "name",
                      fieldName: "name",
                      minWidth: 100,
                      flexGrow: 1,
                      isResizable: false,
                    },
                  ]}
                  item={item}
                  itemIndex={itemIndex}
                  selection={selection}
                  selectionMode={SelectionMode.multiple}
                  compact={true}
                  group={group}
                />
              ) : null;
            }}
            selection={selection}
            selectionMode={SelectionMode.multiple}
            groups={groups}
            compact={true}
          />
        </SelectionZone>
      </FocusZone>
    </Stack>
  );
}
