import {IPlatformManager} from "./IPlatformManager";

import {Result} from "../QueryProcessor";

import Log from "../../Util";
import {IDatasetParser} from "../datasets/IDatasetParser";
import {InsightDatasetKind, InsightError} from "../IInsightFacade";
import JsonDatasetParser from "../datasets/JsonDatasetParser";
import HtmlDatasetParser from "../datasets/HtmlDatasetParser";
import QueryValidator from "../QueryValidator";
import * as fs from "fs";
import InsightFacade from "../InsightFacade";
import {Decimal} from "decimal.js";

export default class D2PlatformManager implements IPlatformManager {

    constructor() {}

    public preloadDatasets() {
        const facade: InsightFacade = new InsightFacade();
        Log.info("Reading courses dataset");
        const coursesDataset = fs.readFileSync("./resources/310courses.1.0.zip").toString("base64")
        Log.info("Reading rooms dataset");
        const roomsDataset = fs.readFileSync("./resources/310rooms.1.0.zip").toString("base64");
        return facade.addDataset("courses", coursesDataset, InsightDatasetKind.Courses)
            .then(function (response: string[]) {
                Log.info("Done adding courses");
                return facade.addDataset("rooms", roomsDataset, InsightDatasetKind.Rooms);
            }).then(function (response: string[]) {
                Log.info("Done adding rooms");
            });
    }

    public getParser(kind: InsightDatasetKind): IDatasetParser {
        if (kind === InsightDatasetKind.Courses) {
            return new JsonDatasetParser();
        } else if (kind === InsightDatasetKind.Rooms) {
            return new HtmlDatasetParser();
        } else {
            throw new InsightError(`Invalid kind: ${kind}`);
        }
    }

    public validateOrderStructure(order: any | string) {
        if (typeof order === "object" && !Array.isArray(order)) {
            if (!order.hasOwnProperty("dir")) {
                throw new InsightError("ORDER missing 'dir' key");
            } else {
                const dir = order["dir"];
                if (!QueryValidator.exists(dir) || (dir !== "UP" && dir !== "DOWN")) {
                    throw new InsightError("Invalid ORDER direction");
                }
            }
            if (!order.hasOwnProperty("keys")) {
                throw new InsightError("ORDER missing 'keys' key");
            } else {
                if (!Array.isArray(order["keys"]) || order["keys"].length === 0) {
                    throw new InsightError("ORDER keys must be a non-empty array");
                }
            }
            if (Object.keys(order).length > 2) {
                throw new InsightError("Extra keys in ORDER");
            }
        } else if (typeof order !== "string") {
            throw new InsightError("Invalid ORDER type");
        }
    }

    public validateTransformationsStructure(query: any): void {
        if (query.hasOwnProperty("TRANSFORMATIONS")) {
            const transformations = query["TRANSFORMATIONS"];
            Log.trace("QueryValidator:validateTransformationsStructure - Start");
            if (!transformations.hasOwnProperty("GROUP")) {
                throw new InsightError("TRANSFORMATIONS missing GROUP");
            } else {
                const group = transformations["GROUP"];
                if (!Array.isArray(group) || group.length < 1) {
                    throw new InsightError("GROUP must be a non-empty array");
                }
            }
            if (!transformations.hasOwnProperty("APPLY")) {
                throw new InsightError("TRANSFORMATIONS missing APPLY");
            } else {
                const apply = transformations["APPLY"];
                if (!Array.isArray(apply)) {
                    throw new InsightError("APPLY must be an array");
                }
                this.validateApplyStruture(apply);
            }
            if (Object.keys(transformations).length > 2) {
                throw new InsightError("Extra keys in TRANSFORMATIONS");
            }
        }
    }

    public validateOrderValues(order: any, columns: any) {
        if (typeof order === "string") {
            if (!columns.includes(order)) {
                throw new InsightError("ORDER key must be in COLUMNS");
            }
        } else {
            for (const key of order["keys"]) {
                if (!columns.includes(key)) {
                    throw new InsightError("All ORDER keys must be in COLUMNS");
                }
            }
        }
    }


    public validateColumnKey(transformations: any, key: string, id: string, kind: InsightDatasetKind) {
        if (!this.isApplyKey(transformations, key))  {
            QueryValidator.keyCheckTypeless("COLUMNS", key, id, kind);
            if (transformations && !transformations["GROUP"].includes(key)) {
                throw new InsightError("Keys in COLUMNS must be in GROUP or APPLY when TRANSFORMATIONS is present");
            }
        }
    }

