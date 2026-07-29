import { z } from "zod";
import {
  PaymentTypeSchema,
  TransactionInputSchema,
  TransactionFeaturesSchema,
  TransactionCheckInputSchema,
} from "../lib/contracts/schemas";
import { TransactionId, RupeeAmount, IsoTimestamp, ProfileId } from "../lib/contracts/primitives";

export type PaymentType = z.infer<typeof PaymentTypeSchema>;
export type TransactionInput = z.infer<typeof TransactionInputSchema>;
export type TransactionFeatures = z.infer<typeof TransactionFeaturesSchema>;
export type TransactionCheckInput = z.infer<typeof TransactionCheckInputSchema>;
export type TransactionRiskInput = TransactionCheckInput;
export type { TransactionId, RupeeAmount, IsoTimestamp, ProfileId };

