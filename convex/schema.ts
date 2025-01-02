import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { convexSchema } from "../src/lib/schema";

export default defineSchema({
  ...convexSchema,
  settings: defineTable({
    key: v.string(),
    value: v.string(),
  }),
});
