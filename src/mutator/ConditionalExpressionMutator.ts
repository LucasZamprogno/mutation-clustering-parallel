import * as ts from 'typescript';
import NodeMutator from './NodeMutator';

export default class ConditionalExpressionMutator extends NodeMutator<ts.BinaryExpression> {
    public name = 'ConditionalExpression';

    public guard(node: ts.Node): node is ts.BinaryExpression {
        try {
            return node.kind === ts.SyntaxKind.BinaryExpression
                && !this.isInvalidParent(node)
                && !this.isInvalidOperator((node as ts.BinaryExpression).operatorToken);
        } catch (e) {
            return false;
        }
    }

    private isInvalidParent(parent: ts.Node): boolean {
        switch (parent.kind) {
            case ts.SyntaxKind.IfStatement:
            case ts.SyntaxKind.ForStatement:
            case ts.SyntaxKind.WhileStatement:
            case ts.SyntaxKind.DoStatement:
            case ts.SyntaxKind.LiteralType:
                return true;
            default:
                return false;
        }
    }

    private isInvalidOperator(operatorToken: ts.BinaryOperatorToken): boolean {
        switch (operatorToken.kind) {
            case ts.SyntaxKind.PlusToken:
            case ts.SyntaxKind.MinusToken:
            case ts.SyntaxKind.SlashToken:
            case ts.SyntaxKind.AsteriskToken:
            case ts.SyntaxKind.PercentToken:
                return true;
            default:
                return false;
        }
    }

    public mutate(node: ts.BinaryExpression): ts.PrefixUnaryExpression {
        return ts.createPrefix(
            ts.SyntaxKind.ExclamationToken,
            ts.createParen(
              ts.createBinary(
                node.left,
                node.operatorToken,
                node.right
              )
            )
          );
    }

}
