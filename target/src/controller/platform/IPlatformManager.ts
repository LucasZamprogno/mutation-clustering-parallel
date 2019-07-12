import {Result} from "../QueryProcessor";
import {IDatasetParser} from "../datasets/IDatasetParser";
import {InsightDatasetKind} from "../IInsightFacade";

export interface IPlatformManager {

    /**
     * Preloads dataset(s) for the UI
     * @returns {Promise<void>}
     */
    preloadDatasets(): Promise<void>;

    /**
     * Returns appropriate parser or throws error
     * @param {InsightDatasetKind} kind
     * @returns {IDatasetParser}
     */
    getParser(kind: InsightDatasetKind): IDatasetParser;

    /**
     * @param order - Order value. String in D1
     */
    validateOrderStructure(order: any): void;

    /**
     * Checks all structure of the transformation. Does nothing for D1
     * @param query
     */
    validateTransformationsStructure(query: any): void;

    /**
     * @param order - Item to order by. String in D1
     * @param columns - Columns array
     */
    validateOrderValues(order: any, columns: any): void;

    /**
     * Validates a single key from COLUMNS
     * @param transformations - null in D1
     * @param {string} key - Key to check
     * @param {string} id - id of dataset being queried
     * @param {InsightDatasetKind} kind - kind of dataset being queried
     */
    validateColumnKey(transformations: any, key: string, id: string, kind: InsightDatasetKind): void;

    /**
     * Validates the contents of group and apply
     * @param transformations - transformations object
     * @param {string} id - current dataset to query
     * @param {InsightDatasetKind} kind - kind of current dataset
     */
    validateTransformationsValues(transformations: any, id: string, kind: InsightDatasetKind): void;

    /**
     * Checks for a key with the dataset in the APPLY rules. Returns null in D1.
     * @param apply - Apply array
     * @returns {string} - Dataset id
     */
    fetchIdFromGroup(group: any): string;

    /**
     * Ensures the key is from the same dataset kind. Does nothing in D1 (only one kind)
     * @param {string} key
     * @param {InsightDatasetKind} kind
     */
    validateKind(location: string, key: string, kind: InsightDatasetKind): void;

    /**
     * Is the key underscore separated, and is the last part in the appropriate list of keys
     * @param {string} key - key to be checked
     * @param {InsightDatasetKind} kind - "courses" or "rooms"
     * @returns {boolean}
     */
    isValidNormalKey(key: string, kind: InsightDatasetKind): boolean;

    /**
     *
     * @param query
     * @param {Result[]} results
     * @returns {Result[]}
     */
    applyTransformations(query: any, results: Result[]): Result[];

    /**
     * Sorts results based on string or object
     * @param {string} order - Sorting rule. String in D1, string or object in D2
     * @param {Result[]} results - Pre-sorting results
     * @returns {Result[]} - Post-sorting results
     */
    applyOrder(order: any, results: Result[]): Result[];

}
