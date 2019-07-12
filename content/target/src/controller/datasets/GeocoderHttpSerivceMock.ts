import {EventEmitter} from "events";
import * as fs from "fs-extra";
import Log from "../../Util";

let locationFileCache: {[address: string]: any};

/**
 * Mock node's http.IncomingMessage class
 */
export class IncomingMessage extends EventEmitter {
    statusCode: number;
}

/**
 * Mock node's http.get() method.
 *
 * Decodes the building address part of the URI and uses it to look up the lat/lon in the geocoder data file previously
 * loaded. If the building address exists, sets the statusCode to 200 and emits a data event with the stringified lat/lon
 * and an end event. Otherwise, sets the statusCode to 404 and emits and error event.
 *
 * @param url encoded URI containing the building address after the last /. URL must not contain a trailing /.
 * @param cb callback function that takes an IncomingMessage response.
 */
export function get(url: string, cb: (res: IncomingMessage) => void): EventEmitter {
    const res: IncomingMessage = new IncomingMessage();
    const address = decodeURI( url.substring(url.lastIndexOf("/") + 1));
    let latlon: any;
    if (!locationFileCache) {
        const path = __dirname + "/../../../../geocoder/loc2.json";
        locationFileCache = fs.readJSONSync(path);
        Log.trace("GeocoderHttpServerMock::get(..) - Loaded location file from: " + path);
    }
    
    latlon = locationFileCache[address];
    if (latlon) {
        res.statusCode = 200;
        cb(res);
        res.emit("data", JSON.stringify(latlon));
        res.emit("end");
    } else {
        res.statusCode = 404;
        cb(res);
        res.emit("error", "Address not found (" + address + ")");
    }

    return new EventEmitter();
}
