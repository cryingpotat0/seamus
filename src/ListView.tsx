import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { EditView } from "./EditView";
import { Field, schema } from "./lib/schema";

const defaultCollection = Object.keys(schema)[0];

export function ListView() {
    const [selectedItem, setSelectedItem] = useState<{
        collectionName: string;
        id: string;
    } | null>(null);
    const addItem = useMutation(api.collections.add);

    const handleAddNew = async (collectionName: string) => {
        const newItemId = await addItem({ collectionName, item: {} });
        setSelectedItem({ collectionName, id: newItemId });
    };

    return (
        <div>
            <Tabs defaultValue={defaultCollection}>
                <TabsList>
                    {Object.keys(schema).map((collectionName) => (
                        <TabsTrigger key={collectionName} value={collectionName}>
                            {collectionName}
                        </TabsTrigger>
                    ))}
                </TabsList>
                {Object.keys(schema).map((collectionName) => (
                    <TabsContent key={collectionName} value={collectionName}>
                        <div className="flex justify-between mb-4">
                            <h2 className="text-2xl">{collectionName}</h2>
                            <Button onClick={() => handleAddNew(collectionName)}>Add New</Button>
                        </div>
                        <CollectionTable collectionName={collectionName} setSelectedItem={setSelectedItem} />
                    </TabsContent>
                ))}
            </Tabs>
            {selectedItem && (
                <EditView
                    collection={selectedItem.collectionName}
                    itemId={selectedItem.id}
                    onClose={() => setSelectedItem(null)}
                />
            )}
        </div>
    );
}

function CollectionTable({
    collectionName,
    setSelectedItem,
}: {
    collectionName: string;
    setSelectedItem: (item: { collectionName: string; id: string }) => void;

}) {
    const collections = useQuery(api.collections.list, {
        collectionName,
    });
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    {schema[collectionName].fields.map((field) => (
                        <TableHead key={field.name}>{field.name}</TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {collections?.map((item) => (
                    <TableRow key={item._id} onClick={() => setSelectedItem({ collectionName, id: item._id })}>
                        {schema[collectionName].fields.map((field) => (
                            <TableCell key={field.name}>
                                {renderTableCell(item[field.name], schema[collectionName].fields.find((f) => f.name === field.name))}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>

    )
}

function renderTableCell(value: any, fieldSchema: Field | undefined) {
    switch (fieldSchema?.type) {
        case "string":
            return fieldSchema.richText ? "Rich Text" : value;
        case "boolean":
            return value ? "Yes" : "No";
        case "date":
            return new Date(value).toLocaleDateString();
        case "int64":
            return value.toString();
        default:
            return value;
    }
}
