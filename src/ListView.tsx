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
import { BooleanField, DateField, Field, Int64Field, MediaField, PlainText, RichText, schema, StringArrayField } from "./lib/schema";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { MigrationView } from "./MigrationView";

const defaultCollection = Object.keys(schema)[0];

export function ListView() {
    const [selectedItem, setSelectedItem] = useState<{
        collectionName: string;
        id: string;
    } | null>(null);
    const addItem = useMutation(api.collections.add);
    const [showMigration, setShowMigration] = useState(false);

    const handleAddNew = async (collectionName: string) => {
        const newItemId = await addItem({ collectionName, item: {} });
        setSelectedItem({ collectionName, id: newItemId });
    };

    return (
        <div>
            <Tabs defaultValue={defaultCollection}>
                <TabsList>
                    {Object.keys(schema.collections).map((collectionName) => (
                        <TabsTrigger key={collectionName} value={collectionName}>
                            {collectionName}
                        </TabsTrigger>
                    ))}
                </TabsList>
                {Object.keys(schema.collections).map((collectionName) => (
                    <TabsContent key={collectionName} value={collectionName}>
                        <div className="flex justify-between mb-4">
                            <h2 className="text-2xl">{collectionName}</h2>
                            <div className="flex gap-2">
                                <Button onClick={() => setShowMigration(true)}>Import</Button>
                                <Button onClick={() => handleAddNew(collectionName)}>Add New</Button>
                            </div>
                        </div>
                        <CollectionTable collectionName={collectionName} setSelectedItem={setSelectedItem} />
                        {showMigration && (
                            <MigrationView
                                collection={collectionName}
                                onClose={() => setShowMigration(false)}
                            />
                        )}
                    </TabsContent>
                ))}
            </Tabs>
            {selectedItem && (
                <EditView
                    collectionName={selectedItem.collectionName}
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
    const deleteItem = useMutation(api.collections.remove);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    const handleDelete = async () => {
        if (itemToDelete) {
            await deleteItem({ collectionName, id: itemToDelete });
            setItemToDelete(null);
        }
    };

    const collection = schema.collections[collectionName];

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        {collection?.fields.map((field) => (
                            <TableHead key={field.name}>{field.name}</TableHead>
                        ))}
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {collections?.map((item) => (
                        <TableRow key={item._id}>
                            {collection.fields.map((field) => (
                                <TableCell
                                    key={field.name}
                                    onClick={() => setSelectedItem({ collectionName, id: item._id })}
                                >
                                    {renderTableCell(item[field.name], collection.fields.find((f) => f.name === field.name))}
                                </TableCell>
                            ))}
                            <TableCell>
                                <AlertDialog open={itemToDelete === item._id} onOpenChange={(open) => !open && setItemToDelete(null)}>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setItemToDelete(item._id);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete this record.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </>
    );
}

function renderTableCell(value: any, fieldSchema: Field | undefined) {
    switch (fieldSchema?.type) {
        case PlainText:
            return value;
        case RichText:
            return "Rich text";
        case BooleanField:
            return value ? "Yes" : "No";
        case DateField:
            return new Date(value).toLocaleDateString();
        case Int64Field:
            return value.toString();
        case StringArrayField:
            return value?.join(", ");
        case MediaField:
            return "<media>";
        case undefined:
            return "Unknown field type"
        default:
            let _exhaustiveCheck: never = fieldSchema;
            throw new Error("Unreachable");
    }
}
