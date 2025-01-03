import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { auth } from "../auth";
import {
    Field,
    PlainText,
    RelationField,
    RichText,
    schema
} from "../lib/schema";
import RichTextEditor from "./richtext";
import { Button } from "./ui/button";
import lzstring from "lz-string";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MultiSelect } from "@/components/ui/multi-select";

interface FieldDisplayProps {
    field: Field;
    value: any;
    onChange: (field: Field, value: any) => void;
    richTextEditorRefs?: {
        lexicalJson: React.MutableRefObject<any>;
        html: React.MutableRefObject<any>;
    };
}

export function FieldDisplay({
    field,
    value,
    onChange,
    richTextEditorRefs,
}: FieldDisplayProps) {
    const renderField = () => {
        const fieldType = field.type;
        switch (fieldType) {
            case PlainText:
                return (
                    <Input
                        value={value}
                        onChange={(e) => onChange(field, e.target.value)}
                    />
                );
            case RichText:
                let initialEditorState = value?.lexicalJson;
                // TODO: Hack
                if (initialEditorState === "{}") {
                    initialEditorState = undefined;
                }
                return (
                    <RichTextEditor
                        initialEditorState={initialEditorState}
                        editorRef={richTextEditorRefs}
                    />
                );
            case "boolean":
                return (
                    <Checkbox
                        checked={value}
                        onCheckedChange={(checked) => onChange(field, checked)}
                    />
                );
            case "date":
                return (
                    <Calendar
                        mode="single"
                        selected={new Date(value)}
                        onSelect={(date: Date | undefined) =>
                            onChange(field, date?.toISOString())
                        }
                    />
                );
            case "number":
                return (
                    <Input
                        type="number"
                        value={value}
                        onChange={(e) => onChange(field, parseInt(e.target.value, 10))}
                    />
                );
            case "stringarray":
                return (
                    <Input
                        value={value?.join(",")}
                        onChange={(e) => onChange(field, e.target.value.split(","))}
                    />
                );
            case "media":
                return <MediaDisplay value={value} onChange={onChange} field={field} />;
            case "options":
                return (
                    <Select
                        value={value || "<undefined>"}
                        onValueChange={(newValue) => {
                            if (newValue === "<undefined>") {
                                newValue = undefined
                            }
                            onChange(field, newValue)
                        }}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                            {field.optional && (
                                <SelectItem value={"<undefined>"}>empty</SelectItem>
                            )}
                            {field.options.map((option) => (
                                <SelectItem key={option} value={option}>
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            case RelationField:
                return <RelationFieldDisplay field={field} value={value} onChange={onChange} />;
            default:
                let _exhaustiveCheck: never = fieldType;
        }
    };

    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
                {field.name}
            </label>
            {renderField()}
        </div>
    );
}

function MediaDisplay({
    value,
    onChange,
    field,
}: {
    value: FieldDisplayProps["value"];
    onChange: FieldDisplayProps["onChange"];
    field: any;
}) {
    // TODO: ew
    value = value || {};
    return (
        <div className="flex flex-col gap-4">
            {value.mediaUrl && (
                <>
                    {value.mediaType.startsWith("image/") ? (
                        <img
                            src={value.mediaUrl}
                            alt="Uploaded media"
                            className="max-w-xs"
                        />
                    ) : (
                        <Button asChild>
                            <a href={value.mediaUrl} download>
                                Download File
                            </a>
                        </Button>
                    )}
                </>
            )}

            <Input
                type="file"
                accept="*/*"
                onChange={(e) => {
                    const file = e.target.files![0];
                    if (!file) return;
                    const mediaType = file.type;
                    const mediaUrl = URL.createObjectURL(file);
                    onChange(field, {
                        file: e.target.files![0],
                        mediaType,
                        mediaUrl,
                    });
                }}
            />
        </div>
    );
}

function RelationFieldDisplay({ 
    field, 
    value, 
    onChange 
}: { 
    field: Field, 
    value: any[], 
    onChange: FieldDisplayProps["onChange"] 
}) {
    // Fetch all items from the related collection
    const relatedItems = useQuery(api.collections.list, {
        collectionName: field.relatedTo,
        auth,
    }) ?? [];
    const relatedToSchema = schema.collections[field.relatedTo];

    // Convert items to the format expected by MultiSelect
    const options = relatedItems.map((item: any) => {
        return {
        value: item._id,
        label: item[relatedToSchema.displayField]
    }});

    // Convert current value to array of IDs
    const selectedIds = (value ?? []).map((item: any) => item._id);

    return (
        <MultiSelect
            options={options}
            onValueChange={(newIds) => {
                // Convert IDs back to array of objects with just _id
                const newValue = newIds.map(id => ({ _id: id }));
                onChange(field, newValue);
            }}
            defaultValue={selectedIds}
            placeholder={`Select ${field.name}`}
        />
    );
}
