import { useEffect, useRef, useState } from "react";
import RichTextEditor from './components/richtext'
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { PlainText, RichText, schema } from "./lib/schema";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { $generateHtmlFromNodes } from "@lexical/html";

export function EditView({
    collectionName,
    itemId,
    onClose
}:
    {
        collectionName: string;
        itemId: string,
        onClose: () => void
    }) {
    const item = useQuery(api.collections.get, { collectionName, id: itemId });
    const [editedItem, setEditedItem] = useState(item);
    const [error, setError] = useState<Error | null>(null);

    const richTextEditorRefs: {
        [fieldName: string]: {
            lexicalJson: React.MutableRefObject<any>,
            html: React.MutableRefObject<any>
        }
    } = {};
    const collection = schema.collections[collectionName];
    for (const field of collection.fields) {
        if (field.type === RichText) {
            richTextEditorRefs[field.name] = {
                lexicalJson: useRef(),
                html: useRef()
            }
        }
    }


    const saveItem = useMutation(api.collections.save);
    const generateUploadUrl = useMutation(api.collections.generateUploadUrl);

    useEffect(() => {
        setEditedItem(item);
    }, [item]);

    const handleChange = (field: any, value: any) => {
        setEditedItem((prev: any) => ({ ...prev, [field.name]: value }));
    };

    const handleSave = async () => {
        try {
            // TODO: do this on a copy of editedItem? Or take the state in etc. this is kinda hacky rn.
            for (const [fieldName, richFieldDataRefs] of Object.entries(richTextEditorRefs)) {
                const richFieldData = {
                    lexicalJson: JSON.stringify(richFieldDataRefs.lexicalJson.current),
                    html: richFieldDataRefs.html.current,
                };
                console.log(richFieldData);
                editedItem[fieldName] = richFieldData
            }

            for (const field of collection.fields) {
                if (field.type === "media") {
                    const file = editedItem[field.name][0];
                    const mediaUrl = await generateUploadUrl();
                    const result = await fetch(mediaUrl, {
                        method: 'POST',
                        headers: {
                            "Content-Type": file.type,
                        },
                        body: file,
                    });
                    const { storageId } = await result.json();
                    editedItem[field.name] = { mediaUrl: storageId, mediaType: file.type };
                }
            }

            await saveItem({ collectionName, item: editedItem });
            onClose();
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e : new Error('An unknown error occurred'));
        }
    };

    if (!editedItem) {
        return <div>Loading...</div>;
    }

    return (
        <>
            <div className="p-4 border rounded-lg">
                <h2 className="text-2xl mb-4">Edit {collectionName} Item</h2>
                {collection.fields.map((field) => (
                    <div key={field.name} className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">{field.name}</label>
                        {field.type === PlainText && (
                            <Input
                                value={editedItem[field.name]}
                                onChange={(e) => handleChange(field, e.target.value)}
                            />
                        )}
                        {field.type === RichText && (
                            <RichTextEditor
                                initialEditorState={editedItem[field.name]?.['lexicalJson']}
                                editorRef={richTextEditorRefs[field.name]}
                            />
                        )}
                        {field.type === "boolean" && (
                            <Checkbox
                                checked={editedItem[field.name]}
                                onCheckedChange={(checked) => handleChange(field, checked)}
                            />
                        )}
                        {field.type === "date" && (
                            <Calendar
                                mode="single"
                                selected={new Date(editedItem[field.name])}
                                onSelect={(date: any) => handleChange(field, date.toISOString())}
                            />
                        )}
                        {field.type === "int64" && (
                            <Input
                                type="number"
                                value={editedItem[field.name]}
                                onChange={(e) => handleChange(field, parseInt(e.target.value, 10))}
                            />
                        )}
                        {field.type === "stringarray" && (
                            <Input
                                value={editedItem[field.name].join(',')}
                                onChange={(e) => handleChange(field, e.target.value.split(','))}
                            />
                        )}
                        {field.type === "media" && (
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleChange(field, e.target.files)}
                            />
                        )}
                    </div>
                ))}
                <Button onClick={handleSave}>Save</Button>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
            </div>

            <AlertDialog open={error !== null} onOpenChange={() => setError(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Error Saving {collectionName}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {error?.message || 'An unknown error occurred while saving.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setError(null)}>OK</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
