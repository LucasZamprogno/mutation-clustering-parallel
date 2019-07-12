import {IDatasetParser} from "./IDatasetParser";
import {Room} from "./DatasetManager";
import Log from "../../Util";
import * as http from "./GeocoderHttpSerivceMock";

import * as JSZip from "jszip";
import * as parse5 from "parse5";

interface GeoResponse {
    lat?: number;
    lon?: number;
    error?: string;
}

/**
 * Parses a zip file of HTML building data
 */
export default class HtmlDatasetParser implements IDatasetParser {

    constructor() {} // This could be a static class but interfaces don't do static and I wanted one ¯\_(ツ)_/¯

    /**
     * Handles parsing for html rooms dataset
     * @param {string} input - the zip file to parse
     * @param {string} id - user given id. Used for key naming
     * @returns {Promise<Room[]>} - Promise of all valid rooms in the dataset
     */
    public parse(input: string, id: string): Promise<Room[]> {
        Log.trace("HtmlDatasetParser:parse - Start");
        let zip = new JSZip();
        return new Promise((resolve, reject) => {
            zip.loadAsync(input, {base64: true}).then((content: any) => {
                Log.trace("HtmlDatasetParser:parse - loadAsync complete");
                let promises: Promise<Room[]>[] = [];
                const inner = content.folder("rooms");
                this.getFilenamesFromIndex(inner.file("index.htm")).then((fileNames: string[]) => {
                    Log.trace("HtmlDatasetParser:parse - File indexing complete, waiting on file parsing");
                    promises = fileNames.map((x) => this.getRoomsFromBuilding(x, inner.file(x), id));
                    // TODO fix above to use new method that takes file
                    Promise.all(promises).then((res: Room[][]) => {
                        Log.trace("HtmlDatasetParser:parse - Parsing complete, joining arrays");
                        let final: Room[] = [];
                        for (let arr of res) {
                            final.push(...arr);
                        }
                        if (final.length > 0) {
                            return resolve(final);
                        } else {
                            return reject("No results found");
                        }
                    });
                });
            }).catch((err: any) => {
                return reject("Initial unzip failed: " + err.toString())
            });
        });
    }

    /**
     * Parses the links found in the index table
     * @param file - the unzipped index.htm file
     * @returns {Promise<string[]>} - all the filepaths to valid buildings
     */
    private getFilenamesFromIndex(file: any): Promise<string[]> {
        Log.trace("HtmlDatasetParser:getFilenamesFromIndex - Start");
        return file.async("text").then((html: string) => {
            const tree = parse5.parse(html);
            const section = this.findElement(tree, "div", "class", "view-id-buildings_and_classrooms");
            const table = this.findElement(section, "table", "class", "table");
            Log.trace("HtmlDatasetParser:getFilenamesFromIndex - Completed");
            return this.extractPaths(table);
        });
    }

    /**
     * Given the table in the index, gathers the paths from the links
     * @param table - parse5 node corresponding to the index table
     * @returns {string[]} - all the filepaths to valid buildings
     */
    private extractPaths(table: any): string[] {
        const arr = table.childNodes[3].childNodes; // Children (rows) of tbody
        const links: string[] = [];
        for (let i = 1; i < arr.length; i += 2) { // Odd elements, skip #text nodes
            const linkedElem = arr[i].childNodes[9].childNodes[1]; // tr > td > a
            for (const attr of linkedElem.attrs) {
                if (attr.name && attr.name === "href") {
                    links.push(attr.value.substring(2)); // Substring to remove ./
                    break;
                }
            }
        }
        return links;
    }

    /**
     * Gets all the specific building entries from a file
     * @param {string} filepath - the path to this file, used to extract the shortname
     * @param file - the zipped html file
     * @param {string} id - user provided id, used for key naming
     * @returns {Promise<Room[]>} - All the parsed rooms
     */
    private getRoomsFromBuilding(filepath: string, file: any, id: string): Promise<Room[]> {
        return new Promise<Room[]>((resolve, reject) => {
            if (file === null) {
                resolve([]);
            }
            const shortname = filepath.split("/").pop();
            file.async("text").then((html: string) => {
                const rooms: any = [];
                const tree = parse5.parse(html);
                const main = this.findElement(tree, "div", "class", "view-display-id-page_1");
                const headerElem = this.findElement(main, "h2");
                const fullname = this.findElement(headerElem, "span").childNodes[0].value.trim(); // h2 > span > text
                const addressElem = this.findElement(main, "div", "id", "building-info");
                const address = addressElem.childNodes[3].childNodes[0].childNodes[0].value.trim();
                const roomTable = this.findElement(main, "tbody");
                if (roomTable) { // Building has rooms listings
                    for (let i = 1; i < roomTable.childNodes.length; i += 2) {
                        rooms.push(this.getRoomFromRow(roomTable.childNodes[i], id));
                    }
                    // Add geolocation and all other building-specific info to each room
                    this.getGeolocation(address).then((res) => {
                        for (const r of rooms) {
                            r[`${id}_fullname`] = fullname;
                            r[`${id}_address`] = address;
                            r[`${id}_shortname`] = shortname;
                            r[`${id}_name`] = shortname + "_" + r[`${id}_number`];
                            r[`${id}_lat`] = res.lat;
                            r[`${id}_lon`] = res.lon;
                        }
                        resolve(rooms);
                    }).catch((err) => {
                        Log.warn("Error getting geolocation " + err);
                        resolve([]); // Not defined behaviour, choosing to consider the rooms invalid
                    });
                } else {
                    resolve([]);
                }
            }).catch((err: any) => {
                Log.warn("HtmlDatasetParser:getFilenamesFromIndex - Warn: " + err);
                resolve([]);
            });
        });

    }

