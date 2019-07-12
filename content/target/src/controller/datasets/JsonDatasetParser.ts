import {IDatasetParser} from "./IDatasetParser";
import {Course} from "./DatasetManager";
import Log from "../../Util";
const JSZip = require("jszip");

/**
 * Parses a zip file of JSON course data
 */
export default class JsonDatasetParser implements IDatasetParser {

    constructor() {} // This could be a static class but interfaces don't do static ¯\_(ツ)_/¯

    /**
     * Handles parsing for html courses dataset
     * @param {string} input - the zip file to parse
     * @param {string} id - user given id. Used for key naming
     * @returns {Promise<Course[]>} - Promise of all valid course sections in the dataset
     */
    public parse(input: string, id: string): Promise<Course[]> {
        Log.trace("JsonDatasetParser:parse - Start");
        const zip = new JSZip();
        return new Promise((resolve, reject) => {
            zip.loadAsync(input, {base64: true}).then((content: any) => {
                Log.trace("JsonDatasetParser:parse - loadAsync complete");
                const promises: Promise<Course[]>[] = [];
                for (const key of Object.keys(content.files)) {
                    if (key.startsWith("courses/") && key !== "courses/") {
                        promises.push(this.parseSingleFile(content.files[key], id));
                    }
                }
                Log.trace("JsonDatasetParser:parse - File indexing complete, waiting on file parsing");
                Promise.all(promises).then((res: Course[][]) => {
                    Log.trace("JsonDatasetParser:parse - Parsing complete, joining arrays");
                    const final: Course[] = [];
                    for (const arr of res) {
                        final.push(...arr);
                    }
                    if (final.length > 0) {
                        return resolve(final);
                    } else {
                        return reject("No results found");
                    }
                });
            }).catch((err: any) => {
                return reject("Initial unzip failed: " + err.toString());
            });
        });
    }

    /**
     *
     * @param zippedFile - A single file from the zip, intended to be JSON
     * @param {string} id - user provided id. Used for key naming
     * @returns {Promise<Course[]>} - the array of course sections in the file. Empty for any errors
     */
    private parseSingleFile(zippedFile: any, id: string): Promise<Course[]> {
        const that = this;
        return new Promise((resolve, reject) => {
           zippedFile.async("text").then((res: string) => {
               let json: any;
               try {
                   json = JSON.parse(res);
                   // return array of Course formatted objects inside
                   resolve(json["result"].map((x: any) => that.makeCourseObject(x, id)));
               } catch (e) {
                   resolve([]); // Got nothing valid
               }
           }).catch((err: any) => {
               resolve([]); // Got nothing valid
           });
        });
    }

    /**
     * Given a course section from a file, makes a course object with the appropriately named keys
     * @param data - one course section JSON object
     * @param {string} id - user provided id
     * @returns {Course} - properly formatted course object
     */
    private makeCourseObject(data: any, id: string): Course {
        const obj: Course = {};
        obj[`${id}_dept`] = data["Subject"];
        obj[`${id}_id`] = data["Course"];
        obj[`${id}_avg`] = data["Avg"];
        obj[`${id}_instructor`] = data["Professor"];
        obj[`${id}_title`] = data["Title"];
        obj[`${id}_pass`] = data["Pass"];
        obj[`${id}_fail`] = data["Fail"];
        obj[`${id}_audit`] = data["Audit"];
        obj[`${id}_uuid`] = data["id"].toString();
        obj[`${id}_year`] = Number(data["Year"]);
        if (data["Section"] === "overall") {
            obj[`${id}_year`] = 1900;
        }
        return obj;
    }
}
