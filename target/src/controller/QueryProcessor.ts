import {Course, Room} from "./datasets/DatasetManager";
import Log from "../Util";
import {ResultTooLargeError} from "./IInsightFacade";
import {Platform} from "./platform/Platform";

export interface Result {
    [key: string]: string | number;
}

/**
 * Handles all processing for the query. Could be static but wanted it to be consistent with the validator
 */
export default class QueryProcessor {

    static readonly RESULT_MAX_SIZE = 5000;

    constructor() {}

    /**
     * Take the query and data to apply it to a Rooms or Courses dataset
     * @param query - The full query object
     * @param data - All the individual Room or Course entries from the dataset
     * @returns {Result[]} - Query results with all filtering, transformations, and options
     */
    public process(query: any, data: any): Result[] {
        Log.trace("QueryProcessor:process - Start");
        let results = this.getResults(query["WHERE"], data);
        results = Platform.get().applyTransformations(query, results);
        results = this.applyOptions(query["OPTIONS"], results);
        if (results.length > QueryProcessor.RESULT_MAX_SIZE) {
            throw new ResultTooLargeError(`The result is too big. Only queries with a maximum of ${QueryProcessor.RESULT_MAX_SIZE} results are supported.`);
        }
        Log.trace("QueryProcessor:process - Complete");
        return results;
    }

    /**
     * Handles the WHERE filtering portion of the query
     * @param where - the body of the WHERE
     * @param data - All the individual Course or Room entries from the dataset
     * @returns {Result[]} - All the final Course or Room objects with all keys
     */
    private getResults(where: any, data: any): Result[] {
        Log.trace("QueryProcessor:getResults - Started processing WHERE");
        let results: Result[] = [];
        if (Object.keys(where).length === 0) {
            results = data;
        } else {
            results = (data as any).filter((x: Course | Room) => {return this.evaluateClause(where, x)});
        }
        Log.trace("QueryProcessor:getResults - Completed processing WHERE");
        return results;
    }

    /**
     * Applies all OPTIONS rules to a final Results list
     * @param options - The body of the query's OPTIONS
     * @param {Result[]} results - The list of results from WHERE and possible TRANSFORMATIONS
     * @returns {Result[]} - The final array of Results to return
     */
    private applyOptions(options: any, results: Result[]): Result[] {
        Log.trace("QueryProcessor:applyOptions - Started processing OPTIONS");
        const order = options["ORDER"];
        const columns = options["COLUMNS"];
        results = results.map((x) => this.makeReducedObject(columns, x));
        if (order) {
            results = Platform.get().applyOrder(order, results);
        }
        Log.trace("QueryProcessor:applyOptions - Completed processing OPTIONS");
        return results;
    }

    /**
     * Makes an object with only the keys specified by COLUMNS
     * @param {string[]} keyArray - The array of COLUMNS keys
     * @param item - The specific Course or Room being reduced
     * @returns {Result} - A new result object with the correct keys
     */
    private makeReducedObject(keyArray: string[], item: any): Result {
        const newObj: Result = {};
        for (const key of keyArray) {
            newObj[key] = item[key];
        }
        return newObj;
    }

    /**
     * Recursive entry point to the WHERE filtering process
     * @param item - A filter object (e.g. {"GT":{"courses_avg":97}})
     * @param {Course | Room} data - A single Course or Room object
     * @returns {boolean} - Whether the data object should be included according to the item filter
     */
    private evaluateClause(item: any, data: Course | Room): boolean {
        const key = Object.keys(item)[0];
        const body = item[key];
        switch (key) {
            case "AND":
                return this.evaluateAnd(body, data);
            case "OR":
                return this.evaluateOr(body, data);
            case "NOT":
                return !this.evaluateClause(body, data);
            case "GT":
            case "LT":
            case "EQ":
                return this.evaluateMath(item, data); // Note 'item' not 'body', need the key
            case "IS":
                return this.evaluateString(body, data);
        }
    }

    /**
     * Returns true of all sub-filters are true
     * @param item - The body of an AND, an array of sub-filters
     * @param {Course | Room} data - A single Course or Room object
     * @returns {boolean} - Whether the data object should be included according to the item filter
     */
    private evaluateAnd(item: any, data: Course | Room): boolean {
        for (const subItem of item) {
            if (!this.evaluateClause(subItem, data)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Returns true if any sub-filters are true
     * @param item - The body of an OR, an array of sub-filters
     * @param {Course | Room} data - A single Course or Room object
     * @returns {boolean} - Whether the data object should be included according to the item filter
     */
    private evaluateOr(item: any, data: Course | Room): boolean {
        for (const subItem of item) {
            if (this.evaluateClause(subItem, data)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Evaluates whether the data matches the math expression on the given key
     * @param item - The body and key of a math filter (e.g. {"GT":{"courses_avg":97}})
     * @param {Course | Room} data - A single Course or Room object
     * @returns {boolean} - Whether the data object should be included according to the item filter
     */
    private evaluateMath(item: any, data: Course | Room): boolean {
        const operator: string = Object.keys(item)[0];
        const innerItem: any = item[operator];
        const targetKey: string = Object.keys(innerItem)[0];
        const targetValue: string | number = innerItem[targetKey] as number;
        const comparisonValue: string | number = data[targetKey];
        switch (operator) {
            case "GT":
                return comparisonValue > targetValue;
            case "EQ":
                return comparisonValue === targetValue;
            case "LT":
                return comparisonValue < targetValue;
        }
    }

    /**
     * Evaluates whether the data matches the string patten on the given key
     * @param item - The inner body of an IS filter (e.g. {"courses_dept":"adhe"})
     * @param {Course | Room} data - A single Course or Room object
     * @returns {boolean} - Whether the data object should be included according to the item filter
     */
    private evaluateString(item: any, data: Course | Room): boolean {
        const targetKey = Object.keys(item)[0];
        const inputString = item[targetKey];
        const inputLen = inputString.length;
        const targetString = data[targetKey] as string;
        if (inputString === "*" || inputString === "**") {
            return true;
        } else if (inputString.startsWith("*") && inputString.endsWith("*")) {
            return targetString.includes(inputString.substring(1, inputLen - 1));
        } else if (inputString.startsWith("*")) {
            return targetString.endsWith(inputString.substring(1, inputLen));
        } else if (inputString.endsWith("*")) {
            return targetString.startsWith(inputString.substring(0, inputLen - 1));
        } else {
            return targetString === inputString;
        }
    }
}
