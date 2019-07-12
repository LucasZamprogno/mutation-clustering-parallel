"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("./Util");
var lodash = require('lodash');
var stringify = require('json-stable-stringify');
const chai_1 = require("chai");
class TestUtil {
    static compareJSONArrays(input, expected, sortKey) {
        let inCount = lodash.countBy(input, stringify);
        let exCount = lodash.countBy(expected, stringify);
        let firstEqual = lodash.isEqual(inCount, exCount);
        if (!firstEqual) {
            try {
                Util_1.default.warn('compareJSONArray failure');
                Util_1.default.warn('compareJSONArray #in: ' + input.length + '; #expected: ' + expected.length);
                let extra = [];
                let notEnough = [];
                var keys = Object.keys(exCount).concat(Object.keys(inCount));
                if (keys.length > 200) {
                    return false;
                }
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
                    }
                    else if (exKeyCount > inKeyCount) {
                        notEnough.push(k);
                    }
                    else {
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
                Util_1.default.trace('compareJSONArray missing values ( ' + notEnough.length + ' ): ' + notEnoughString);
                Util_1.default.trace('compareJSONArray extraneous values ( ' + extra.length + ' ): ' + extraString);
                let inString = JSON.stringify(input);
                let expectedString = JSON.stringify(expected);
                if (inString.length < BUFLENGTH * 4) {
                    Util_1.default.trace('compareJSONArray - full input value: ' + inString);
                }
                else {
                    Util_1.default.trace('compareJSONArray - full input too long to print, first part: ' + inString.substr(0, BUFLENGTH * 3));
                }
                if (expectedString.length < BUFLENGTH * 4) {
                    Util_1.default.trace('compareJSONArray - full expected value: ' + expectedString);
                }
                else {
                    Util_1.default.trace('compareJSONArray - full expected value too long to print, first part: ' + expectedString.substr(0, BUFLENGTH * 3));
                }
            }
            catch (err) {
                Util_1.default.error('compareJSONArray ERROR: ' + err.message);
            }
            return false;
        }
        if (sortKey !== null) {
            if (input.length > 0) {
                if (typeof sortKey === "string") {
                    let previous = (input[0])[sortKey];
                    let current = null;
                    for (let entry of input) {
                        current = entry[sortKey];
                        if (previous > current) {
                            Util_1.default.warn('compareJSONArray sort failure ( on ' + sortKey + ' )');
                            Util_1.default.trace('compareJSONArray expected: ' + JSON.stringify(previous) + " to be less than: " + JSON.stringify(current));
                            return false;
                        }
                        previous = current;
                    }
                }
                else {
                    if (sortKey["dir"] === "DOWN") {
                        input.reverse();
                    }
                    let previous = (input[0]);
                    for (let entry of input) {
                        let terms = sortKey["keys"];
                        while (terms.length > 0) {
                            let term = terms.shift();
                            let previousValue = previous[term];
                            let currentValue = entry[term];
                            if (previousValue > currentValue) {
                                Util_1.default.warn('compareJSONArray sort failure ( on ' + sortKey + ' )');
                                Util_1.default.trace('compareJSONArray error:' + JSON.stringify(previousValue) + " should appear before: " + JSON.stringify(currentValue));
                                return false;
                            }
                            else if (previousValue == currentValue) {
                                continue;
                            }
                            else {
                                break;
                            }
                        }
                    }
                }
            }
        }
        return true;
    }
    static verifyResult(test, res) {
        chai_1.expect(res).to.be.an("array");
        const expectedResult = test["result"];
        let sortKey = null;
        if (typeof test["query"]["OPTIONS"]["ORDER"] !== 'undefined') {
            sortKey = test["query"]["OPTIONS"]["ORDER"];
        }
        const sameOutput = TestUtil.compareJSONArrays(res, expectedResult, sortKey);
        chai_1.expect(sameOutput).to.be.true;
    }
    static basicArrayCompare(arr1, arr2) {
        chai_1.expect(arr1.length).to.be.equal(arr2.length);
        chai_1.expect(arr1).to.deep.include.members(arr2);
    }
}
exports.default = TestUtil;
//# sourceMappingURL=TestUtil.js.map