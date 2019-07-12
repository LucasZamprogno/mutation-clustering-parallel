/* tslint:disable no-unused-expression */
import "../UnhandledErrorChecker";

import Log from "../Util";
import InsightFacade from "../../src/controller/InsightFacade";
import {
    InsightDataset,
    InsightDatasetKind,
    InsightError,
    NotFoundError,
    ResultTooLargeError
} from "../../src/controller/IInsightFacade";
import * as fs from "fs-extra";
import {expect} from "chai";
import TestUtil from "../TestUtil";
import {IQueryTest} from "../IQueryTest"


// TODO Make a small valid dataset for cases where we just need to add _any_ valid dataset
describe("InsightFacadeD1", function () {
    const id = "courses";
    const altId = "alternate";
    const smallId = "cpsc";
    const brokenId= "broken";
    const kind = InsightDatasetKind.Courses;
    const cacheDir = __dirname + "/../../data";
    let numRows: number;
    const datasetNotZip: string =  new Buffer("adfadsfad").toString("base64");
    let facade: InsightFacade = null;
    let dataset: string;
    let smallCPSCDataset: string;
    let singleInvalidFileDataset: string;

    before(async function () {
        Log.info("FacadeDataset::before() - start");

        try {
            dataset = await fs.readFile(__dirname + "/../../resources/310courses.1.0.zip", "base64");
            smallCPSCDataset = await fs.readFile(__dirname + "/../../resources/310courses.cpsc.1.0.zip", "base64");
            singleInvalidFileDataset = await fs.readFile(__dirname + "/../../resources/coursesWithBrokenJSON.zip", "base64");
            // NOTE: make sure this number matches the actual dataset (if changing)
            numRows = 64612;
        } catch (err) {
            Log.error("Failed to load dataset. " + err);
            throw err;
        }
    });

    beforeEach(async function () {
        Log.test("FacadeDataset::beforeEach() - TEST START: " + this.currentTest.title + "; facade: " + typeof facade);
    });

    afterEach(function () {
        Log.test("FacadeDataset::afterEach(); TEST END: " + this.currentTest.title);
    });

    after(async function () {
        await fs.removeSync(cacheDir);
        Log.test("FacadeDataset::after() - DONE");
    });

    describe("#addDataset", function () {
        beforeEach(async function () {
            await fs.remove(cacheDir);
            await fs.mkdir(cacheDir);
            facade = new InsightFacade();
        });

        it("~BigFish~Should not be able to set a dataset that is not a zip file.", async function () {
            let res: string[];
            try {
                res = await facade.addDataset(id, datasetNotZip, kind);
            } catch (err) {
                res = err;
            } finally {
                Log.writeResponse(res);
                expect(res).to.be.instanceOf(InsightError);
            }
        });

        // adding the first time, should be 204
        it("~Mercury~addDataset should be able to fulfill.", async function () {
            let res: string[];
            const expectedIds = [id];
            try {
                res = await facade.addDataset(id, dataset, kind);
            } catch (err) {
                res = err;
            } finally {
                Log.writeResponse(res);
                expect(res).to.deep.equal(expectedIds);
            }
        });


        it("~Hopscotch~Should add dataset while skipping invalid files", async () => {
            let res: string[];

            try {
                res = await facade.addDataset(brokenId, singleInvalidFileDataset, InsightDatasetKind.Courses);
            } catch (err) {
                res = err;
            } finally {
                Log.writeResponse(res);
                expect(res).to.contain(brokenId);
            }
        });

        // adding the second time, should be 400
        it("~Meh~addDataset should be able to reject.", async function () {
            let res: string[];
            try {
                await facade.addDataset(id, dataset, kind);
                res = await facade.addDataset(id, dataset, kind);
            } catch (err) {
                res = err;
            } finally {
                Log.writeResponse(res);
                expect(res).to.be.instanceOf(InsightError);
            }
        });

        it("~Brazil~addDataset again with a different id should fulfill.", async function () {
            let res: string[];
            const expectedIds = [id, altId];
            try {
                await facade.addDataset(id, dataset, kind);
                res = await facade.addDataset(altId, dataset, kind);
            } catch (err) {
                res = err;
            } finally {
                Log.writeResponse(res);
                expect(res.length).to.equal(expectedIds.length);
                expect(res).to.deep.include.members(expectedIds);
            }
        });

        it("~Sun~addDataset should be able to reject invalid input.", async function () {
            let res: string[];
            try {
                res = await facade.addDataset(null, dataset, kind);
            } catch (err) {
                res = err;
            } finally {
                Log.writeResponse(res);
                expect(res).to.be.instanceOf(InsightError);
            }
        });

        it("~Abisko~Should save a valid dataset to the correct location.", async function () {
            let filesInCacheDir: string[];
            let stat;
            try {
                await facade.addDataset(altId, smallCPSCDataset, InsightDatasetKind.Courses);
                stat = await fs.lstat(cacheDir);
                filesInCacheDir = await fs.readdir(cacheDir);
            } catch (err) {
                Log.writeResponse(err);
            } finally {
                expect(stat.isDirectory()).to.be.true;
                expect(filesInCacheDir.length).to.be.greaterThan(0);
            }
        });

    });

    describe("#removeDataset", function () {
        beforeEach(async function () {
            await fs.remove(cacheDir);
            await fs.mkdir(cacheDir);
            facade = new InsightFacade();
        });

        it("~Duh~removeDataset should fulfill with the removed id.", async function () {
            let res: string;
            try {
                await facade.addDataset(altId, dataset, kind);
                await facade.addDataset(id, dataset, kind);
                res = await facade.removeDataset(id);
            } catch (err) {
                Log.test("Should not have reached this point");
                res = err;
            } finally {
                Log.writeResponse(res);
                expect(res).to.equal(id);
            }
        });

        it("~Quadro~removeDataset should be able to reject with NotFoundError.", async function () {
            let res: string;
            try {
                res = await facade.removeDataset(id);
            } catch (err) {
                res = err;
            } finally {
                Log.writeResponse(res);
                expect(res).to.be.instanceOf(NotFoundError);
            }
        });

        it("~Retrograde~removeDataset should be able to reject with InsightError.", async function () {
            let res: string;
            try {
                res = await facade.removeDataset(null);
            } catch (err) {
                res = err;
            } finally {
                Log.writeResponse(res);
                expect(res).to.be.instanceOf(InsightError);
            }
        });
    });

    describe("#listDataset", function () {
        beforeEach(async function () {
            await fs.remove(cacheDir);
            await fs.mkdir(cacheDir);
            facade = new InsightFacade();
        });

        it("~Skyfall~Should be able to list datasets even without datasets.", async function () {
            let res: InsightDataset[];
            try {
                res = await facade.listDatasets();
            } catch (err) {
                res = err;
            } finally {
                Log.writeResponse(res);
                expect(res).to.be.an("array").that.is.empty;
            }
        });

        it("~Skydive~Should be able to list a dataset.", async function () {
            let res: InsightDataset[];
            try {
                await facade.addDataset(id, dataset, kind);
                res = await facade.listDatasets();
            } catch (err) {
                res = err;
            } finally {
                Log.writeResponse(res);
                expect(res).to.be.an("array").that.deep.equals([{ id, kind, numRows }]);
            }
        });
    });

    describe("#performQuery", function () {
        this.timeout(30000);
        // We generate a list of test names for the performQuery dynamic tests here. (The before hooks get executed after the describe code is executed).
        Log.test("InsightFacadeD1#perfomQuery - Searching for query files in " + __dirname + "/queries");
        const queryDir: string = __dirname + "/queries";
        const queryFiles: string[] = (fs.readdirSync(queryDir)).filter((f) => f.endsWith(".json"));
        const queryTests: IQueryTest[] = [];
        for (const file of queryFiles) {
            queryTests.push(fs.readJsonSync(queryDir + "/" + file));
        }
        Log.trace(`InsightFacadeD1#perfomQuery - Finished loading ${queryTests.length} queries.`);

        before(async function () {
            Log.test("PerformQuerySpec::beforeEach() - adding datasets with ids: rooms, courses");
            await fs.remove(cacheDir);
            await fs.mkdir(cacheDir);
            facade = new InsightFacade();
            const res = await facade.addDataset(id, dataset, InsightDatasetKind.Courses);
            const resAlt = await facade.addDataset(altId, dataset, InsightDatasetKind.Courses);
            const resSmall = await facade.addDataset(smallId, smallCPSCDataset, InsightDatasetKind.Courses);
            Log.test("PerformQuerySpec::beforeEach() - datasets added successfully: " + JSON.stringify(res));
        });

        it("~Alibi~performQuery should reject with InsightError", async function () {
            let res: any[];

            try {
                res = await facade.performQuery(null);
            } catch (err) {
                res = err;
            } finally {
                Log.writeResponse(res);
                expect(res).to.be.instanceOf(InsightError);
            }
        });

        for (const test of queryTests) {
            Log.test("PerformQuerySpec - preparing test (will run later): " + test.id);
            it(`~${test.id}~${test.title}`, async function () {
                let res: any[];
                try {
                    res = await facade.performQuery(test.query);
                } catch (err) {
                    Log.test("PerformQuerySpec::InsightFacade::performQuery() - rejected with " + JSON.stringify(err));
                    res = err;
                } finally {
                    if (test.isQueryValid) {
                        TestUtil.verifyResult(test, res);
                    } else {
                        if (test.result === "ResultTooLargeError") {
                            expect(res).to.be.instanceOf(ResultTooLargeError);
                        } else {
                            expect(res).to.be.instanceOf(InsightError);
                        }
                    }
                }
            });
        }
    });
});