    public validateTransformationsValues(transformations: any, id: string, kind: InsightDatasetKind): void {
        Log.trace("QueryValidator:validateTransformationsValues - Start");
        if (QueryValidator.exists(transformations)) {
            for (const key of transformations["GROUP"]) {
                if (!this.isValidNormalKey(key, kind)) {
                    throw new InsightError(`Invalid key ${key} in GROUP`);
                }
                if (!QueryValidator.isSameDatasetId(key, id)) {
                    throw new InsightError("Cannot query more than one dataset");
                }
                this.validateKind("GROUP", key, kind);
            }
            const unique: string[] = [];
            const applyKeyNames = transformations["APPLY"].map((x: any) => Object.keys(x)[0]);
            for (const key of applyKeyNames) {
                if (key === "") {
                    throw new InsightError("Apply key cannot be empty string");
                }
                if (key.includes("_")) {
                    throw new InsightError(`Cannot have underscore in applyKey`);
                }
                if (unique.includes(key)) {
                    throw new InsightError(`Duplicate APPLY key ${key}`);
                }
                unique.push(key);
            }
            this.validateApplyBodyValues(transformations["APPLY"], id, kind);
        }
    }

    public fetchIdFromGroup(group: any): string {
        const key = group[0];
        if (typeof key !== "string" || key.split("_").length < 2) {
            throw new InsightError(`Invalid key ${key} in GROUP`);
        }
        return key.split("_")[0];
    }

    public validateKind(location: string, key: string, kind: InsightDatasetKind) {
        if (!this.isSameDatasetKind(key, kind)) {
            throw new InsightError(`Invalid key ${key} for ${kind} datasets in ${location}`);
        }
    }

    public isValidNormalKey(key: string, kind: InsightDatasetKind): boolean {
        let isValid = false;
        const split = key.split("_");
        if (split.length > 1) {
            if (kind === InsightDatasetKind.Courses) {
                isValid = QueryValidator.courseKeys.includes(split[split.length - 1]);
            } else {
                isValid = QueryValidator.roomKeys.includes(split[split.length - 1]);
            }
        }
        return isValid;
    }

    public applyTransformations(query: any, results: Result[]): Result[] {
        if (query["TRANSFORMATIONS"]) {
            const transformations = query["TRANSFORMATIONS"];
            Log.trace("D2PlatformManager:applyTransformations - Started processing TRANSFORMATIONS");
            const grouped = this.group(transformations["GROUP"], results);
            results = this.apply(transformations["APPLY"], grouped);
            Log.trace("D2PlatformManager:applyTransformations - Completed processing TRANSFORMATIONS");
        }
        return results;
    }

    public applyOrder(order: any, results: Result[]): Result[] {
        if (order && typeof order === "string") {
            return this.sortResults(results, [order], "UP");
        } else if (order) {
            return this.sortResults(results, order["keys"], order["dir"]);
        }
    }

    //////////////////////////////////
    // applyTransformations helpers //
    //////////////////////////////////

    private group(groupKeys: string[], results: Result[]): any[][] {
        Log.trace("D2PlatformManager:group - Started grouping");
        const groups: any = {};
        for (const item of results) {
            const key = this.getGroupKey(groupKeys, item);
            if (groups[key]) {
                groups[key].push(item);
            } else {
                groups[key] = [item];
            }
        }
        Log.trace("D2PlatformManager:group - Completed grouping");
        return Object.values(groups);
    }

    private getGroupKey(groupKeys: string[], item: any): string {
        const values = [];
        for (const key of groupKeys) {
            values.push(item[key]);
        }
        return values.join("-");
    }

