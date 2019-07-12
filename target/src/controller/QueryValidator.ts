import {kindMap} from "./datasets/DatasetManager";
import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import Log from "../Util";
import {Platform} from "./platform/Platform";

/**
 * Handles validation of queries. Checks all types, keys, inputs, lengths of inputs, etc. are correct
 * Also checks that the referenced dataset has already been added
 * Does not check any logic, or the data contained in the referenced dataset
 * One callable method, validateAndGetId, which is void and throws errors if the query is malformed
 */
export default class QueryValidator {
    private static mKeys: string[] = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"];
    private static sKeys: string[] = ["dept", "id", "instructor", "title", "uuid", "fullname", "shortname", "number", "name", "address", "type", "furniture", "href"];
    public static courseKeys: string[] = ["dept", "id", "avg", "instructor", "title", "pass", "fail", "audit", "uuid", "year"];
    public static roomKeys: string[] = ["fullname", "shortname", "number", "name", "address", "lat", "lon", "seats", "type", "furniture", "href"];

    /**
     * The publicly callable method to do all checks on the query.
     * Throws an error if something is incorrect, which will specify the issue as best as possible in its message
     */
    public static validateAndGetId(query: any, map: kindMap): string {
        Log.trace("QueryValidator:validateAndGetId - Start");
        QueryValidator.validateStructure(query);
        const id = QueryValidator.getQueryId(query["OPTIONS"], query["TRANSFORMATIONS"]);
        const kind: InsightDatasetKind = map[id];
        if (!QueryValidator.exists(kind)) { // Dataset referenced no loaded
            throw new InsightError(`Referenced dataset \"${id}\" not added yet`);
        }
        QueryValidator.validateValues(query, id, kind);
        Log.trace("QueryValidator:validateAndGetId - Complete");
        return id;
    }

    /**
     * Validates structural components such as field types, array lengths, presence of required keys, etc.
     * Throws an error if something is incorrect, which will specify the issue as best as possible in its message
     */
    private static validateStructure(query: any): void {
        Log.trace("QueryValidator:validateStructure - Start");
        QueryValidator.enforceObject(query, "Query");
        const rootKeys = Object.keys(query);
        if (rootKeys.length > 3 || (rootKeys.length === 3 && !rootKeys.includes("TRANSFORMATIONS"))) { // Technically violates D1/D2 split
            throw new InsightError("Excess keys in query");
        }
        if (!query.hasOwnProperty("WHERE")) {
            throw new InsightError("Missing WHERE");
        } else {
            QueryValidator.enforceObject(query["WHERE"], "WHERE");
            if (Object.keys(query["WHERE"]).length > 0) {
                Log.trace("QueryValidator:validateFilterStructure - Start");
                QueryValidator.validateFilterStructure(query["WHERE"], "WHERE");
            } // else empty where
        }
        if (query.hasOwnProperty("OPTIONS")) {
            QueryValidator.validateOptionsStructure(query["OPTIONS"]);
        } else {
            throw new InsightError("Missing OPTIONS");
        }
        Platform.get().validateTransformationsStructure(query);
    }

    /**
     * Validates the structure of a filter component to the WHERE clause
     * Throws an error if something is incorrect, which will specify the issue as best as possible in its message
     * @param filter - A filter at any point in the WHERE
     * @param {string} parentName - The name of the key this is a value to. Used only in error messages
     */
    private static validateFilterStructure(filter: any, parentName: string): void {
        QueryValidator.enforceObject(filter, parentName);
        QueryValidator.enforceSingleKey(filter, parentName);
        const key: string = Object.keys(filter)[0];
        const value: any = filter[key];
        switch (key) {
            case "AND":
            case "OR":
                if (!Array.isArray(value) || value.length < 1) {
                    throw new InsightError(key + " must be a non-empty array");
                }
                for (const sub of filter[key]) {
                    QueryValidator.validateFilterStructure(sub, key);
                }
                break;
            case "NOT":
                QueryValidator.validateFilterStructure(value, key);
                break;
            case "GT":
            case "LT":
            case "EQ":
            case "IS":
                QueryValidator.enforceObject(value, key);
                QueryValidator.enforceSingleKey(value, key);
                break;
            default:
                throw new InsightError(`Invalid filter key: ${key}`);
        }
    }

