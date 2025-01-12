import { z } from "zod";

export const Theme = z.enum(["Light", "Dark"]);
export type Theme = z.infer<typeof Theme>;
