import { v } from "convex/values";
import { defineTable } from "convex/server";

// Primitive types for the first level of schema - this is what the user will
// define the schema in.
export type PlainText = "plainText";
export const PlainText: PlainText = "plainText";

export type RichText = "richText";
export const RichText: RichText = "richText";

export type DateField = "date";
export const DateField: DateField = "date";

export type NumberField = "number";
export const NumberField = "number";

export type BooleanField = "boolean";
export const BooleanField = "boolean";

export type StringArrayField = "stringarray";
export const StringArrayField: StringArrayField = "stringarray";

export type OptionsField = "options";
export const OptionsField: OptionsField = "options";

export type MediaField = "media";
export const MediaField: MediaField = "media";

type FieldValidationFunction = (value: any) => boolean;

const NonEmpty: FieldValidationFunction = (value: any) => {
    return value !== null && value !== undefined && value !== "";
}

const NonZero: FieldValidationFunction = (value: any) => {
    return value !== null && value !== undefined && value !== 0;
}

type CommonFieldOptions = {
    name: string;
    // All fields are required unless otherwise specified.
    optional?: boolean;
    default?: any | (() => any);
    validate?: FieldValidationFunction;
};

export type Field = CommonFieldOptions & ({
    type:
    | PlainText
    | RichText
    | NumberField
    | BooleanField
    | StringArrayField
    | MediaField;
} | {
    type: DateField;
    setOnCreate?: boolean;
    setOnUpdate?: boolean;
} | {
    type: OptionsField;
    options: Array<string>;
});

type CollectionSchema = {
    fields: Array<Field>;
    mediaProvider?: string;
};

type Schema = {
    collections: { [collectionName: string]: CollectionSchema };
    richTextMediaProviderCollection: string;
};



const postSchema: CollectionSchema = {
    fields: [
        {
            name: "title",
            type: PlainText,
            validate: NonEmpty,
        },
        {
            name: "slug",
            type: PlainText,
            validate: NonEmpty,
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
            setOnCreate: true,
        },
        {
            name: "updatedDate",
            type: DateField,
            setOnUpdate: true,
        },
        {
            name: "content",
            type: RichText,
        },
        {
            name: "tags",
            type: StringArrayField,
        },
    ],
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
            setOnUpdate: true,
        },
        {
            name: "content",
            type: RichText,
        },
        {
            name: "tags",
            type: StringArrayField,
        },
    ],
};

const mediaSchema: CollectionSchema = {
    fields: [
        {
            name: "description",
            type: PlainText,
        },
        {
            name: "media",
            type: MediaField,
        },
    ],
};

const showcaseSchema: CollectionSchema = {
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
            setOnCreate: true,
        },
        {
            name: "updatedDate",
            type: DateField,
            setOnUpdate: true,
        },
        {
            name: "content",
            type: RichText,
        },
        {
            name: "tags",
            type: StringArrayField,
        },
        {
            name: "heroImage",
            type: MediaField,
        },
        {
            name: "icon",
            type: MediaField,
        },
        {
            name: "url",
            type: PlainText,
        },
    ],
};

const ideasSchema: CollectionSchema = {
    fields: [
        {
            name: "title",
            type: PlainText,
        },
        {
            name: "content",
            type: RichText,
        },
        {
            name: "updatedDate",
            type: DateField,
            setOnUpdate: true,
        },
    ],
};

// This is really a media type.
const bookSchema: CollectionSchema = {
    fields: [
        {
            name: "title",
            type: PlainText,
        },
        {
            name: "category",
            type: PlainText,
        },
        {
            name: "pubDate",
            type: DateField,
            setOnCreate: true,
        },
        {
            name: "year",
            type: NumberField,
        },
        {
            name: "rating",
            type: NumberField,
            validate: NonZero,
        },
        {
            name: "mediaType",
            type: OptionsField,
            options: ["book", "series", "movie", "play"],
            default: "book",
        },
        {
            name: "review",
            type: RichText,
        },
    ],
};

export const schema: Schema = {
    collections: {
        posts: postSchema,
        logs: logSchema,
        media: mediaSchema,
        showcase: showcaseSchema,
        ideas: ideasSchema,
        books: bookSchema,
    },
    richTextMediaProviderCollection: "media",
};

// Convex utils.

function toConvexField(field: Field): any {
    const fieldType: Field["type"] = field.type;
    switch (fieldType) {
        case PlainText:
        case DateField:
            return v.string();
        case RichText:
            return v.object({
                lexicalJson: v.string(),
                html: v.string(),
            });
        case BooleanField:
            return v.boolean();
        case NumberField:
            return v.number();
        case StringArrayField:
            return v.array(v.string());
        case MediaField:
            return v.object({
                mediaId: v.string(),
                mediaType: v.string(),
                // Not the best schema -- but keeps a pointer to the source item.
                sourceItemId: v.optional(v.string()), // can't use v.id()
            });
        case OptionsField:
            if (field.type !== OptionsField) {
                throw new Error("Invalid type");
            }
            const options = field.options;
            return v.union(...options.map((option) => v.literal(option)));
        default:
            let _: never = fieldType
    }
}

function isMediaCollection(collection: CollectionSchema | undefined): boolean {
    return Boolean(
        collection?.fields.filter((f) => f.type === MediaField)?.length === 1
    );
}

// TODO: types.
function toConvexSchema(schema: Schema): any {
    const schemaConvex: any = {};

    // Ensure that the default media provider exists.
    if (
        !isMediaCollection(
            schema.collections[schema.richTextMediaProviderCollection]
        )
    ) {
        throw new Error("Media provider collection must exist in the schema");
    }
    // console.log(`Found media provider collection: ${schema.mediaProviderCollection}`);

    for (const [collection, collectionSchema] of Object.entries(
        schema.collections
    )) {
        const collectionSchemaConvex: Record<string, any> = {
            valid: v.boolean(),
        };
        for (const field of collectionSchema.fields) {
            // Everything is optional, there will be a separate "_valid" check.
            collectionSchemaConvex[field.name] = v.optional(toConvexField(field));
        }
        schemaConvex[collection] = defineTable(collectionSchemaConvex);
    }
    return schemaConvex;
}

function getDefaultFieldValue(field: Field): any {
    const type = field.type;
    switch (type) {
        case PlainText:
            return "";
        case RichText:
            return {
                lexicalJson: "",
                html: "",
            };
        case DateField:
            return new Date().toISOString();
        case BooleanField:
            return false;
        case NumberField:
            return 0;
        case StringArrayField:
            return [];
        case MediaField:
            return {
                mediaId: undefined,
                mediaType: undefined,
            };
        case OptionsField:
            return field.options[0];
        default:
            let _: never = type
    }
}

export function getDefaultItem(collection: string): any {
    const item: any = {};
    for (const field of schema.collections[collection].fields) {
        if (field.optional) {
            continue;
        }

        if (typeof field.default === "function") {
            item[field.name] = field.default();
        } else if (field.default !== undefined) {
            item[field.name] = field.default;
        } else {
            item[field.name] = getDefaultFieldValue(field)
        }
    }
    return item;
}

export function validateSchema(item: any, collectionName: string): boolean {
    const currSchema = schema.collections[collectionName];
    for (const field of currSchema.fields) {
        if (field.optional) {
            continue;
        }
        if (item[field.name] === undefined) {
            return false;
        }
        if (field.validate && !field.validate(item[field.name])) {
            return false;
        }
    }
    return true;
}

export const convexSchema = toConvexSchema(schema);
