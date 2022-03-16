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

export default class GKSlice {
  // style: any;
  // type: string;
  // parent: any;
  // source: any;
  // layers: any[];
  // scrollDirection: any;
  constructor(props) {
    this.parent = props.parent;
    this.type = "Slice";
    this.style = {};
    this.style.type = "Slice";
    this.layers = [];
    let nativeObject = props.layer;
    this.style.left = Number(nativeObject.frame().x());
    this.style.top = Number(nativeObject.frame().y());
    this.style.width = Number(nativeObject.frame().width());
    this.style.height = Number(nativeObject.frame().height());
    // this.style.borderStyle = "dashed";
    // this.style.borderWidth = "1px";
    // this.style.borderColor = `rgba(204, 204, 204, 1)`;
    this.scrollDirection = "None";
    // this.style.borderRadius = "4px";
  }
}
