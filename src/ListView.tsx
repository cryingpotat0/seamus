import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { auth } from "./auth";
import { useNavigate, useParams, Outlet } from "react-router-dom";
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
import {
    BooleanField,
    DateField,
    Field,
    NumberField,
    MediaField,
    PlainText,
    RichText,
    schema,
    StringArrayField,
} from "./lib/schema";
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

const defaultCollection = Object.keys(schema)[0];

export function ListView() {
    const navigate = useNavigate();
    const { collectionName: urlCollectionName } = useParams();
    const [activeCollection, setActiveCollection] = useState(urlCollectionName || defaultCollection);
    const addItem = useMutation(api.collections.add);

    const handleAddNew = async (collectionName: string) => {
        const newItemId = await addItem({ collectionName, item: {}, auth });
        navigate(`/collections/${collectionName}/${newItemId}`);
    };

    return (
        <div>
            <Tabs 
                value={activeCollection} 
                onValueChange={(value) => {
                    setActiveCollection(value);
                    navigate(`/collections/${value}`);
                }}
            >
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
                                <Button onClick={() => navigate(`/collections/${collectionName}/import`)}>
                                    Import
                                </Button>
                                <Button onClick={() => handleAddNew(collectionName)}>
                                    Add New
                                </Button>
                            </div>
                        </div>
                        <CollectionTable
                            collectionName={collectionName}
                            onSelectItem={(id) => navigate(`/collections/${collectionName}/${id}`)}
                        />
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}

function CollectionTable({
    collectionName,
    onSelectItem,
}: {
    collectionName: string;
    onSelectItem: (id: string) => void;
}) {
    const collections = useQuery(api.collections.list, {
        collectionName,
        auth,
    });
    const deleteItem = useMutation(api.collections.remove);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    const handleDelete = async () => {
        if (itemToDelete) {
            await deleteItem({ collectionName, id: itemToDelete, auth });
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
                                    onClick={() => onSelectItem(item._id)}
                                >
                                    {renderTableCell(
                                        item[field.name],
                                        collection.fields.find((f) => f.name === field.name)
                                    )}
                                </TableCell>
                            ))}
                            <TableCell>
                                <AlertDialog
                                    open={itemToDelete === item._id}
                                    onOpenChange={(open) => !open && setItemToDelete(null)}
                                >
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
                                                This action cannot be undone. This will permanently
                                                delete this record.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDelete}>
                                                Delete
                                            </AlertDialogAction>
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
    if (!fieldSchema) {
        return "<missing field>";
    }
    if (!value) {
        return "<undefined>";
    }
    switch (fieldSchema.type) {
        case PlainText:
            return value;
        case RichText:
            return "<Rich text>";
        case BooleanField:
            return value ? "Yes" : "No";
        case DateField:
            return new Date(value).toLocaleDateString();
        case NumberField:
            return value.toString();
        case StringArrayField:
            return value?.join(", ");
        case MediaField:
            return "<media>";
        case undefined:
            return "<Unknown field type>";
        default:
            let _exhaustiveCheck: never = fieldSchema.type;
            throw new Error("Unreachable");
    }
}
