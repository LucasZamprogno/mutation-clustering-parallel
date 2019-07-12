import {TestReport} from "./TestReport";

// interfaces taken from https://github.com/adamgruber/mochawesome-report-generator/blob/develop/bin/src/types.js

interface ITest {
    code: string;
    duration: string;
    err: any;
    fail: boolean;
    fullTitle: string;
    isRoot: boolean;
    pass: boolean;
    pending: boolean;
    skipped: boolean;
    speed?: "slow" | "medium" | "fast";
    state?: "passed" | "failed";
    timedOut: string;
    title: string;
    uuid: string | "UUID";
}

interface ISuite {
    _timeout: number;
    duration: number;
    failures: ITest[];
    file: string;
    fullFile: string;
    hasFailures: boolean;
    hasPasses: boolean;
    hasPending: boolean;
    hasSkipped: boolean;
    hasTests: boolean;
    passes: ITest[];
    pending: ITest[];
    root: boolean;
    rootEmpty?: boolean;
    skipped: ITest[];
    suites: ISuite[];
    tests: ITest[];
    title: string;
    totalFailures: number;
    totalPasses: number;
    totalPending: number;
    totalSkipped: number;
    totalTests: number;
    uuid: string | "UUID";
}

interface IStats {
    context?: string;
    duration: number;
    end: Date;
    failures: number;
    hasOther: boolean;
    hasSkipped: boolean;
    other: number;
    passes: number;
    passPercent: number;
    passPercentClass: "success" | "warning" | "danger";
    pending: number;
    pendingPercent: number;
    pendingPercentClass: "success" | "warning" | "danger";
    skipped: number;
    start: Date;
    suites: number;
    tests: number;
    testsRegistered: number;
}

export interface IMochawesomeReport {
    stats: IStats;
    suites: ISuite;
}

export class MochawesomeReport extends TestReport implements IMochawesomeReport {
    public readonly allFailures: ITest[];
    public readonly allPassing: ITest[];
    public readonly allPending: ITest[];
    public readonly allSkipped: ITest[];
    public readonly allTests: ITest[];
    public readonly stats: IStats;
    public readonly suites: ISuite;

    constructor(report: IMochawesomeReport) {
        const tests: ITest[] = MochawesomeReport.suiteWalker(report.suites);
        const empty: ITest[] = []; // Compiler complained about allTests otherwise

        const allFailures = tests.filter((t) => t.fail);
        const allPassing = tests.filter((t) => t.pass);
        const allPending = tests.filter((t) => t.pending);
        const allSkipped = tests.filter((t) => t.skipped);
        const allTests = empty.concat(allFailures, allPassing, allPending, allSkipped);

        const failNames = allFailures
            .map((t) => TestReport.formatName(TestReport.parseName(t.fullTitle)));
        const passNames = allPassing
            .map((t) => TestReport.formatName(TestReport.parseName(t.fullTitle)));
        const skipNames = allSkipped
            .map((t) => TestReport.formatName(TestReport.parseName(t.fullTitle)));

        super(failNames, passNames, skipNames);

        this.allFailures = allFailures;
        this.allPassing = allPassing;
        this.allPending = allPending;
        this.allSkipped = allSkipped;
        this.allTests = allTests;
        this.stats = report.stats;
        this.suites = report.suites;
    }

    private static suiteWalker(suite: ISuite): ITest[] {
        if (suite.suites.length === 0) {
            return suite.tests;
        }

        let tests = suite.tests;
        for (const childSuite of suite.suites as ISuite[]) {
            tests = tests.concat(MochawesomeReport.suiteWalker(childSuite));
        }
        return tests;
    }
}
