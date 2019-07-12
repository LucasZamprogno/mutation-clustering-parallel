"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
require("../UnhandledErrorChecker");
const Util_1 = require("../Util");
const InsightFacade_1 = require("../../src/controller/InsightFacade");
const IInsightFacade_1 = require("../../src/controller/IInsightFacade");
const fs = require("fs-extra");
const chai_1 = require("chai");
const TestUtil_1 = require("../TestUtil");
describe("InsightFacadeD1", function () {
    const id = "courses";
    const altId = "alternate";
    const smallId = "cpsc";
    const brokenId = "broken";
    const kind = IInsightFacade_1.InsightDatasetKind.Courses;
    const cacheDir = __dirname + "/../../data";
    let numRows;
    const datasetNotZip = new Buffer("adfadsfad").toString("base64");
    let facade = null;
    let dataset;
    let smallCPSCDataset;
    let singleInvalidFileDataset;
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            Util_1.default.info("FacadeDataset::before() - start");
            try {
                dataset = yield fs.readFile(__dirname + "/../../resources/310courses.1.0.zip", "base64");
                smallCPSCDataset = yield fs.readFile(__dirname + "/../../resources/310courses.cpsc.1.0.zip", "base64");
                singleInvalidFileDataset = yield fs.readFile(__dirname + "/../../resources/coursesWithBrokenJSON.zip", "base64");
                numRows = 64612;
            }
            catch (err) {
                Util_1.default.error("Failed to load dataset. " + err);
                throw err;
            }
        });
    });
    beforeEach(function () {
        return __awaiter(this, void 0, void 0, function* () {
            Util_1.default.test("FacadeDataset::beforeEach() - TEST START: " + this.currentTest.title + "; facade: " + typeof facade);
        });
    });
    afterEach(function () {
        Util_1.default.test("FacadeDataset::afterEach(); TEST END: " + this.currentTest.title);
    });
    after(function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield fs.removeSync(cacheDir);
            Util_1.default.test("FacadeDataset::after() - DONE");
        });
    });
    describe("#addDataset", function () {
        beforeEach(function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield fs.remove(cacheDir);
                yield fs.mkdir(cacheDir);
                facade = new InsightFacade_1.default();
            });
        });
        it("~BigFish~Should not be able to set a dataset that is not a zip file.", function () {
            return __awaiter(this, void 0, void 0, function* () {
                let res;
                try {
                    res = yield facade.addDataset(id, datasetNotZip, kind);
                }
                catch (err) {
                    res = err;
                }
                finally {
                    Util_1.default.writeResponse(res);
                    chai_1.expect(res).to.be.instanceOf(IInsightFacade_1.InsightError);
                }
            });
        });
        it("~Mercury~addDataset should be able to fulfill.", function () {
            return __awaiter(this, void 0, void 0, function* () {
                let res;
                const expectedIds = [id];
                try {
                    res = yield facade.addDataset(id, dataset, kind);
                }
                catch (err) {
                    res = err;
                }
                finally {
                    Util_1.default.writeResponse(res);
                    chai_1.expect(res).to.deep.equal(expectedIds);
                }
            });
        });
        it("~Hopscotch~Should add dataset while skipping invalid files", () => __awaiter(this, void 0, void 0, function* () {
            let res;
            try {
                res = yield facade.addDataset(brokenId, singleInvalidFileDataset, IInsightFacade_1.InsightDatasetKind.Courses);
            }
            catch (err) {
                res = err;
            }
            finally {
                Util_1.default.writeResponse(res);
                chai_1.expect(res).to.contain(brokenId);
            }
        }));
        it("~Meh~addDataset should be able to reject.", function () {
            return __awaiter(this, void 0, void 0, function* () {
                let res;
                try {
                    yield facade.addDataset(id, dataset, kind);
                    res = yield facade.addDataset(id, dataset, kind);
                }
                catch (err) {
                    res = err;
                }
                finally {
                    Util_1.default.writeResponse(res);
                    chai_1.expect(res).to.be.instanceOf(IInsightFacade_1.InsightError);
                }
            });
        });
        it("~Brazil~addDataset again with a different id should fulfill.", function () {
            return __awaiter(this, void 0, void 0, function* () {
                let res;
                const expectedIds = [id, altId];
                try {
                    yield facade.addDataset(id, dataset, kind);
                    res = yield facade.addDataset(altId, dataset, kind);
                }
                catch (err) {
                    res = err;
                }
                finally {
                    Util_1.default.writeResponse(res);
                    chai_1.expect(res.length).to.equal(expectedIds.length);
                    chai_1.expect(res).to.deep.include.members(expectedIds);
                }
            });
        });
        it("~Sun~addDataset should be able to reject invalid input.", function () {
            return __awaiter(this, void 0, void 0, function* () {
                let res;
                try {
                    res = yield facade.addDataset(null, dataset, kind);
                }
                catch (err) {
                    res = err;
                }
                finally {
                    Util_1.default.writeResponse(res);
                    chai_1.expect(res).to.be.instanceOf(IInsightFacade_1.InsightError);
                }
            });
        });
        it("~Abisko~Should save a valid dataset to the correct location.", function () {
            return __awaiter(this, void 0, void 0, function* () {
                let filesInCacheDir;
                let stat;
                try {
                    yield facade.addDataset(altId, smallCPSCDataset, IInsightFacade_1.InsightDatasetKind.Courses);
                    stat = yield fs.lstat(cacheDir);
                    filesInCacheDir = yield fs.readdir(cacheDir);
                }
                catch (err) {
                    Util_1.default.writeResponse(err);
                }
                finally {
                    chai_1.expect(stat.isDirectory()).to.be.true;
                    chai_1.expect(filesInCacheDir.length).to.be.greaterThan(0);
                }
            });
        });
    });
    describe("#removeDataset", function () {
        beforeEach(function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield fs.remove(cacheDir);
                yield fs.mkdir(cacheDir);
                facade = new InsightFacade_1.default();
            });
        });
        it("~Duh~removeDataset should fulfill with the removed id.", function () {
            return __awaiter(this, void 0, void 0, function* () {
                let res;
                try {
                    yield facade.addDataset(altId, dataset, kind);
                    yield facade.addDataset(id, dataset, kind);
                    res = yield facade.removeDataset(id);
                }
                catch (err) {
                    Util_1.default.test("Should not have reached this point");
                    res = err;
                }
                finally {
                    Util_1.default.writeResponse(res);
                    chai_1.expect(res).to.equal(id);
                }
            });
        });
        it("~Quadro~removeDataset should be able to reject with NotFoundError.", function () {
            return __awaiter(this, void 0, void 0, function* () {
                let res;
                try {
                    res = yield facade.removeDataset(id);
                }
                catch (err) {
                    res = err;
                }
                finally {
                    Util_1.default.writeResponse(res);
                    chai_1.expect(res).to.be.instanceOf(IInsightFacade_1.NotFoundError);
                }
            });
        });
        it("~Retrograde~removeDataset should be able to reject with InsightError.", function () {
            return __awaiter(this, void 0, void 0, function* () {
                let res;
                try {
                    res = yield facade.removeDataset(null);
                }
                catch (err) {
                    res = err;
                }
                finally {
                    Util_1.default.writeResponse(res);
                    chai_1.expect(res).to.be.instanceOf(IInsightFacade_1.InsightError);
                }
            });
        });
    });
    describe("#listDataset", function () {
        beforeEach(function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield fs.remove(cacheDir);
                yield fs.mkdir(cacheDir);
                facade = new InsightFacade_1.default();
            });
        });
        it("~Skyfall~Should be able to list datasets even without datasets.", function () {
            return __awaiter(this, void 0, void 0, function* () {
                let res;
                try {
                    res = yield facade.listDatasets();
                }
                catch (err) {
                    res = err;
                }
                finally {
                    Util_1.default.writeResponse(res);
                    chai_1.expect(res).to.be.an("array").that.is.empty;
                }
            });
        });
        it("~Skydive~Should be able to list a dataset.", function () {
            return __awaiter(this, void 0, void 0, function* () {
                let res;
                try {
                    yield facade.addDataset(id, dataset, kind);
                    res = yield facade.listDatasets();
                }
                catch (err) {
                    res = err;
                }
                finally {
                    Util_1.default.writeResponse(res);
                    chai_1.expect(res).to.be.an("array").that.deep.equals([{ id, kind, numRows }]);
                }
            });
        });
    });
    describe("#performQuery", function () {
        this.timeout(30000);
        Util_1.default.test("InsightFacadeD1#perfomQuery - Searching for query files in " + __dirname + "/queries");
        const queryDir = __dirname + "/queries";
        const queryFiles = (fs.readdirSync(queryDir)).filter((f) => f.endsWith(".json"));
        const queryTests = [];
        for (const file of queryFiles) {
            queryTests.push(fs.readJsonSync(queryDir + "/" + file));
        }
        Util_1.default.trace(`InsightFacadeD1#perfomQuery - Finished loading ${queryTests.length} queries.`);
        before(function () {
            return __awaiter(this, void 0, void 0, function* () {
                Util_1.default.test("PerformQuerySpec::beforeEach() - adding datasets with ids: rooms, courses");
                yield fs.remove(cacheDir);
                yield fs.mkdir(cacheDir);
                facade = new InsightFacade_1.default();
                const res = yield facade.addDataset(id, dataset, IInsightFacade_1.InsightDatasetKind.Courses);
                const resAlt = yield facade.addDataset(altId, dataset, IInsightFacade_1.InsightDatasetKind.Courses);
                const resSmall = yield facade.addDataset(smallId, smallCPSCDataset, IInsightFacade_1.InsightDatasetKind.Courses);
                Util_1.default.test("PerformQuerySpec::beforeEach() - datasets added successfully: " + JSON.stringify(res));
            });
        });
        it("~Alibi~performQuery should reject with InsightError", function () {
            return __awaiter(this, void 0, void 0, function* () {
                let res;
                try {
                    res = yield facade.performQuery(null);
                }
                catch (err) {
                    res = err;
                }
                finally {
                    Util_1.default.writeResponse(res);
                    chai_1.expect(res).to.be.instanceOf(IInsightFacade_1.InsightError);
                }
            });
        });
        for (const test of queryTests) {
            Util_1.default.test("PerformQuerySpec - preparing test (will run later): " + test.id);
            it(`~${test.id}~${test.title}`, function () {
                return __awaiter(this, void 0, void 0, function* () {
                    let res;
                    try {
                        res = yield facade.performQuery(test.query);
                    }
                    catch (err) {
                        Util_1.default.test("PerformQuerySpec::InsightFacade::performQuery() - rejected with " + JSON.stringify(err));
                        res = err;
                    }
                    finally {
                        if (test.isQueryValid) {
                            TestUtil_1.default.verifyResult(test, res);
                        }
                        else {
                            if (test.result === "ResultTooLargeError") {
                                chai_1.expect(res).to.be.instanceOf(IInsightFacade_1.ResultTooLargeError);
                            }
                            else {
                                chai_1.expect(res).to.be.instanceOf(IInsightFacade_1.InsightError);
                            }
                        }
                    }
                });
            });
        }
    });
});
//# sourceMappingURL=FacadeD1.spec.js.map