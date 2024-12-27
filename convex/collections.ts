import { schema } from "../src/lib/schema";
import { query, mutation } from "./_generated/server";
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
        return await ctx.db.replace(args.item._id, args.item);
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
        return await ctx.db.insert(args.collectionName, {
            ...args.item,
            valid: true, // TODO: add validation
        });
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
                ctx.db.insert(args.collectionName, {
                    ...item,
                    valid: true, // TODO: add validation
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
