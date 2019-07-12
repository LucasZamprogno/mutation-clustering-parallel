import * as ts from 'typescript';
import NodeMutator, { NodeReplacement } from './NodeMutator';
// Does this work?
export default class WhileStatementMutator extends NodeMutator<ts.WhileStatement> {
  public name = 'WhileStatement';

  public guard(node: ts.Node): node is ts.WhileStatement {
    return node.kind === ts.SyntaxKind.WhileStatement;
  }

  public mutate(node: ts.WhileStatement): ts.WhileStatement {
    return ts.createWhile(ts.createFalse(), node.statement);
  }
}
