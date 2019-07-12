import ArrayLiteralMutator from './ArrayLiteralMutator';
import ArrayNewExpressionMutator from './ArrayNewExpressionMutator';
import ArrowFunctionMutator from './ArrowFunctionMutator';
import BinaryExpressionMutator from './BinaryExpressionMutator';
import BooleanSubstitutionMutator from './BooleanSubstitutionMutator';
import BlockMutator from './BlockMutator';
import ConditionalExpressionMutator from './ConditionalExpressionMutator';
import DoStatementMutator from './DoStatementMutator';
import ForStatementMutator from './ForStatementMutator';
import IfStatementMutator from './IfStatementMutator';
import NodeMutator from './NodeMutator';
import NumericLiteralMutator from './NumericLiteralMutator';
import ObjectLiteralMutator from './ObjectLiteralMutator';
import PostfixUnaryExpressionMutator from './PostfixUnaryExpressionMutator';
import PrefixUnaryExpressionMutator from './PrefixUnaryExpressionMutator';
import StringLiteralMutator from './StringLiteralMutator';
import SwitchCaseMutator from './SwitchCaseMutator';
import WhileStatementMutator from './WhileStatementMutator';

export const nodeMutators: ReadonlyArray<NodeMutator> = [
    new ArrayLiteralMutator(),
    new ArrayNewExpressionMutator(),
    new ArrowFunctionMutator(),
    new BinaryExpressionMutator(),
    new BlockMutator(),
    new BooleanSubstitutionMutator(),
    new ConditionalExpressionMutator(),
    new DoStatementMutator(),
    new ForStatementMutator(),
    new IfStatementMutator(),
    new NumericLiteralMutator(),
    new ObjectLiteralMutator(),
    new PostfixUnaryExpressionMutator(),
    new PrefixUnaryExpressionMutator(),
    new StringLiteralMutator(),
    new SwitchCaseMutator(),
    new WhileStatementMutator(),
];
