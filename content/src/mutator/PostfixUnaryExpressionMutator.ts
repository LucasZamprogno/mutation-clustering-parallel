import * as ts from 'typescript';
import NodeMutator from './NodeMutator';

export default class PostfixUnaryExpressionMutator extends NodeMutator<ts.PostfixUnaryExpression> {
    public name = 'PrefixUnaryExpression';

    public guard(node: ts.Node): node is ts.PostfixUnaryExpression {
        return node.kind === ts.SyntaxKind.PostfixUnaryExpression
            && this.annoyingTokenMap((node as ts.PostfixUnaryExpression)) !== undefined;
    }

    public mutate(node: ts.PostfixUnaryExpression): ts.PostfixUnaryExpression {
        return ts.createPostfix(node.operand, this.annoyingTokenMap(node)!);
    }

    private annoyingTokenMap(node: ts.PostfixUnaryExpression) {
        switch (node.operator) {
            case ts.SyntaxKind.PlusPlusToken: return ts.SyntaxKind.MinusMinusToken;
            case ts.SyntaxKind.MinusMinusToken: return ts.SyntaxKind.PlusPlusToken;
            default: return undefined;
        }
    }
}