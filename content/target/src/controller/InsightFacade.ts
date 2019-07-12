import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import DatasetManager from "./datasets/DatasetManager";
import QueryValidator from "./QueryValidator";
import QueryProcessor from "./QueryProcessor";
import {InsightError, NotFoundError} from "./IInsightFacade";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 * GENERAL NOTES AND COMMENTS ABOUT THIS IMPLEMENTATION
 * 1) if (foo) may be used as shorthand for (typeof foo === 'undefined') or (foo === null)
 *    in these cases foo must be something truthy any time it is not undefined or null
 * 2) array.map, array.filter, and array.reduce are used frequently
 *    students often aren't aware of these methods, and will do the simple loops they represent instead
 *    if you're not already familiar with these methods, knowing them is highly recommended
 * 3) For anonymous functions, (foo) => {} syntax is used over function (foo) {}
 *    This is to preserve scope of 'this' for promises, because it's shorter, and for consistency
 */
export default class InsightFacade implements IInsightFacade {
    private datasetManager: DatasetManager;
    private static readonly dataDir: string = __dirname + "/../../data/";

    constructor() {
        this.datasetManager = new DatasetManager(InsightFacade.dataDir);
        Log.trace("InsightFacadeImpl::init()");
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        return this.datasetManager.addDataset(id, content, kind);
    }

    public removeDataset(id: string): Promise<string> {
        return this.datasetManager.removeDataset(id);
    }

    public performQuery(query: any): Promise <any[]> {
        const processor = new QueryProcessor();
        try {
            // Following line does all validation, also saves id, throws error on bad format
            const datasetId = QueryValidator.validateAndGetId(query, this.datasetManager.getKindMap());
            const data = this.datasetManager.getContentsOfDataset(datasetId);
            const result = processor.process(query, data);
            return Promise.resolve(result);
        } catch (e) {
            return Promise.reject(e);
        }
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return this.datasetManager.listDatasets();
    }
}
