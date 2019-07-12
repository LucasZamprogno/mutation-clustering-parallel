import * as ts from 'typescript';

export interface NodeReplacement {
  node: ts.Node;
  replacement: string;
}

export default abstract class NodeMutator<T extends ts.Node = ts.Node> {
  public abstract name: string;
  public abstract guard(node: ts.Node): node is T;
  public abstract mutate(node: ts.Node): ts.Node;
}
