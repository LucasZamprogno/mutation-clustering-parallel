import {IPlatformManager} from "./IPlatformManager";

import {Result} from "../QueryProcessor";
import {IDatasetParser} from "../datasets/IDatasetParser";
import {InsightDatasetKind, InsightError} from "../IInsightFacade";
import JsonDatasetParser from "../datasets/JsonDatasetParser";
import QueryValidator from "../QueryValidator";
import Log from "../../Util";
import InsightFacade from "../InsightFacade";
import * as fs from "fs";

export default class D1PlatformManager implements IPlatformManager {

    constructor() {}

    public preloadDatasets() {
        const facade: InsightFacade = new InsightFacade();
        Log.info("Reading courses dataset");
        const coursesDataset = fs.readFileSync("./resources/310courses.1.0.zip").toString("base64");
        return facade.addDataset("courses", coursesDataset, InsightDatasetKind.Courses)
            .then(function (response: string[]) {
                Log.info("Done adding courses");
            });
    }

    public getParser(kind: InsightDatasetKind): IDatasetParser {
        if (kind === InsightDatasetKind.Courses) {
            return new JsonDatasetParser();
        } else {
            throw new InsightError(`Invalid kind: ${kind}`);
        }
    }

    public validateOrderStructure(order: any): void {
        if (typeof order !== "string") {
            throw new InsightError("Invalid ORDER type");
        }
    }

    public validateTransformationsStructure(transformations: any): void {}

    public validateOrderValues(order: any, columns: any): void {
        if (!columns.includes(order)) {
            throw new InsightError("ORDER key must be in COLUMNS");
        }
    }

    public validateColumnKey(transformations: any, key: string, id: string, kind: InsightDatasetKind): void {
        QueryValidator.keyCheckTypeless("COLUMNS", key, id, kind);
    }

    public validateTransformationsValues(transformations: any): void {}

    public fetchIdFromGroup(group: any): string {
        return null;
    }

    public validateKind(location: string, key: string, kind: InsightDatasetKind): void {}

    public isValidNormalKey(key: string, kind: InsightDatasetKind): boolean {
        let isValid = false;
        const split = key.split("_");
        if (split.length > 1) {
            isValid = QueryValidator.courseKeys.includes(split[split.length - 1]);
        }
        return isValid;
    }

    public applyTransformations(query: any, results: Result[]): Result[] {
        return results;
    }

    public applyOrder(order: any, results: Result[]): Result[] {
        return results.sort((a, b) => a[order] > b[order] ? 1 : -1);
    }

}
