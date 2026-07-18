import { z } from "zod";
import { MessageCheckInputSchema } from "../lib/contracts/schemas";
import { RequestId, IsoTimestamp } from "../lib/contracts/primitives";

export type MessageCheckInput = z.infer<typeof MessageCheckInputSchema>;
export type { RequestId, IsoTimestamp };
