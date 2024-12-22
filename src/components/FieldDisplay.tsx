import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { PlainText, RichText } from "../lib/schema";
import RichTextEditor from './richtext';
import { Button } from "./ui/button";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api"
import { MediaProvider } from './richtext/context/MediaContext';
import { useCallback } from "react";
import { ConvexHttpClient } from "convex/browser";


// TODO: is there a better way?
const convex = new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL as string);

// Define all possible field types
type FieldType = typeof PlainText | typeof RichText | "boolean" | "date" | "int64" | "stringarray" | "media";

interface Field {
    name: string;
    type: FieldType;
}

interface FieldDisplayProps {
    field: Field;
    value: any;
    onChange: (field: Field, value: any) => void;
    richTextEditorRefs?: {
        lexicalJson: React.MutableRefObject<any>;
        html: React.MutableRefObject<any>;
    };
}

export function FieldDisplay({ field, value, onChange, richTextEditorRefs }: FieldDisplayProps) {

    const uploadMedia = useCallback(async (file: File) => {
        const uploadUrl = await convex.mutation(api.collections.generateUploadUrl);
        // Upload file
        const result = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                "Content-Type": file.type,
            },
            body: file,
        });
        const { storageId } = await result.json();
        const storageUrl = await convex.query(api.collections.generateDownloadUrl, { storageId });
        return { storageId, storageUrl };
    }, []);

    const downloadMedia = useCallback(async (storageId: string) => {
        const storageUrl = await convex.query(api.collections.generateDownloadUrl, { storageId });
        return { storageUrl };
    }, []);

    const renderField = () => {
        switch (field.type) {
            case PlainText:
                return (
                    <Input
                        value={value}
                        onChange={(e) => onChange(field, e.target.value)}
                    />
                );
            case RichText:
                return (
                    <MediaProvider uploadMedia={uploadMedia} downloadMedia={downloadMedia}>
                        <RichTextEditor
                            initialEditorState={value?.['lexicalJson']}
                            editorRef={richTextEditorRefs}
                        />
                    </MediaProvider>
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
                            onChange(field, date?.toISOString())}
                    />
                );
            case "int64":
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
                        value={value?.join(',')}
                        onChange={(e) => onChange(field, e.target.value.split(','))}
                    />
                );
            case "media":
                return (
                    <MediaDisplay value={value} onChange={onChange} field={field} />
                );
            default:
                let _exhaustiveCheck: never = field.type;
        }
    };

    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">{field.name}</label>
            {renderField()}
        </div>
    );
}

function MediaDisplay({ value, onChange, field }: { value: FieldDisplayProps['value'], onChange: FieldDisplayProps['onChange'], field: any }) {
    // TODO: ew
    value = value || {};
    return (
        <div className="flex flex-col gap-4">
            {value.mediaUrl && (
                <>
                    {value.mediaType.startsWith('image/') ? (
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
                    })
                }}
            />
        </div>
    );
}