    /**
     * Validates the structure of the OPTIONS clause of the query. Assumes it is already verified to exist
     * Throws an error if something is incorrect, which will specify the issue as best as possible in its message
     */
    private static validateOptionsStructure(options: any): void {
        Log.trace("QueryValidator:validateOptionsStructure - Start");
        QueryValidator.enforceObject(options, "OPTIONS");
        const keys = Object.keys(options);
        // If there are two keys, the second must be order, cannot have more than two keys
        if (keys.length > 2 || (keys.length === 2 && !keys.includes("ORDER"))) {
            throw new InsightError("Invalid keys in OPTIONS");
        }
        if (options.hasOwnProperty("COLUMNS")) {
            QueryValidator.validateColumnsStructure(options["COLUMNS"]);
        } else {
            throw new InsightError("OPTIONS missing COLUMNS");
        }
        if (options.hasOwnProperty("ORDER")) {
            QueryValidator.validateOrderStructure(options["ORDER"]);
        }
    }

    private static validateColumnsStructure(columns: any) {
        if (!QueryValidator.exists(columns) || !Array.isArray(columns) || columns.length < 1) {
            throw new InsightError("COLUMNS must be a non-empty array");
        }
    }

    private static validateOrderStructure(order: any) {
        if (!QueryValidator.exists(order)) {
            throw new InsightError("ORDER cannot be null or undefined");
        }
        Platform.get().validateOrderStructure(order);
    }

    /**
     * Throws an error if obj has more than one key:value pair
     * @param obj - any object
     * @param {string} name - name of the query element, used only for error message
     */
    public static enforceSingleKey(obj: any, name: string): void {
        const numKeys: number = Object.keys(obj).length;
        if (numKeys !== 1) {
            throw new InsightError(`${name} should only have 1 key, has ${numKeys}`);
        }
    }

    /**
     * Validates all semantic rules. Assumes structure has been previously checked (as do all helper functions)
     * E.g. Keys from same dataset, correct types for the dataset, no duplicate keys, ordered only by things in COLUMNS
     * Throws an error if something is incorrect, which will specify the issue as best as possible in its message
     */
    private static validateValues(query: any, id: string, kind: InsightDatasetKind): void {
        const where = query["WHERE"];
        const options = query["OPTIONS"];
        const transformations = query["TRANSFORMATIONS"];
        Log.trace("QueryValidator:validateValues - Start");
        Log.trace("QueryValidator:validateWhereValues - Start");
        QueryValidator.validateWhereValues(where, id, kind);
        QueryValidator.validateOptionsValues(options, transformations, id, kind);
        Platform.get().validateTransformationsValues(transformations, id, kind);
    }

    /**
     * Validates all semantic rules for WHERE
     * E.g. Keys from same dataset, correct types for the dataset and operator, strings have no asterisks in the middle
     * Throws an error if something is incorrect, which will specify the issue as best as possible in its message
     */
    private static validateWhereValues(item: any, id: string, kind: InsightDatasetKind): void {
        if (Object.keys(item).length === 0) {
            return;
        }
        const key: string = Object.keys(item)[0];
        const value: any = item[key];
        switch (key) {
            case "AND":
            case "OR":
                for (const sub of value) {
                    QueryValidator.validateWhereValues(sub, id, kind);
                }
                break;
            case "NOT":
                QueryValidator.validateWhereValues(value, id, kind);
                break;
            case "GT":
            case "LT":
            case "EQ":
                QueryValidator.validateWhereComparator(key, value, "number", id, kind);
                break;
            case "IS":
                QueryValidator.validateWhereComparator(key, value, "string", id, kind);
                const inputstring: any = Object.values(value)[0];
                QueryValidator.enforceInputstringRules(inputstring);
        }
    }

    /**
     * Validates all semantic rules in OPTIONS
     * E.g. Keys from same dataset or are found in APPLY, order keys appear in columns
     * Throws an error if something is incorrect, which will specify the issue as best as possible in its message
     */
    private static validateOptionsValues(options: any, transformations: any | null, id: string, kind: InsightDatasetKind): void {
        Log.trace("QueryValidator:validateOptionsValues - Start");
        const columns = options["COLUMNS"];
        const order = options["ORDER"];
        for (const key of columns) {
            Platform.get().validateColumnKey(transformations, key, id, kind);
        }
        if (QueryValidator.exists(order)) {
            Platform.get().validateOrderValues(order, columns);
        }
    }

