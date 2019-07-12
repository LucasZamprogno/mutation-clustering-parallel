import * as ts from 'typescript';
import NodeMutator from './NodeMutator';

export default class ForStatementMutator extends NodeMutator<ts.ForStatement> {

    public name = 'ForStatement';

    public guard(node: ts.Node): node is ts.ForStatement {
        return node.kind === ts.SyntaxKind.ForStatement;
    }

    public mutate(node: ts.ForStatement): ts.ForStatement {
        return ts.createFor(node.initializer, ts.createFalse(), node.incrementor, node.statement);
    }

}
