import { z } from "zod";
import {
  ReasonCodeSchema,
  DetectorReasonSchema,
  DetectorNameSchema,
  DetectorAvailabilitySchema,
  DetectorResultSchema,
} from "../lib/contracts/schemas";
import { DetectorVersion } from "../lib/contracts/primitives";

export type ReasonCode = z.infer<typeof ReasonCodeSchema>;
export type DetectorReason = z.infer<typeof DetectorReasonSchema>;
export type DetectorName = z.infer<typeof DetectorNameSchema>;
export type DetectorAvailability = z.infer<typeof DetectorAvailabilitySchema>;
export type DetectorResult = z.infer<typeof DetectorResultSchema>;
export type { DetectorVersion };
