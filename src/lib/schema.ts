import { v } from "convex/values";
import { defineSchema, defineTable } from "convex/server";

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

export type MediaField = "media";
export const MediaField: MediaField = "media";

type CommonFieldOptions = {
  name: string;
};

export type Field = CommonFieldOptions & {
  type:
    | PlainText
    | RichText
    | DateField
    | NumberField
    | BooleanField
    | StringArrayField
    | MediaField;
};

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
    },
    {
      name: "updatedDate",
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
    {
      name: "tags",
      type: StringArrayField,
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
    },
  ],
};

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
    },
    {
      name: "year",
      type: NumberField,
    },
    {
      name: "rating",
      type: NumberField,
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
  switch (field.type) {
    case "plainText":
    case "date":
      return v.string();
    case "richText":
      return v.object({
        lexicalJson: v.string(),
        html: v.string(),
      });
    case "boolean":
      return v.boolean();
    case "number":
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
    default:
      // let _: never = field
      throw new Error("Unsupported type");
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
  return defineSchema(schemaConvex);
}

export const convexSchema = toConvexSchema(schema);
