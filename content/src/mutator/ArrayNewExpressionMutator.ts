import * as ts from 'typescript';
import NodeMutator from './NodeMutator';

export default class ArrayNewExpressionMutator extends NodeMutator<ts.NewExpression> {
    public name = 'ArrayNewExpression';

    public guard(node: ts.Node): node is ts.NewExpression {
        try {
            return node.kind === ts.SyntaxKind.NewExpression &&
                (node as ts.NewExpression).expression.getFullText().trim() === 'Array';
        } catch (e) {
            return false
        }
    }

    public mutate(node: ts.NewExpression): ts.NewExpression {
        if (node.arguments && node.arguments.length) {
            return ts.createNew(ts.createIdentifier('Array'), undefined, [
                ts.createArrayLiteral([], false)
            ]);
        } else {
            return ts.createNew(ts.createIdentifier('Array'), undefined, [
                ts.createArrayLiteral([ts.createStringLiteral("foo")], false)
            ]);
        }
    }
}
