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

/**
 * 包含头文件需要包含哪些组件
 */
export default class ImportStatements {
    // static instance: ImportStatements;
    // importsArray: any;

    constructor() {
        this.importsArray = [];
    }

    static getInstance() {
        if (false === this.instance instanceof this) {
            this.instance = new this();
        }
        return this.instance;
    }

    static appendComponents(component) {
        ImportStatements.getInstance().importsArray.push(component);
    }

    static getImportsSatements() {
        let instance = ImportStatements.getInstance();
        let statement = [];
        instance.importsArray.forEach((sm) => {
            statement = statement.concat(sm.getImportStatement());
        });
        let uniqueStatement = Array.from(new Set(statement));
        return uniqueStatement.join("\n");
    }
}
