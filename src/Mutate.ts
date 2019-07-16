import * as ts from 'typescript';
import {nodeMutators} from './mutator/index';
import {MochawesomeReport, IMochawesomeReport} from './reports/MochawesomeReport';

const fs = require("fs-extra");
const execSync = require('child_process').execSync;

export interface Log {
    filename: string,
    filepath: string,
    apxLine: number,
    mutator: string,
    originalText: string,
    failures: string[],
}

export interface Plan {
    filepath: string,
    start: number,
    apxLine: number,
    mutatorIndex: number,
    text: string
}

class MutationManager {
    private DEBUG = false;
    private plans: Plan[] = fs.readJsonSync("./plans/plans.json");
    private readonly LOG_DIR = "./logs";
    private readonly MOCHA_RESULT = "./target/mochawesome-report/mochawesome.json";
    private originalFileContent: string = "";
    private filepath = "";

    public runMutations() {
        for (const plan of this.plans) {
            this.changeFileIfNeeded(plan);
            try {
                this.mutateFile(plan);
                if (!this.DEBUG) {
                    try {
                        this.runTests();
                    } catch (e) {/* Suppress "errors" from test failures (In theory? Doesn't work)" */
                    }
                    this.cacheResults(plan);
                } else {
                    this.save_mutated(plan);
}
            } catch (e) {}
        }
        fs.outputFileSync(this.filepath, this.originalFileContent);
    }

    private changeFileIfNeeded(plan: Plan) {
        if (plan.filepath != this.filepath) {
            if (this.filepath) {
                fs.outputFileSync(this.filepath, this.originalFileContent);
            }
            this.filepath = plan.filepath;
            this.originalFileContent = fs.readFileSync(plan.filepath).toString();
        }
    }

    private mutateFile(plan: Plan): void {
        const transformer = <T extends ts.Node>(context: ts.TransformationContext) => {
            return (rootNode: T) => {
                function visit(node: ts.Node): ts.Node {
                    node = ts.visitEachChild(node, visit, context);
                    try {
                        const this_start = node.getStart();
                        if (this_start === plan.start) {
                            return nodeMutators[plan.mutatorIndex].mutate(node)
                        }
                    } catch (e) {
                    }
                    return node;
                }

                return ts.visitNode(rootNode, visit);
            }
        };
        const sourceFile: ts.SourceFile = ts.createSourceFile(
            'temp.ts', this.originalFileContent, ts.ScriptTarget.ES2015, true, ts.ScriptKind.TS
        );
        const printer: ts.Printer = ts.createPrinter();
        const result: ts.TransformationResult<ts.SourceFile> = ts.transform<ts.SourceFile>(
            sourceFile, [transformer]
        );
        const transformedSourceFile: ts.SourceFile = result.transformed[0];
        const newContent = printer.printFile(transformedSourceFile);
        result.dispose();
        fs.outputFileSync(this.filepath, newContent);
    }

    private runTests(): void {
        execSync('cd target && yarn build; npm run test_special');
    }

    private cacheResults(plan: Plan): void {
        if (fs.existsSync(this.MOCHA_RESULT)) {
            const logJson = JSON.parse(fs.readFileSync(this.MOCHA_RESULT).toString());
            const mochaReport = new MochawesomeReport(logJson as IMochawesomeReport);
            const failures = mochaReport.allFailures.map((x) => x.title);
            const out: Log = {
                filename: this.filename(this.filepath),
                filepath: this.filepath,
                apxLine: plan.apxLine,
                mutator: nodeMutators[plan.mutatorIndex].name,
                originalText: plan.text,
                failures: failures,
            };
            if (failures.length > 0) { // Maybe > 1 ?
                const logPath = `${this.LOG_DIR}/${out.filename}-${out.apxLine}-${out.mutator}.json`;
                fs.outputJsonSync(logPath, out);
            }
            fs.removeSync(this.MOCHA_RESULT);
        } else {
        }
    }

    private save_mutated(plan: Plan): void {
        const file = this.filename(this.filepath);
        const line = plan.apxLine;
        const mutator = nodeMutators[plan.mutatorIndex].name;
        const logPath = `${this.LOG_DIR}/DEBUG-${file}-${line}-${mutator}.ts`;
        fs.copySync(this.filepath, logPath);
    }

    private stripExtension(filename: string): string {
        return filename.substring(0, filename.lastIndexOf("."));
    }

    private filename(filepath: string, nameOnly = false): string {
        const name: string = filepath.split("/").pop()!;
        return nameOnly ? this.stripExtension(name) : name;
    }
}

const mutator = new MutationManager();
mutator.runMutations();