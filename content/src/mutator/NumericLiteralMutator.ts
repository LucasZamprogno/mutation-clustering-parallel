import * as ts from 'typescript';
import NodeMutator from './NodeMutator';

export default class NumericLiteralMutator extends NodeMutator<ts.NumericLiteral> {
    public name = 'NumericLiteral';

    public guard(node: ts.Node): node is ts.NumericLiteral {
        return node.kind === ts.SyntaxKind.NumericLiteral;
    }

    public mutate(node: ts.NumericLiteral): ts.NumericLiteral {
        let oldVal = Number(node.getText());
        let newVal;
        if (oldVal === 0) {
            newVal = "5";
        } else {
            newVal = "0";
        }
        return ts.createNumericLiteral(newVal);
    }
}
