import { INestApplicationContext } from '@nestjs/common';

/**
 * Minimal re-implementation of the parts of `nestjs-spelunker` that this
 * project relies on to generate `module-dependencies.md`.
 *
 * `nestjs-spelunker` deep-imports `@nestjs/core/injector/internal-core-module`,
 * a path that no longer resolves since NestJS v12 moved that file into its own
 * directory. Since the package is unmaintained for NestJS v12+, this file
 * reimplements the small subset of behavior needed, relying only on the
 * `container` property NestJS exposes on the application instance (the same
 * mechanism `nestjs-spelunker` used) and a name-based check instead of
 * importing the internal `InternalCoreModule` class directly.
 *
 * See: https://github.com/jmcdo29/nestjs-spelunker
 */

interface ModuleNode {
  name: string;
  imports: string[];
}

interface GraphNode {
  dependencies: Set<GraphNode>;
  dependents: Set<GraphNode>;
  module: ModuleNode;
}

export interface ModuleDependencyEdge {
  from: ModuleNode;
  to: ModuleNode;
}

// The NestJS application instance exposes a `container` holding all
// registered modules, but this is not part of its public typed API.
interface NestApplicationWithContainer {
  container: {
    getModules: () => Map<
      unknown,
      {
        metatype: { name: string } | null;
        imports: Set<{ metatype: { name: string } | null }>;
      }
    >;
  };
}

function exploreModules(app: INestApplicationContext): ModuleNode[] {
  const modules = Array.from(
    (app as unknown as NestApplicationWithContainer).container
      .getModules()
      .values(),
  );

  const isIncludedModule = (module: { metatype: { name: string } | null }) =>
    module.metatype?.name !== 'InternalCoreModule';

  return modules.filter(isIncludedModule).map((module) => ({
    name: module.metatype?.name ?? 'UnknownModule',
    imports: Array.from(module.imports.values())
      .filter(isIncludedModule)
      .map((importedModule) => importedModule.metatype?.name ?? 'UnknownModule'),
  }));
}

function buildGraph(tree: ModuleNode[]): GraphNode {
  const nodeMap = new Map<string, GraphNode>(
    tree.map((module) => [
      module.name,
      { dependencies: new Set(), dependents: new Set(), module },
    ]),
  );

  for (const node of nodeMap.values()) {
    for (const importedModuleName of node.module.imports) {
      const dependency = nodeMap.get(importedModuleName);
      if (!dependency) {
        throw new Error(`Unable to find ${importedModuleName}!`);
      }
      node.dependencies.add(dependency);
      dependency.dependents.add(node);
    }
  }

  const nodes = Array.from(nodeMap.values());
  const root = nodes.find((node) => node.dependents.size === 0) ?? nodes[0];
  if (!root) {
    throw new Error('Unable to find root node');
  }
  return root;
}

function collectEdges(
  root: GraphNode,
  visitedNodes = new Set<GraphNode>(),
): Set<ModuleDependencyEdge> {
  const edges = new Set<ModuleDependencyEdge>();
  if (visitedNodes.has(root)) {
    return edges;
  }
  visitedNodes.add(root);

  for (const dependency of root.dependencies) {
    edges.add({ from: root.module, to: dependency.module });
    for (const edge of collectEdges(dependency, visitedNodes)) {
      edges.add(edge);
    }
  }
  return edges;
}

export function getModuleDependencyEdges(
  app: INestApplicationContext,
): ModuleDependencyEdge[] {
  const tree = exploreModules(app);
  const root = buildGraph(tree);
  return Array.from(collectEdges(root));
}
