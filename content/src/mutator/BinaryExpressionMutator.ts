import * as ts from 'typescript';
import NodeMutator from './NodeMutator';

export default class BinaryExpressionMutator extends NodeMutator<ts.BinaryExpression> {

    public name: string = 'BinaryExpression';

    public guard(node: ts.Node): node is ts.BinaryExpression {
        try {
            return node.kind === ts.SyntaxKind.BinaryExpression &&
                this.annoyingTokenMap((node as ts.BinaryExpression).operatorToken.kind) !== undefined;
        } catch (e) {
            return false
        }
    }

    public mutate(node: ts.BinaryExpression): ts.BinaryExpression {
        return ts.createBinary(
            node.left,
            ts.createToken(this.annoyingTokenMap(node.operatorToken.kind)! as ts.BinaryOperator),
            node.right
        );
    }

    private annoyingTokenMap(token: ts.SyntaxKind): ts.SyntaxKind | undefined{
        switch(token) {
            case ts.SyntaxKind.PlusToken: return ts.SyntaxKind.MinusToken;
            case ts.SyntaxKind.MinusToken: return ts.SyntaxKind.PlusToken;
            case ts.SyntaxKind.SlashToken: return ts.SyntaxKind.AsteriskToken;
            case ts.SyntaxKind.AsteriskToken: return ts.SyntaxKind.SlashToken;
            case ts.SyntaxKind.PercentToken: return ts.SyntaxKind.AsteriskToken;
            case ts.SyntaxKind.LessThanToken: return ts.SyntaxKind.LessThanEqualsToken;
            case ts.SyntaxKind.LessThanEqualsToken: return ts.SyntaxKind.LessThanToken;
            case ts.SyntaxKind.GreaterThanToken: return ts.SyntaxKind.GreaterThanEqualsToken;
            case ts.SyntaxKind.GreaterThanEqualsToken: return ts.SyntaxKind.GreaterThanToken;
            case ts.SyntaxKind.EqualsEqualsToken: return ts.SyntaxKind.ExclamationEqualsToken;
            case ts.SyntaxKind.ExclamationEqualsToken: return ts.SyntaxKind.EqualsEqualsToken;
            case ts.SyntaxKind.EqualsEqualsEqualsToken: return ts.SyntaxKind.ExclamationEqualsEqualsToken;
            case ts.SyntaxKind.ExclamationEqualsEqualsToken: return ts.SyntaxKind.EqualsEqualsEqualsToken;
            case ts.SyntaxKind.BarBarToken: return ts.SyntaxKind.AmpersandAmpersandToken;
            case ts.SyntaxKind.AmpersandAmpersandToken: return ts.SyntaxKind.BarBarToken;
            default: return undefined;
        }
    }
}
