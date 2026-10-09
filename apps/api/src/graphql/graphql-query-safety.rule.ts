import {
  GraphQLError,
  Kind,
  type SelectionSetNode,
  type ValidationRule,
} from 'graphql';

// Conservative request budget. This is structural, not a DB cost estimator.
export const GRAPHQL_QUERY_LIMITS = Object.freeze({
  maxDepth: 16,
  maxFields: 300,
  maxAliases: 40,
});

/**
 * Reject excessively deep or wide GraphQL operations before resolvers run.
 * Fragment selections are expanded on every use, preventing fragment-based
 * bypasses. GraphQL's standard validation also rejects fragment cycles.
 */
export const graphqlQuerySafetyRule: ValidationRule = (context) => ({
  OperationDefinition(operation) {
    let maxDepth = 0;
    let fields = 0;
    let aliases = 0;

    function walk(
      selectionSet: SelectionSetNode,
      depth: number,
      activeFragments: Set<string>,
    ): void {
      for (const selection of selectionSet.selections) {
        if (selection.kind === Kind.FIELD) {
          fields += 1;
          if (selection.alias) aliases += 1;
          maxDepth = Math.max(maxDepth, depth);
          if (selection.selectionSet) {
            walk(selection.selectionSet, depth + 1, activeFragments);
          }
        } else if (selection.kind === Kind.INLINE_FRAGMENT) {
          walk(selection.selectionSet, depth, activeFragments);
        } else if (selection.kind === Kind.FRAGMENT_SPREAD) {
          const name = selection.name.value;
          if (activeFragments.has(name)) continue;
          const fragment = context.getFragment(name);
          if (!fragment) continue;
          activeFragments.add(name);
          walk(fragment.selectionSet, depth, activeFragments);
          activeFragments.delete(name);
        }
      }
    }

    walk(operation.selectionSet, 1, new Set<string>());
    const exceeded: string[] = [];
    if (maxDepth > GRAPHQL_QUERY_LIMITS.maxDepth) {
      exceeded.push(`depth ${maxDepth} > ${GRAPHQL_QUERY_LIMITS.maxDepth}`);
    }
    if (fields > GRAPHQL_QUERY_LIMITS.maxFields) {
      exceeded.push(`fields ${fields} > ${GRAPHQL_QUERY_LIMITS.maxFields}`);
    }
    if (aliases > GRAPHQL_QUERY_LIMITS.maxAliases) {
      exceeded.push(`aliases ${aliases} > ${GRAPHQL_QUERY_LIMITS.maxAliases}`);
    }
    if (exceeded.length) {
      context.reportError(
        new GraphQLError(`GraphQL operation too complex: ${exceeded.join('; ')}`, {
          nodes: operation,
          extensions: { code: 'QUERY_COMPLEXITY_LIMIT' },
        }),
      );
    }
  },
});
