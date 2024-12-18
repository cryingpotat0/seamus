import { v } from "convex/values";
import { defineSchema, defineTable } from "convex/server";

// Primitive types for the first level of schema - this is what the user will
// define the schema in.
export type PlainText = "plainText"
export const PlainText: PlainText = "plainText"

export type RichText = "richText"
export const RichText: RichText = "richText"

export type DateField = "date"
export const DateField: DateField = "date"

export type Int64Field = "int64"
export const Int64Field = "int64"

export type BooleanField = "boolean"
export const BooleanField = "boolean"

export type StringArrayField = "stringarray"
export const StringArrayField: StringArrayField = "stringarray"

type CommonFieldOptions = {
    name: string;
}

export type Field = CommonFieldOptions & {
    type: PlainText | RichText | DateField | Int64Field | BooleanField | StringArrayField
}


type CollectionSchema = {
    fields: Array<Field>
}

type Schema = {
    [collectionName: string]: CollectionSchema
}

const postSchema: CollectionSchema = {
    fields: [
        {
            name: "title",
            type: PlainText,
        },
        {
            name: "slug",
            type: PlainText,
        },
        {
            name: "description",
            type: PlainText,
        },
        {
            name: "technical",
            type: BooleanField,
        },
        {
            name: "draft",
            type: BooleanField,
        },
        {
            name: "pubDate",
            type: DateField,
        },
        {
            name: "updatedDate",
            type: DateField,
        },
        {
            name: "content",
            type: RichText,
        },
    ]
};

const logSchema: CollectionSchema = {
    fields: [
        {
            name: "title",
            type: PlainText,
        },
        {
            name: "description",
            type: PlainText,
        },
        {
            name: "slug",
            type: PlainText,
        },
        {
            name: "pubDate",
            type: DateField,
        },
        {
            name: "content",
            type: RichText,
        },
        {
            name: "tags",
            type: StringArrayField,
        },
    ]
}

export const schema: Schema = {
    posts: postSchema,
    logs: logSchema
};

// Convex utils.

function toConvexField(field: Field): any {
    switch (field.type) {
        case "plainText":
        case "date":
            return v.string()
        case "richText":
            return v.object({
                lexicalJson: v.string(),
                html: v.string(),
            })
        case "boolean":
            return v.boolean()
        case "int64":
            return v.int64()
        case StringArrayField:
            return v.array(v.string())
        default:
            // let _: never = field
            throw new Error("Unsupported type")
    }
}

// TODO: types.
function toConvexSchema(schema: Schema): any {
    const schemaConvex: any = {};
    for (const [collection, collectionSchema] of Object.entries(schema)) {
        const collectionSchemaConvex: Record<string, any> = {
            valid: v.boolean(),
        };
        for (const field of collectionSchema.fields) {
            // Everything is optional, there will be a separate "_valid" check.
            collectionSchemaConvex[field.name] = v.optional(toConvexField(field));
        }
        schemaConvex[collection] = defineTable(collectionSchemaConvex);
    }
    return defineSchema(schemaConvex);
}


export const convexSchema = toConvexSchema(schema)

