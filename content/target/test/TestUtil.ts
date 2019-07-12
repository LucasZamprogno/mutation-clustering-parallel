/**
 * Created by rtholmes on 2016-09-30.
 n */

import Log from "./Util";

var lodash = require('lodash');
var stringify = require('json-stable-stringify');
import {assert, expect} from 'chai';
import {IQueryTest} from "./IQueryTest";

export default class TestUtil {

    /**
     * Compare an input to expected array.
     *
     * Use the json-stable-stringify to sort the keys in each element (if the keys are out of order it doesn't match right).*
     *
     * If the sort key is provided we assume the expected is _already_ in the right order.
     *
     * If the sort key is null the order doesn't matter so we sort the array by its string value.
     *
     * @param input
     * @param expected
     * @param sortKey
     * @returns {boolean}
     */
    static compareJSONArrays(input: any[], expected: any[], sortKey: string | {}): boolean {

        // if order is significant they should already be in the right order
        let inCount = lodash.countBy(input, stringify);
        let exCount = lodash.countBy(expected, stringify);
        // Compares the two counts to check that the result is equal to the expected result
        let firstEqual = lodash.isEqual(inCount, exCount);
        if (!firstEqual) {
            try {
                Log.warn('compareJSONArray failure');
                Log.warn('compareJSONArray #in: ' + input.length + '; #expected: ' + expected.length);
                let extra = [];
                let notEnough = [];
                var keys = Object.keys(exCount).concat(Object.keys(inCount));
                if (keys.length > 200) {
                    return false;
                }
                // remove dupes
                keys = lodash.uniqWith(keys, lodash.isEqual);
                for (var k of keys) {
                    var inKeyCount = 0;
                    var exKeyCount = 0;
                    if (typeof inCount[k] !== 'undefined') {
                        inKeyCount = inCount[k];
                    }
                    if (typeof exCount[k] !== 'undefined') {
                        exKeyCount = exCount[k];
                    }
                    if (inKeyCount > exKeyCount) {
                        extra.push(k);
                    } else if (exKeyCount > inKeyCount) {
                        notEnough.push(k);
                    } else {
                        // noop
                    }
                }
                const BUFLENGTH = 512;
                let notEnoughString = JSON.stringify(notEnough);
                if (notEnoughString.length > BUFLENGTH) {
                    notEnoughString = notEnoughString.substr(0, BUFLENGTH) + '...';
                }
                let extraString = JSON.stringify(extra);
                if (extraString.length > BUFLENGTH) {
                    extraString = extraString.substr(0, BUFLENGTH) + '...';
                }
                Log.trace('compareJSONArray missing values ( ' + notEnough.length + ' ): ' + notEnoughString);
                Log.trace('compareJSONArray extraneous values ( ' + extra.length + ' ): ' + extraString);

                let inString = JSON.stringify(input);
                let expectedString = JSON.stringify(expected);

                if (inString.length < BUFLENGTH * 4) {
                    Log.trace('compareJSONArray - full input value: ' + inString);
                } else {
                    Log.trace('compareJSONArray - full input too long to print, first part: ' + inString.substr(0, BUFLENGTH * 3));
                }
                if (expectedString.length < BUFLENGTH * 4) {
                    Log.trace('compareJSONArray - full expected value: ' + expectedString);
                } else {
                    Log.trace('compareJSONArray - full expected value too long to print, first part: ' + expectedString.substr(0, BUFLENGTH * 3));
                }
                // Log.trace('compareJSONArray missing values: ' + lodash.difference(inCount, exCount));
                // Log.trace('compareJSONArray extraneous values: ' + lodash.difference(exCount, inCount));
            } catch (err) {
                // the above is complicated, just do this to be safe
                Log.error('compareJSONArray ERROR: ' + err.message);
            }
            return false;
        }

        if (sortKey !== null) {
            // if sorted, loop through the elems
            if (input.length > 0) {
                if (typeof sortKey === "string") {
                    let previous = (input[0])[sortKey];
                    let current: any = null;
                    for (let entry of input) {
                        current = entry[sortKey];
                        // Log.trace('previous: ' + previous + '; current: ' + current);
                        if (previous > current) {
                            Log.warn('compareJSONArray sort failure ( on ' + sortKey + ' )');
                            Log.trace('compareJSONArray expected: ' + JSON.stringify(previous) + " to be less than: " + JSON.stringify(current));
                            return false;
                        }
                        previous = current;
                    }
                } else {
                    //TODO TS 2.0 would know this is an object now
                    if ((<any>sortKey)["dir"] === "DOWN") {
                        input.reverse();
                    }
                    let previous = (input[0]);
                    for (let entry of input) {
                        let terms = (<any>sortKey)["keys"];
                        while (terms.length > 0) {
                            let term = terms.shift();
                            let previousValue = previous[term];
                            let currentValue = entry[term];
                            if (previousValue > currentValue) {
                                Log.warn('compareJSONArray sort failure ( on ' + sortKey + ' )');
                                Log.trace('compareJSONArray error:' + JSON.stringify(previousValue) + " should appear before: " + JSON.stringify(currentValue));
                                return false;
                            } else if (previousValue == currentValue) {
                                continue;
                            } else {
                                break;
                            }
                        }
                    }
                }
            }
        }
        return true;
    }

    static verifyResult(test: IQueryTest, res: any) {
        expect(res).to.be.an("array");

        const expectedResult: any = test["result"];

        let sortKey: any = null;
        if (typeof test["query"]["OPTIONS"]["ORDER"] !== 'undefined') {
            sortKey = test["query"]["OPTIONS"]["ORDER"];
        }
        const sameOutput = TestUtil.compareJSONArrays(res, expectedResult, sortKey);
        expect(sameOutput).to.be.true;
    }

    static basicArrayCompare(arr1: string[], arr2: string[]) {
        expect(arr1.length).to.be.equal(arr2.length);
        expect(arr1).to.deep.include.members(arr2);
    }
}

