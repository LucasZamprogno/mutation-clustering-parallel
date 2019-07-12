import {InsightDataset} from "../src/controller/IInsightFacade";

/*
 * Collection of logging methods. Useful for making the output easier to read and understand.
 *
 * @param msg
 */
export default class Log {

		public static trace(msg: string) {
			console.log("<AT_T> " + new Date().toLocaleString() + ": " + msg);
		}

		public static info(msg: string) {
			console.log("<AT_I> " + new Date().toLocaleString() + ": " + msg);
		}

		public static warn(msg: string, obj?: any) {
			try {
				if (typeof obj === 'undefined') {
					if (typeof msg === 'object') {
						console.log("<AT_W> Object: " + new Date().toLocaleString() + ": " + JSON.stringify(msg));
					} else {
						console.log("<AT_W> " + new Date().toLocaleString() + ": " + msg);
					}
				} else {
					if (typeof obj === 'object') {
						if (obj instanceof Error) {
							console.log("<AT_W> Object: " + new Date().toLocaleString() + ": " + msg + "; err: " + obj.message);
						} else {
							console.log("<AT_W> Object: " + new Date().toLocaleString() + ": " + msg + "; err: " + JSON.stringify(obj));
						}
					} else {
						console.log("<AT_W> " + new Date().toLocaleString() + ": " + msg + "; err: " + obj);
					}
				}
			} catch (err) {
				console.log("<AT_W> " + new Date().toLocaleString() + ": Warning (printing error)");
			}
		}

		public static error(msg: string, obj?: any) {
			try {
				if (typeof obj === 'undefined') {
					if (typeof msg === 'object') {
						console.log("<AT_E> Object: " + new Date().toLocaleString() + ": " + JSON.stringify(msg));
					} else {
						console.log("<AT_E> " + new Date().toLocaleString() + ": " + msg);
					}
				} else {
					if (typeof obj === 'object') {
						if (obj instanceof Error) {
							console.log("<AT_E> Object: " + new Date().toLocaleString() + ": " + msg + "; err: " + obj.message);
						} else {
							console.log("<AT_E> Object: " + new Date().toLocaleString() + ": " + msg + "; err: " + JSON.stringify(obj));
						}
					} else {
						console.log("<AT_E> " + new Date().toLocaleString() + ": " + msg + "; err: " + obj);
					}
				}
			} catch (err) {
				console.log("<AT_E> " + new Date().toLocaleString() + ": Error (printing error)");
			}
		}

		public static test(msg: string) {
			console.log("<AT_X> " + new Date().toLocaleString() + ": " + msg);
		}

		public static writeRESTResponse(response: any) { // really restify IncomingMessage
			try {
				if (typeof response === 'undefined') {
					Log.warn("REST Response is undefined");
				} else if (response === null) {
					Log.warn("REST Response is null");
				} else if (response instanceof Error) {
					Log.warn("REST Response is Error; message: " + response.message);
				} else {
					if (typeof response.statusCode !== 'undefined') {
						Log.info("REST Response code type: " + typeof response.statusCode+ "; code: " + response.statusCode);
					} else {
						Log.warn("REST Response code: undefined")
					}
					if (typeof response.text!== 'undefined') {
						var body = response.text;
						let bodyString = '';
						if (typeof body === 'object') {
							bodyString = JSON.stringify(body);
						} else {
							bodyString = body;
						}
						if (bodyString.length > 128) {
							bodyString = bodyString.substring(0, 127) + "...";
						}
						Log.info("REST Response body type: " + typeof response.text+ '; body: ' + bodyString);
					} else {
						Log.warn("REST Response body: undefined");
					}
				}
			} catch (err) {
				Log.warn("Error parsing REST response");
			}
		}

		public static writeResponse(response: string | string[] | InsightDataset[] | Error) {
			try {
				if (typeof response === 'undefined') {
					Log.warn("Response is undefined");
				} else if (response === null) {
					Log.warn("Response is null");
				} else if (response instanceof Error) {
                    Log.warn("Response is Error; message: " + response.message);
                } else if (Array.isArray(response) || typeof response === "string") {
				    let asString = Array.isArray(response) ? JSON.stringify(response) : response;
                    if (asString.length > 128) {
                        asString = asString.substring(0, 127) + "...";
                    }
                    Log.info(`Response: ${asString}`);
				} else {
                    Log.warn("Unexpected response type, expected string, string[] or InsightDataset[]");
				}
			} catch (err) {
				Log.warn("Error parsing response");
			}
		}

		public static getDeliverableId(): string[] {
			let set = process.env.TS;
			if (typeof set === 'undefined') {
				return ['d1', 'd2', 'd3'];
			} else {
				if (set === 'd1') {
					return [set];
				} else if (set === 'd2') {
					return [set];
				} else if (set === 'd3') {
					return [set];
				} else {
					let msg = 'Util::getDeliverableId() - unknown deliverable specified: ' + set;
					Log.error(msg);
					throw new Error(msg);
				}
			}
		}
	}
