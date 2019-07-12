import * as ts from 'typescript';
import NodeMutator from './NodeMutator';

export default class BooleanSubstitutionMutator extends NodeMutator<ts.BooleanLiteral> {
    public name = 'Block';

    public guard(node: ts.Node): node is ts.BooleanLiteral {
        return node.kind === ts.SyntaxKind.FalseKeyword || node.kind === ts.SyntaxKind.TrueKeyword;
    }

    public mutate(node: ts.BooleanLiteral): ts.BooleanLiteral {
        if (node.kind === ts.SyntaxKind.FalseKeyword) {
            return ts.createTrue();
        } else {
            return ts.createFalse();
        }
    }
}