    /**
     * Gets the room specific details from its row in the table
     * @param row - the parse5 object corresponding to the table row
     * @param {string} id - user provided id, used for key naming
     * @returns {Room} - A partial room entry with only the room specific information
     */
    private getRoomFromRow(row: any, id: string) {
        const obj: Room = {};
        obj[`${id}_number`] = row.childNodes[1].childNodes[1].childNodes[0].value.trim(); // td > a > text
        obj[`${id}_seats`] = Number(row.childNodes[3].childNodes[0].value.trim()); // td > text
        obj[`${id}_furniture`] = row.childNodes[5].childNodes[0].value.trim(); // td > text
        obj[`${id}_type`] = row.childNodes[7].childNodes[0].value.trim(); // td > text
        obj[`${id}_href`] = row.childNodes[9].childNodes[1].attrs[0].value.trim(); // td > a > text
        return obj;
    }

    /**
     * Makes the http request to the geolocation service.
     * @param {string} addr - the building address
     * @returns {Promise<GeoResponse>} - Promise of the georesponse data, rejects on any sort of error
     */
    private getGeolocation(addr: string): Promise<GeoResponse> {
        return new Promise((resolve, reject) => {
            // Make request with encoded URI
            http.get("http://localhost:11316/api/v1/team000/" + encodeURI(addr), (res) => {
                if (res.statusCode !== 200) {
                    Log.warn("Got status " + res.statusCode);
                    reject({error: "Failed Geolocation, non-200 code"});
                }
                let rawData = ""; // Empty buffer
                res.on("data", (chunk) => {
                    rawData += chunk; // Add to buffer
                });
                res.on("end", () => {
                    try {
                        // Attempt parse. Throws error if not JSON
                        const parsedData = JSON.parse(rawData);
                        // Got a response, but in error
                        if (parsedData.error) {
                            reject(parsedData);
                        } else {
                            resolve(parsedData);
                        }
                    } catch (e) {
                        reject({error: "Failed Geolocation, invalid JSON"});
                    }
                });
                res.on("error", (e) => {
                    // Not sure if this one is needed
                    reject({error: `Failed Geolocation: ${e.message}`});
                });
            }).on("error", (e) => {
                // Request failed, server not responding etc.
                Log.error(`Failed Geolocation: ${e.message}`);
            });
        });
    }

    /**
     * Recursive DFS tree search. attr and identifier should both be present or both be absent
     * @param current - the current parse5 node in the tree under inspection
     * @param {string} node - the node type you're looking for (e.g. div, table, tr)
     * @param {string} attr - (optional) the attribute being looked for. Either "id" or "class"
     * @param {string} value - what attr should be ("main" if you're looking for "id"="main")
     * @returns {any} - the target element, or null
     */
    private findElement(current: any, node: string, attr?: string, value?: string): any {
        if (!attr && this.isNodeType(current, node)) { // Not checking attr, right type
            return current;
        } else if (this.isNodeType(current, node) && this.hasAttr(current, attr, value)) {
            return current;
        }
        // Not target, check children
        if (current.childNodes && current.childNodes.length > 0) {
            for (const subElem of current.childNodes) {
                const result = this.findElement(subElem, node, attr, value);
                if (result) {
                    return result;
                }
            }
            return null; // No child was, or contained, the target
        } else {
            return null; // No children
        }
    }

    /**
     * Checks if an element has a specific id or class
     * @param elem - parse5 element
     * @param {string} attr - attribute type. "id" or "class"
     * @param {string} value - what attr should be ("main" if you're looking for "id"="main")
     * @returns {boolean}
     */
    private hasAttr(elem: any, attr: string, value: string): boolean {
        if (attr === "id") {
            const foundAttr = this.getAttr(elem, "id");
            return foundAttr && foundAttr === value;
        } else {
            const foundAttr = this.getAttr(elem, "class");
            return foundAttr && foundAttr.includes(value);
        }
    }

    /**
     * Simple check for the nodeName
     * @param elem - current parse5 element
     * @param {string} type - type of node (e.g. div, table, tr)
     * @returns {boolean}
     */
    private isNodeType(elem: any, type: string): boolean {
        return (elem.nodeName && elem.nodeName === type);
    }

    /**
     * Retrieve the attribute value from an element
     * @param elem - current parse5 element
     * @param {string} attr - target attribute e.g. class, id, href
     * @returns {string}
     */
    private getAttr(elem: any, attr: string): string {
        // Check for a class entry in attributes, return false if none found, otherwise set elemClasses
        if (!elem.attrs || elem.attrs.length === 0) {
            return "";
        }
        for (const a of elem.attrs) {
            if (a.name && a.name === attr) {
                return a.value;
            }
        }
    }
}
