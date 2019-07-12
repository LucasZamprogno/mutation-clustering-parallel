import * as ts from 'typescript';
import NodeMutator from './NodeMutator';
// Does this work?
export default class DoStatementMutator extends NodeMutator<ts.DoStatement> {

  public name = 'DoStatement';

  public guard(node: ts.Node): node is ts.DoStatement {
    return node.kind === ts.SyntaxKind.DoStatement;
  }

  public mutate(node: ts.DoStatement): ts.DoStatement {
      return ts.createDo(node.statement, ts.createFalse());
  }

}
