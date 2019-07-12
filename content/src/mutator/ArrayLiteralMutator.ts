import * as ts from 'typescript';
import NodeMutator from './NodeMutator';

export default class ArrayLiteralMutator extends NodeMutator<ts.ArrayLiteralExpression> {
    public name = 'ArrayLiteral';

    public guard(node: ts.Node): node is ts.ArrayLiteralExpression {
        return node.kind === ts.SyntaxKind.ArrayLiteralExpression;
    }

    public mutate(node: ts.ArrayLiteralExpression): ts.ArrayLiteralExpression {
        let elements: ts.Expression[] | undefined = undefined;
        if(!node.elements.length) {
            elements = [ts.createStringLiteral("foo")];
        }
        return ts.createArrayLiteral(elements)
    }
}
