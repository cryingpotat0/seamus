import { useEffect, useRef, useState } from "react";
import RichTextEditor from './components/richtext'
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { schema } from "./lib/schema";

export function EditView({
    collection,
    itemId,
    onClose
}:
    {
        collection: string;
        itemId: string,
        onClose: () => void
    }) {
    const item = useQuery(api.collections.get, { collectionName: collection, id: itemId });
    const [editedItem, setEditedItem] = useState(item);
    // This feels ugly.
    const editedItemRef = useRef(editedItem);
    const saveItem = useMutation(api.collections.save);

    useEffect(() => {
        setEditedItem(item);
    }, [item]);

    useEffect(() => {
        editedItemRef.current = editedItem;
    }, [editedItem]);

    const handleChange = (field: any, value: any) => {
        setEditedItem((prev) => ({ ...prev, [field.name]: value }));
    };

    const handleSave = () => {
        console.log('saving', editedItem, editedItemRef);
        saveItem({ collectionName: collection, item: editedItem });
        onClose();
    };

    if (!editedItem) {
        return <div>Loading...</div>;
    }

    return (
        <div className="p-4 border rounded-lg">
            <h2 className="text-2xl mb-4">Edit {collection} Item</h2>
            {schema[collection].fields.map((field) => (
                <div key={field.name} className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">{field.name}</label>
                    {field.type === "string" && !field.richText && (
                        <Input
                            value={editedItem[field.name]}
                            onChange={(e) => handleChange(field, e.target.value)}
                        />
                    )}
                    {field.type === "string" && field.richText && (
                        <RichTextEditor
                            initialEditorState={editedItem[field.name]}
                            stateRef={{
                                ref: editedItemRef,
                                fieldName: field.name
                            }}
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
                </div>
            ))}
            <Button onClick={handleSave}>Save</Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
    );
}
