import {InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "../IInsightFacade";
import {IDatasetParser} from "./IDatasetParser";
import JsonDatasetParser from "./JsonDatasetParser";
import Log from "../../Util";
import HtmlDatasetParser from "./HtmlDatasetParser";
import {Platform} from "../platform/Platform";
const fs = require("fs");
const resolvePath = require("path").resolve;

// These used to be more specific, but need to supoprt custom IDs. Now just for convenience
export interface Course {
    [id: string]: string | number;
}

export interface Room {
    [id: string]: string | number;
}

interface Dataset {
    id: string;
    kind: InsightDatasetKind;
    numRows: number;
    data: Course[] | Room[];

}

export interface DatasetMap {
    [id: string]: Dataset;
}

export interface kindMap {
    [id: string]: InsightDatasetKind;
}

/**
 * For management of course and rooms datasets. Handles parsing, saving, deletion, listing, and metadata
 */
export default class DatasetManager {
    private readonly path: string;
    private readonly datasets: DatasetMap;

    /**
     * Initializes an empty set of datasets and attempt to load cached datasets from disk
     */
    constructor(cacheDir: string) {
        Log.trace("DatasetManager:constructor - Start");
        this.path = cacheDir;
        this.datasets = {};
        this.restoreDatasets();
    }

    /**
     * Used during instantiation, loads any cached files into memory immediately
     */
    private restoreDatasets(): void {
        Log.trace("DatasetManager:restoreDatasets - Start");
        try {
            fs.readdirSync(this.path).forEach((filename: string) => {
                try {
                    Log.trace("DatasetManager:restoreDatasets - Restoring " + filename);
                    const content: Dataset = JSON.parse(fs.readFileSync(this.path + filename));
                    this.datasets[content.id] = content;
                } catch (e) {
                    Log.warn("Error reading file " + filename);
                }
            });
        } catch (e) {
            Log.trace("DatasetManager:constructor - Directory not initialized");
        }

    }

    /**
     * See IInsightFacade.ts for more detail
     * @param {string} id - user provided dataset id
     * @param {string} content - base64 encoded zip file
     * @param {InsightDatasetKind} kind - Courses or Rooms
     * @returns {Promise<InsightResponse>}
     */
    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        Log.trace("DatasetManager:addDataset - Start");
        return new Promise((resolve, reject) => {
            if (!id || id === "") {
                return reject(new InsightError(`addDataset failed: Invalid id: ${id}`))
            }
            try {
                Log.trace("DatasetManager:addDataset - Check for pre-existing file");
                if (fs.existsSync(this.path + id + ".json")) {
                    return reject(new InsightError("addDataset failed: Dataset existed already"));
                }
            } catch (e) {
                Log.warn("Error checking if file exists: " + e.toString());
            }
            let parser: IDatasetParser;
            try {
                parser = Platform.get().getParser(kind);
            } catch (e) {
                return reject(e);
            }
            Log.trace("DatasetManager:addDataset - Beginning parse for type " + kind);
            parser.parse(content, id).then((data: Course[] | Room[]) => {
                const dataset: Dataset = {
                    id: id,
                    kind: kind,
                    numRows: data.length,
                    data: data,
                };
                try {
                    Log.trace("DatasetManager:addDataset - Beginning save to " + resolvePath(this.path));
                    if (!fs.existsSync(this.path)) {
                        fs.mkdirSync(this.path);
                    }
                    fs.writeFileSync(`${this.path}${id}.json`, JSON.stringify(dataset));
                    // Add to object
                    this.datasets[id] = dataset;
                    return resolve(Object.keys(this.datasets));
                } catch (err) {
                    Log.error("Failed to save dataset: " + err);
                    return reject(new InsightError(`addDataset failed: ${err.toString()}`));
                }
            }).catch((err) => {
                return reject(new InsightError(`addDataset failed: ${err.toString()}`));
            });
        });
    }

    /**
     * See IInsightFacade.ts for more detail
     * @param {string} id - user provided dataset id
     * @returns {Promise<InsightResponse>}
     */
    public removeDataset(id: string): Promise<string> {
        Log.trace("DatasetManager:removeDataset - Start");
        if (!id || id === "") {
            return Promise.reject(new InsightError(`removeDataset failed: Invalid id: ${id}`))
        }
        const path = `${this.path}${id}.json`;
        try {
            const inMem: boolean = typeof this.datasets[id] !== "undefined";
            const onDisk: boolean = fs.existsSync(path);
            if (!(inMem || onDisk)) {
                return Promise.reject(new NotFoundError(`No such dataset: ${id}`));
            }
            if (inMem) {
                delete this.datasets[id];
            }
            if (onDisk) {
                fs.unlinkSync(path);
            }
            return Promise.resolve(id);
        } catch (e) {
            return Promise.reject(new InsightError(`Remove failed: ${e.toString()}`));
        }
    }

    /**
     * See IInsightFacade.ts for more detail
     * @returns InsightDataset[]
     */
    public listDatasets(): Promise<InsightDataset[]> {
        Log.trace("DatasetManager:listDatasets - Start");
        // Extract relevant parts (not the data) from the dataset map
        const datasetList: InsightDataset[] = Object.values(this.datasets).map((x) => {
            return {
                id: x.id,
                kind: x.kind,
                numRows: x.numRows,
            };
        });
        return Promise.resolve(datasetList);
    }

    /**
     * Returns the course sections/rooms from the dataset specified by id
     * @param {string} id
     * @returns {Course[] | Room[]}
     */
    public getContentsOfDataset(id: string): Course[] | Room[] {
        Log.trace("DatasetManager:getContentsOfDataset - Start");
        let res: Course[] | Room[];
        try {
            res = JSON.parse(JSON.stringify(this.datasets[id].data)); // Make a copy. Longterm fix is change to group/apply
        } catch (e) {
            throw new InsightError(e.message);
        }
        return res;
    }

    /**
     * Makes a map of dataset id to InsightDatasetKind
     * @returns {kindMap}
     */
    public getKindMap(): kindMap {
        const newObj: kindMap = {};
        for (const key of Object.keys(this.datasets)) {
            newObj[key] = this.datasets[key].kind;
        }
        return newObj;
    }
}
