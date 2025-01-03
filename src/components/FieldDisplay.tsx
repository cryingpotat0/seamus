import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
    Field,
    PlainText,
    RichText,
} from "../lib/schema";
import RichTextEditor from "./richtext";
import { Button } from "./ui/button";
import lzstring from "lz-string";

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
                let initialEditorState;
                try {
                    JSON.parse(value?.lexicalJson);
                    initialEditorState = value?.lexicalJson;
                } catch (e) {
                    console.log("trying to decompress");
                    // Maybe it's compressed while in this intermediary state.
                    initialEditorState = lzstring.decompressFromUTF16(value?.lexicalJson);
                    // console.log('decompressed', initialEditorState);
                    if (!initialEditorState) {
                        initialEditorState = value?.lexicalJson;
                    }
                }


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
                    <select
                        value={value}
                        onChange={(e) => onChange(field, e.target.value)}
                    >
                        {field.options.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                );
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
