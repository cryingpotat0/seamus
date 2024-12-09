import { v, VBoolean, VInt64, VString } from "convex/values";
import { defineSchema, defineTable } from "convex/server";
import { Type, type Static } from "@sinclair/typebox"

// Primitive types for the first level of schema - this is what the user will
// define the schema in.
type StringField = "string"
const StringField = "string"

type DateField = "date"
const DateField = "date"

type Int64Field = "int64"
const Int64Field = "int64"

type BooleanField = "boolean"
const BooleanField = "boolean"

type CommonFieldOptions = {
    name: string
}

export type Field = CommonFieldOptions & ({
    type: StringField
    richText?: boolean
} | {
    type: Int64Field
} | {
    type: BooleanField
} | {
    type: DateField
})


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
            type: StringField,
        },
        {
            name: "slug",
            type: StringField,
        },
        {
            name: "description",
            type: StringField,
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
            type: StringField,
            richText: true,
        },
    ]
};

const logSchema: CollectionSchema = {
    fields: [
        {
            name: "title",
            type: StringField,
        },
        {
            name: "slug",
            type: StringField,
        },
        {
            name: "pubDate",
            type: DateField,
        },
        {
            name: "content",
            type: StringField,
            richText: true,
        },
    ]
}

export const schema: Schema = {
    posts: postSchema,
    logs: logSchema
};

// Convex utils.

function toConvexField(field: Field): VString | VBoolean | VInt64 {
    switch (field.type) {
        case "string":
        case "date":
            return v.string()
        case "boolean":
            return v.boolean()
        case "int64":
            return v.int64()
        default:
            let _: never = field
            throw new Error("Unsupported type")
    }
}

// TODO: types.
function toConvexSchema(schema: Schema): any {
    const schemaConvex: any = {};
    for (const [collection, collectionSchema] of Object.entries(schema)) {
        const collectionSchemaConvex: Record<string, any> = {
            _valid: v.boolean(), // Indicates whether the current row is valid.
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

