import * as ts from 'typescript';
import NodeMutator from './NodeMutator';

export default class IfStatementMutator extends NodeMutator<ts.IfStatement> {
  public name = 'IfStatement';

  public guard(node: ts.Node): node is ts.IfStatement {
    return node.kind === ts.SyntaxKind.IfStatement;
  }

  public mutate(node: ts.IfStatement): ts.IfStatement {
    return ts.createIf(ts.createFalse(), node.thenStatement, node.elseStatement);
  }

}
