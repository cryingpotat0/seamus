import { query, mutation } from "./_generated/server";
import { v } from "convex/values";


export const list = query({
    args: {
        collectionName: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.query(args.collectionName).collect();
    },
});

export const get = query({
    args: {
        collectionName: v.string(),
        id: v.any(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const save = mutation({
    args: {
        collectionName: v.string(),
        item: v.any(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.replace(args.item._id, args.item);
    },
});

export const add = mutation({
    args: {
        collectionName: v.string(),
        item: v.any(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert(args.collectionName, args.item);
    }
});

export const remove = mutation({
    args: {
        collectionName: v.string(),
        id: v.any(),
    },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});
