import * as ts from 'typescript';
import NodeMutator from './NodeMutator';

export type AllStringLiterals =
    // Regular quoted string.
    | ts.StringLiteral
    // Templates string with values embedded.
    | ts.TemplateExpression
    // A raw token is emitted if the template string has no embeds.
    | ts.Token<ts.SyntaxKind.FirstTemplateToken>;

export default class StringLiteralMutator extends NodeMutator<AllStringLiterals> {
    public name = 'StringLiteral';

    public guard(node: ts.Node): node is AllStringLiterals {
        try {
            switch (node.kind) {
                case ts.SyntaxKind.StringLiteral:
                case ts.SyntaxKind.TemplateExpression:
                case ts.SyntaxKind.FirstTemplateToken:
                    return node.parent && !this.isInvalidParent(node);
                default:
                    return false;
            }
        } catch (e) {
            return false;
        }
    }

    private isInvalidParent(parent: ts.Node): boolean {
        switch (parent.kind) {
            case ts.SyntaxKind.ImportDeclaration:
            case ts.SyntaxKind.ExportDeclaration:
            case ts.SyntaxKind.ModuleDeclaration:
            case ts.SyntaxKind.ExternalModuleReference:
            case ts.SyntaxKind.LastTypeNode:
            case ts.SyntaxKind.JsxAttribute:
            case ts.SyntaxKind.ExpressionStatement:
            case ts.SyntaxKind.LiteralType:
                return true;
            default:
                return false;
        }
    }

    public mutate(node: AllStringLiterals): ts.StringLiteral {
        if (this.isEmpty(node)) {
            return ts.createStringLiteral('foo');
        } else {
            return ts.createStringLiteral('');
        }
    }

    private isEmpty(str: AllStringLiterals) {
        function isEmptyString() {
            return str.kind === ts.SyntaxKind.StringLiteral && str.text === '';
        }

        function isEmptyTemplate() {
            return (str.kind === ts.SyntaxKind.FirstTemplateToken && (str as ts.NoSubstitutionTemplateLiteral).text === '');
        }

        return isEmptyString() || isEmptyTemplate();
    }
}
