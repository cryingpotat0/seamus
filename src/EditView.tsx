import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { RichText, schema } from "./lib/schema/index";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FieldDisplay } from "./components/FieldDisplay";
import { useCallback } from "react";
import { ConvexHttpClient } from "convex/browser";
import { MediaProvider } from "./components/richtext/context/MediaContext";
import { auth } from "./auth";
import { useNavigate, useParams, Navigate } from "react-router-dom";

const convex = new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL as string);

export function EditView() {
    const navigate = useNavigate();
    const { collectionName, itemId } = useParams();

    if (!collectionName || !itemId) {
        return <Navigate to="/collections" replace />;
    }

    const item = useQuery(api.collections.get, { collectionName, id: itemId, auth });
    const [editedItem, setEditedItem] = useState(item);
    const [error, setError] = useState<Error | null>(null);

    const richTextEditorRefs: {
        [fieldName: string]: {
            lexicalJson: React.MutableRefObject<any>;
            html: React.MutableRefObject<any>;
        };
    } = {};
    const collection = schema.collections[collectionName];
    const mediaCollectionName =
        collection.mediaProvider || schema.richTextMediaProviderCollection;

    for (const field of collection.fields) {
        if (field.type === RichText) {
            richTextEditorRefs[field.name] = {
                lexicalJson: useRef(),
                html: useRef(),
            };
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

    const uploadRichTextMedia = useCallback(async (file: File) => {
        const uploadUrl = await convex.mutation(api.collections.generateUploadUrl, { auth });
        const result = await fetch(uploadUrl, {
            method: "POST",
            headers: {
                "Content-Type": file.type,
            },
            body: file,
        });
        const { storageId } = await result.json();
        const storageUrl = await convex.query(api.collections.generateDownloadUrl, {
            storageId,
            auth,
        });

        await convex.mutation(api.collections.add, {
            collectionName: mediaCollectionName,
            auth,
            item: {
                description: file.name,
                media: {
                    mediaId: storageId,
                    mediaType: file.type,
                    sourceItemId: itemId,
                },
            },
        });

        return { storageId, storageUrl };
    }, [mediaCollectionName, itemId]);

    const downloadRichTextMedia = useCallback(async (storageId: string) => {
        const storageUrl = await convex.query(api.collections.generateDownloadUrl, {
            storageId,
            auth,
        });
        return { storageUrl };
    }, []);

    const handleSave = async () => {
        if (!editedItem) {
            console.error("No item to save");
            return;
        }
        try {
            for (const [fieldName, richFieldDataRefs] of Object.entries(
                richTextEditorRefs
            )) {
                const lexicalJson = JSON.stringify(
                    richFieldDataRefs.lexicalJson.current
                );
                const richFieldData = {
                    lexicalJson,
                    html: richFieldDataRefs.html.current,
                };
                editedItem[fieldName] = richFieldData;
            }

            for (const field of collection.fields) {
                if (field.type === "media" && editedItem[field.name]) {
                    const { file, mediaUrl: _, mediaType } = editedItem[field.name];
                    if (file) {
                        const mediaUrl = await generateUploadUrl({ auth });
                        const result = await fetch(mediaUrl, {
                            method: "POST",
                            headers: {
                                "Content-Type": file.type,
                            },
                            body: file,
                        });
                        const { storageId } = await result.json();
                        editedItem[field.name] = { mediaId: storageId, mediaType };
                    } else {
                        delete editedItem[field.name]["mediaUrl"];
                    }
                }
            }

            await saveItem({ collectionName, item: editedItem, auth });
            navigate(`/collections/${collectionName}`);
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e : new Error("An unknown error occurred"));
        }
    };

    if (!editedItem) {
        return <div>Loading...</div>;
    }

    return (
        <div className="p-4 border rounded-lg">
            <MediaProvider
                uploadMedia={uploadRichTextMedia}
                downloadMedia={downloadRichTextMedia}
            >
                <h2 className="text-2xl mb-4">Edit {collectionName} Item</h2>
                {collection.fields.map((field) => (
                    <FieldDisplay
                        key={field.name}
                        field={field}
                        value={editedItem[field.name]}
                        onChange={handleChange}
                        richTextEditorRefs={
                            field.type === RichText
                                ? richTextEditorRefs[field.name]
                                : undefined
                        }
                    />
                ))}
                <Button onClick={handleSave}>Save</Button>
                <Button
                    variant="outline"
                    onClick={() => navigate(`/collections/${collectionName}`)}
                >
                    Cancel
                </Button>
            </MediaProvider>

            <AlertDialog open={error !== null} onOpenChange={() => setError(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Error Saving {collectionName}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {error?.message || "An unknown error occurred while saving."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setError(null)}>
                            OK
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
