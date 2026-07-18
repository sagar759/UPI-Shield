import { z } from "zod";
import {
  ReceiverFeaturesSchema,
  ReceiverCheckInputSchema,
} from "../lib/contracts/schemas";
import { ProfileId, IsoTimestamp } from "../lib/contracts/primitives";

export type ReceiverFeatures = z.infer<typeof ReceiverFeaturesSchema>;
export type ReceiverCheckInput = z.infer<typeof ReceiverCheckInputSchema>;
export type { ProfileId, IsoTimestamp };
