import { z } from "zod";
import {
  DemoScenarioSchema,
  DemoScenarioCatalogSchema,
} from "../lib/contracts/schemas";
import { ScenarioId } from "../lib/contracts/primitives";

export type DemoScenario = z.infer<typeof DemoScenarioSchema>;
export type DemoScenarioCatalog = z.infer<typeof DemoScenarioCatalogSchema>;
export type { ScenarioId };
