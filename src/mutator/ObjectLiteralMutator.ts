import * as ts from 'typescript';
import NodeMutator from './NodeMutator';

export default class ObjectLiteralMutator extends NodeMutator<ts.ObjectLiteralExpression> {
    public name = 'ObjectLiteral';

    public guard(node: ts.Node): node is ts.ObjectLiteralExpression {
        try {
            return node.kind === ts.SyntaxKind.ObjectLiteralExpression
                && (node as ts.ObjectLiteralExpression).properties.length > 0;
        } catch (e) {
            return false;
        }
    }

    public mutate(node: ts.ObjectLiteralExpression): ts.ObjectLiteralExpression {
        return ts.createObjectLiteral([], false);
    }

}