    /**
     * Validates the comparison in a WHERE filter following an operator e.g. {"courses_avg": 50}
     * Throws an error if something is incorrect, which will specify the issue as best as possible in its message
     */
    private static validateWhereComparator(location: string, item: any, type: string, id: string, kind: InsightDatasetKind): void {
        const innerKey: string = Object.keys(item)[0];
        const innerValue: string | number = item[innerKey];
        QueryValidator.keyCheckTyped(location, innerKey, type, id, kind);
        if (typeof innerValue !== type) {
            throw new InsightError(`Invalid value type in ${location}, should be ${type}`);
        }
    }

    /**
     * Validates a key is formatted correctly, is in the same dataset, and is of the same kind as others
     * Throws an error if something is incorrect, which will specify the issue as best as possible in its message
     * @param {string} location - Where this key is from, used only for error messages
     * @param key - the key to be verified
     */
    public static keyCheckTypeless(location: string, key: any, id: string, kind: InsightDatasetKind): void {
        if (key.split("_").length !== 2 || !Platform.get().isValidNormalKey(key, kind)) {
            throw new InsightError(`Invalid key ${key} in ${location}`);
        }
        if (!QueryValidator.isSameDatasetId(key, id)) {
            throw new InsightError("Cannot query more than one dataset");
        }
        Platform.get().validateKind(location, key, kind);
    }

    /**
     * Validates a key is formatted correctly, is in the same dataset, and is of the same kind as others
     * Throws an error if something is incorrect, which will specify the issue as best as possible in its message
     * @param {string} location - Where this key is from, used only for error messages
     * @param key - the key to be verified
     * @param type - either "number" or "string"
     */
    public static keyCheckTyped(location: string, key: any, type: string, id: string, kind: InsightDatasetKind): void {
        QueryValidator.keyCheckTypeless(location, key, id, kind);
        if (!QueryValidator.isSameDataType(key, type)) {
            throw new InsightError(`Invalid key type in ${location}`);
        }

    }

    /**
     * Checks if the key has the same id as a reference in this.id
     * @param {string} key - key to be checked
     * @returns {boolean}
     */
    public static isSameDatasetId(key: string, id: string): boolean {
        return key.split("_")[0] === id;
    }

    /**
     * Checks if a key belongs to the correct group of keys for a certain data type
     * @param {string} key - key to be checked
     * @param {string} type - "number" or "string"
     * @returns {boolean}
     */
    private static isSameDataType(key: string, type: string): boolean {
        const typeKeys: string[] = (type === "number") ? QueryValidator.mKeys : QueryValidator.sKeys;
        return typeKeys.includes(key.split("_")[1]);
    }

    /**
     * Throws an error if the item is not an object (and not an 'object type' array, literal object)
     * @param item - component that should be an object
     * @param {string} name - name of the component, only used in error message
     */
    public static enforceObject(item: any, name: string): void {
        if (!QueryValidator.exists(item) || typeof item !== "object" || Array.isArray(item)) {
            throw new InsightError(name + " must be object");
        }
    }

    /**
     * Throws an error if the string contains an asterisk that is not at the beginning or end of the string
     * @param {string} str
     */
    private static enforceInputstringRules(str: any): void {
        if (typeof str !== "string") {
            throw new InsightError("IS input string is not a string");
        }
        if (str.startsWith("*")) {
            str = str.substring(1);
        }
        if (str.endsWith("*")) {
            str = str.substring(0, str.length - 1);
        }
        if (str.includes("*")) {
            throw new InsightError("Asterisks (*) can only be the first or last characters of input strings");
        }
    }

    public static exists(item: any): boolean {
        return item !== undefined && item !== null;
    }

    /**
     * Finds a key to get the dataset id from, then infers the type, storing in member variables
     * Throws an error if this can't be done (this can only happen when the query is invalid)
     */
    private static getQueryId(options: any, transformations: any): string {
        let id: string = null;
        for (const key of options["COLUMNS"]) {
            if (typeof key !== "string") {
                throw new InsightError("Invalid type of COLUMN key");
            }
            if (key.includes("_")) {
                id = key.split("_")[0];
                break;
            }
        }
        if (!QueryValidator.exists(id)) { // COLUMNS had no standard keys, should then be apply keys
            id = Platform.get().fetchIdFromGroup(transformations["GROUP"]);
        }
        if (id === "") {
            throw new InsightError("Referenced dataset cannot be empty string");
        }
        return id;
    }
}
