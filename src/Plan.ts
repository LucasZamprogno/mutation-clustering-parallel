import * as ts from 'typescript';
import {nodeMutators} from './mutator/index';
const fs = require("fs-extra");
import {Plan} from './Mutate'

const plans: Plan[] = [];

function planMutation(filepath: string): void {
    const originalFileContent = fs.readFileSync(filepath).toString();
    const sourceFile: ts.SourceFile = ts.createSourceFile(
        'temp.ts', originalFileContent, ts.ScriptTarget.ES2015, true, ts.ScriptKind.TS
    );

    function planMutationRecursive(node: ts.Node) {
        for (let i = 0; i < nodeMutators.length; i++) {
            if (nodeMutators[i].guard(node)) {
                const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                plans.push({
                    filepath: filepath,
                    start: node.getStart(),
                    apxLine: line,
                    mutatorIndex: i,
                    text: node.getText(sourceFile)});
            }
        }
        ts.forEachChild(node, planMutationRecursive);
    }

    planMutationRecursive(sourceFile);
}
// TODO load these from somewhere
const files = [
    "./target/src/controller/InsightFacade.ts",
    "./target/src/controller/QueryProcessor.ts",
    "./target/src/controller/QueryValidator.ts",
    "./target/src/controller/datasets/JsonDatasetParser.ts",
    "./target/src/controller/datasets/DatasetManager.ts",
];

for (const file of files) {
    planMutation(file);
}
fs.outputJsonSync("./plans/plans.json", plans);