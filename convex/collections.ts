import { DateField, getDefaultItem, schema, validateSchema } from "../src/lib/schema";
import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// TODO: Hack.
const staticAuthQuery = (passedAuth?: string) => {
    if (passedAuth !== process.env.STATIC_AUTH) {
        throw new Error("Unauthorized");
    }
}

export const list = query({
    args: {
        collectionName: v.string(),
        auth: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        staticAuthQuery(args.auth);
        // TODO: don't hardcode the sorting
        const items = await ctx.db.query(args.collectionName).collect();
        const collectionSchema = schema.collections[args.collectionName];

        // Hydrate media fields and replace richtext with placeholder
        for (const item of items) {
            for (const field of collectionSchema.fields) {
                if (field.type === "media" && item[field.name]) {
                    item[field.name].mediaUrl = await ctx.storage.getUrl(
                        item[field.name].mediaId
                    );
                } else if (field.type === "richText") {
                    // Replace richtext content with placeholder object
                    item[field.name] = {
                        lexicalJson: "",
                        html: "<Rich text content>"
                    };
                }
            }
        }

        return items;
    },
});

export const get = query({
    args: {
        collectionName: v.string(),
        id: v.any(),
        auth: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        staticAuthQuery(args.auth);
        const item = await ctx.db.get(args.id);
        if (!item) {
            throw new Error("Item not found");
        }
        const collectionSchema = schema.collections[args.collectionName];
        // TODO: validate

        // Hydrate media fields
        for (const field of collectionSchema.fields) {
            if (field.type === "media" && item[field.name]) {
                item[field.name].mediaUrl = await ctx.storage.getUrl(
                    item[field.name].mediaId
                );
            }
        }

        return item;
    },
});

export const save = mutation({
    args: {
        collectionName: v.string(),
        item: v.any(),
        auth: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        staticAuthQuery(args.auth);
        for (const field of schema.collections[args.collectionName].fields) {
            if (field.type === DateField && field.setOnUpdate) {
                args.item[field.name] = new Date().toISOString();
            }
        }
        return await ctx.db.replace(args.item._id, {
            ...args.item,
            valid: validateSchema(args.item, args.collectionName),
        });
    },
});

export const add = mutation({
    args: {
        collectionName: v.string(),
        item: v.any(),
        auth: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        staticAuthQuery(args.auth);
        for (const field of schema.collections[args.collectionName].fields) {
            if (field.type === DateField && (field.setOnUpdate || field.setOnCreate)) {
                args.item[field.name] = new Date().toISOString();
            }
        }
        const defaultItem = getDefaultItem(args.collectionName);
        const newItem = {
            ...defaultItem,
            ...args.item,
        };
        return await ctx.db.insert(args.collectionName, {
            ...newItem,
            valid: validateSchema(newItem, args.collectionName),
        });
    },
});

export const internalValidateAndBackfillDefaults = internalMutation({
    args: {
        collectionName: v.string(),
        action: v.union(v.literal("mutateDryRun"), v.literal("mutate"), v.literal("validate")),
    },
    handler: async (ctx, args) => {
        console.log(`Validating and backfilling defaults with action ${args.action} for ${args.collectionName}`);
        // Skip valid items.
        for (const item of await ctx.db.query(args.collectionName).collect()) {
            const oldItemValid = validateSchema(item, args.collectionName);
            if (args.action === "validate") {
                console.log("Validating item", item._id);
                if (oldItemValid === item.valid) {
                    console.log("Skipping item", item._id);
                    continue;
                } else {
                    await ctx.db.patch(item._id, {
                        valid: oldItemValid,
                    });
                }
            } else {
                if (oldItemValid) {
                    console.log("Skipping item", item._id);
                    continue;
                }

                // Delete all undefineds from the item.
                for (const [key, value] of Object.entries(item)) {
                    if (value === undefined) {
                        delete item[key];
                    }
                }

                const defaultItem = getDefaultItem(args.collectionName);
                const newItem = {
                    ...defaultItem,
                    ...item,
                };

                if (args.action === "mutate") {
                    console.log(`Replacing ${item._id}`);
                    await ctx.db.replace(item._id, {
                        ...newItem,
                        valid: validateSchema(newItem, args.collectionName),
                    });
                } else {
                    console.log(`Would replace ${item._id} with`, newItem);
                }
            }
        }
    },
});


export const remove = mutation({
    args: {
        collectionName: v.string(),
        id: v.any(),
        auth: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        staticAuthQuery(args.auth);
        // Get the item.
        const item = await ctx.db.get(args.id);
        if (!item) {
            throw new Error("Failed to generate download URL");
        }

        // Delete all media associated with the item.
        // TODO: is this transactional?
        // TODO: also delete media from the richTextMediaProvider of the collection.
        const collectionSchema = schema.collections[args.collectionName];
        for (const field of collectionSchema.fields) {
            if (field.type === "media" && item[field.name]) {
                await ctx.storage.delete(item[field.name].mediaUrl);
            }
        }

        await ctx.db.delete(args.id);
    },
});

// TODO: rename to add many
export const saveMany = mutation({
    args: {
        collectionName: v.string(),
        items: v.array(v.any()),
        auth: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        staticAuthQuery(args.auth);
        // Insert all items in parallel
        await Promise.all(
            args.items.map((item) =>
                add(ctx, {
                    collectionName: args.collectionName,
                    item,
                    auth: args.auth,
                })
            )
        );
    },
});

export const generateUploadUrl = mutation({
    args: {

        auth: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        staticAuthQuery(args.auth);
        return await ctx.storage.generateUploadUrl();
    }
});

export const generateDownloadUrl = query({
    args: {
        storageId: v.string(),
        auth: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        staticAuthQuery(args.auth);
        // TODO: handle deprecation warning for storage.
        const item = await ctx.storage.getUrl(args.storageId);
        if (!item) {
            throw new Error("Failed to generate download URL");
        }

        return item;
    },
});
