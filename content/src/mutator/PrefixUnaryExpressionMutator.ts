import * as ts from 'typescript';
import NodeMutator from './NodeMutator';

export default class PrefixUnaryExpressionMutator extends NodeMutator<ts.PrefixUnaryExpression> {
  public name = 'PrefixUnaryExpression';

  public guard(node: ts.Node): node is ts.PrefixUnaryExpression {
    return node.kind === ts.SyntaxKind.PrefixUnaryExpression
        && this.annoyingTokenMap((node as ts.PrefixUnaryExpression)) !== undefined;
  }

    public mutate(node: ts.PrefixUnaryExpression): ts.PrefixUnaryExpression {
        return ts.createPrefix(this.annoyingTokenMap(node)!, node.operand);
  }

  private annoyingTokenMap(node: ts.PrefixUnaryExpression) {
      switch (node.operator) {
          case ts.SyntaxKind.PlusPlusToken: return ts.SyntaxKind.MinusMinusToken;
          case ts.SyntaxKind.MinusMinusToken: return ts.SyntaxKind.PlusPlusToken;
          case ts.SyntaxKind.PlusToken: return ts.SyntaxKind.MinusToken;
          case ts.SyntaxKind.MinusToken: return ts.SyntaxKind.PlusToken;
          default: return undefined;
      }
  }
}
