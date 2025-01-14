import { makeGraph, runGraph } from "./util/dependencyGraph";
import { ReactiveFramework } from "./util/reactiveFramework";
import { solidFramework } from "./frameworks/solid";
import { expect, test } from "vitest";
import { TestConfig } from "./util/frameworkTypes";
import { frameworkInfo } from "./config";

frameworkInfo.forEach(({ framework }) => frameworkTests(framework));

function makeConfig(): TestConfig {
  return {
    width: 3,
    totalLayers: 3,
    staticFraction: 1,
    nSources: 2,
    readFraction: 1,
    expected: {},
    iterations: 1,
  };
}

/** some basic tests to validate the reactive framework
 * wrapper works and can run performance tests.
 */
function frameworkTests(framework: ReactiveFramework) {
  const name = framework.name;
  test(`${name} | simple dependency executes`, () => {
    const s = framework.signal(2);
    const c = framework.computed(() => s.read() * 2);
    framework.run();

    expect(c.read()).toEqual(4);
  });

  test(`${name} | static graph`, () => {
    const config = makeConfig();
    const { graph, counter } = makeGraph(framework, config);
    const sum = runGraph(graph, 2, 1, framework);
    expect(sum).toEqual(16);
    expect(counter.count).toEqual(11);
  });

  test(`${name} | static graph, read 2/3 of leaves`, () => {
    const config = makeConfig();
    config.readFraction = 2 / 3;
    config.iterations = 10;
    const { counter, graph } = makeGraph(framework, config);
    const sum = runGraph(graph, 10, 2 / 3, framework);

    expect(sum).toEqual(72);
    if (framework !== solidFramework) {
      expect(counter.count).toEqual(41);
    }
  });

  test(`${name} | dynamic graph`, () => {
    const config = makeConfig();
    config.staticFraction = 0.5;
    config.width = 4;
    config.totalLayers = 2;
    const { graph, counter } = makeGraph(framework, config);
    const sum = runGraph(graph, 10, 1, framework);

    expect(sum).toEqual(72);
    expect(counter.count).toEqual(22);
  });
}
