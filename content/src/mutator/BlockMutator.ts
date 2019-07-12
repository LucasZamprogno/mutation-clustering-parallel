import * as ts from 'typescript';
import NodeMutator from './NodeMutator';

export default class BlockMutator extends NodeMutator<ts.Block> {
    public name = 'Block';

    public guard(node: ts.Node): node is ts.Block {
        try {
            return node.kind === ts.SyntaxKind.Block
                && (node as ts.Block).statements.length > 0;
        } catch (e) {
            return false;
        }
    }

    public mutate(node: ts.Block): ts.Block {
        return ts.createBlock([], true);
    }
}
