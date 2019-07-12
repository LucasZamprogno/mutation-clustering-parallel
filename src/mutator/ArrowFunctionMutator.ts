import * as ts from 'typescript';
import NodeMutator from './NodeMutator';

export default class ArrowFunctionMutator extends NodeMutator<ts.ArrowFunction> {
    public name = 'ArrowFunction';

    public guard(node: ts.Node): node is ts.ArrowFunction {
        try {
            return node.kind === ts.SyntaxKind.ArrowFunction
                && (node as ts.ArrowFunction).body.kind === ts.SyntaxKind.Block;
        } catch (e) {
            return false
        }
    }

    public mutate(node: ts.ArrowFunction): ts.ArrowFunction {
        return ts.createArrowFunction(
            undefined,
            undefined,
            [],
            undefined,
            ts.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
            ts.createIdentifier('undefined')
        );
    }

}
