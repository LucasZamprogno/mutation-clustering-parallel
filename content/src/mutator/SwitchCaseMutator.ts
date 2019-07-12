import * as ts from 'typescript';

import NodeMutator from './NodeMutator';

export default class SwitchCaseMutator extends NodeMutator<ts.CaseOrDefaultClause> {
    public name = 'SwitchCase';

    public guard(node: ts.Node): node is ts.CaseOrDefaultClause {
        try {
            return node.kind === ts.SyntaxKind.CaseClause || node.kind === ts.SyntaxKind.DefaultClause
                && (node as ts.CaseOrDefaultClause).statements.length > 0;
        } catch (e) {
            return false;
        }
    }

    public mutate(node: ts.CaseOrDefaultClause): ts.CaseOrDefaultClause {
        return node.kind === ts.SyntaxKind.DefaultClause
            ? ts.createDefaultClause([])
            : ts.createCaseClause(node.expression, []);
    }
}
