import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { convexSchema } from "../src/lib/schema/index";

export default defineSchema({
    ...convexSchema,
    settings: defineTable({
        key: v.string(),
        value: v.string(),
    }),
    relations: defineTable({
        from: v.object({
            collectionName: v.string(),
            itemId: v.string(),
            field: v.string(),
        }),
        to: v.object({
            collectionName: v.string(),
            itemId: v.string(),
        })
    })
        .index("by_from", [
            "from.collectionName", "from.field", "from.itemId"
        ])
        .index("by_to", [
            "to.collectionName", "to.itemId"
        ])
});