    private apply(apply: any, groups: any[][]): Result[] {
        Log.trace("D2PlatformManager:apply - Started apply");
        // For each apply rule
        for (const rule of apply) {
            const applyKey = Object.keys(rule)[0]; // e.g. maxAvg
            const op = Object.keys(rule[applyKey])[0]; // e.g. AVG
            const targetKey = rule[applyKey][op]; // e.g. courses_avg
            // For each group
            for (const group of groups) {
                const values = group.map((x: any) => x[targetKey]);
                switch (op) {
                    case "AVG":
                        let acc = new Decimal(0);
                        for (const item of values) {
                            acc = acc.plus(new Decimal(item));
                        }
                        const res = acc.toNumber() / values.length;
                        group[0][applyKey] = Number(res.toFixed(2));
                        break;
                    case "SUM":
                        group[0][applyKey] = Number(values.reduce((a, b) => b + a).toFixed(2));
                        break;
                    case "MAX":
                        group[0][applyKey] = values.reduce((a, b) => b > a ? b : a);
                        break;
                    case "MIN":
                        group[0][applyKey] = values.reduce((a, b) => b < a ? b : a);
                        break;
                    case "COUNT":
                        const unique: (string | number)[] = [];
                        for (const item of values) {
                            if (!unique.includes(item)) {
                                unique.push(item);
                            }
                        }
                        group[0][applyKey] = unique.length;
                        // Cooler version: group[0][targetKey] = [... new Set(values)].length;
                        break;
                }
            }
        }
        Log.trace("D2PlatformManager:apply- Completed apply");
        return groups.map((x) => x[0]); // Return all the first elements
    }

    private validateApplyStruture(apply: any): void {
        for (const rule of apply) {
            QueryValidator.enforceObject(rule, "Apply rule");
            QueryValidator.enforceSingleKey(rule, "Apply rule");
            const body = Object.values(rule)[0];
            QueryValidator.enforceObject(body, "Apply body");
            QueryValidator.enforceSingleKey(body, "Apply body");
            const innerVal = Object.values(body)[0];
            if (typeof innerVal !== "string" || !innerVal.includes("_")) {
                throw new InsightError("Invalid apply rule target key");
            }
        }
    }

    // validateTransformationValues helper
    /**
     * Validates the core component of an APPLY rule e.g. {"MAX": "courses_avg"} for operator and key correctness
     * Throws an error if something is incorrect, which will specify the issue as best as possible in its message
     */
    private validateApplyBodyValues(apply: any, id: string, kind: InsightDatasetKind): void {
        const applyBodies = apply.map((x: any) => Object.values(x)[0]);
        for (const body of applyBodies) {
            const operator: any = Object.keys(body)[0];
            const key: any = body[operator];
            switch (operator) {
                case "AVG":
                case "MAX":
                case "MIN":
                case "SUM":
                    QueryValidator.keyCheckTyped(operator, key, "number", id, kind);
                    break;
                case "COUNT":
                    QueryValidator.keyCheckTypeless(operator, key, id, kind);
                    break;
                default:
                    throw new InsightError("Invalid transformation operator");
            }
        }
    }

    // applyOrder helper
    /**
     * Sorts final results list. Uses D2 formatting, D1 formatting should be modified to match
     * @param {Result[]} arr - The final array of results to be sorted
     * @param {string[]} keys - An array of keys to be sorted on
     * @param {string} dir - "UP" or "DOWN"
     * @returns {Result[]} - The new sorted array
     */
    private sortResults(arr: Result[], keys: string[], dir: string): Result[] {
        const dirModifier = (dir === "UP") ? 1 : -1; // Swaps order if dir is "DOWN"
        return arr.sort((a, b) => {
            for (const key of keys) {
                if (a[key] > b[key]) {
                    return 1 * dirModifier;
                } else if (a[key] < b[key]) {
                    return -1 * dirModifier;
                }
            }
            return 0;
        });
    }

    // checkColumnsKey helpers
    private isApplyKey(transformations: any, key: string): boolean {
        return transformations && this.getAllApplyKeyNames(transformations).includes(key);
    }

    /**
     * @returns {string[]} - all user defined APPLY keys, e.g. ["maxAvg", "key2"]
     */
    private getAllApplyKeyNames(transformations: any): string[] {
        return transformations["APPLY"].map((x: any) => Object.keys(x)[0]);
    }

    // validateKind helper
    /**
     * Checks if the key has the same InsightDatasetKind as a reference in this.kind
     * @param {string} key - key to be checked
     * @returns {boolean}
     */
    private isSameDatasetKind(key: string, kind: InsightDatasetKind): boolean {
        const datasetKeys: string[] = (kind === InsightDatasetKind.Courses) ? QueryValidator.courseKeys : QueryValidator.roomKeys;
        return datasetKeys.includes(key.split("_")[1]);
    }

}
