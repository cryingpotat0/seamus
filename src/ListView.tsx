import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { auth } from "./auth";
import { useNavigate, useParams } from "react-router-dom";
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
import { useState, useMemo } from "react";
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
    OptionsField,
    RelationField,
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
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
    createColumnHelper,
    ColumnDef,
    getSortedRowModel,
    SortingState,
    getFilteredRowModel,
    ColumnFiltersState,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { ArrowUpDown } from "lucide-react";
import { Settings } from "lucide-react";

const defaultCollection = Object.keys(schema.collections)[0];

// Define the base structure for collection items
interface CollectionItem {
    _id: string;
    [key: string]: any; // This allows for dynamic fields
}

function DeployButton() {
    const deployUrl = useQuery(api.settings.get, { key: "deployUrl" });

    const handleDeploy = async () => {
        if (!deployUrl) {
            alert("Please set deploy URL in settings first");
            return;
        }
        try {
            await fetch(deployUrl, { method: "POST" });
            alert("Deployment triggered successfully");
        } catch (error: any) {
            // TODO: this fails with a CORS error, we should use a convex http action instead.
            alert("Deployment failed: " + error.message);
        }
    };

    return (
        <Button
            onClick={handleDeploy}
            title="Deploy"
        >
            🚀 Deploy
        </Button>
    );
}

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
                                <Button onClick={() => navigate("/settings")}>
                                    <Settings className="h-4 w-4 mr-2" />
                                    Settings
                                </Button>
                                <Button onClick={() => navigate(`/collections/${collectionName}/import`)}>
                                    Import
                                </Button>
                                <DeployButton />
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
    }) || [] as CollectionItem[];
    const deleteItem = useMutation(api.collections.remove);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const collection = schema.collections[collectionName];

    // Add state for sorting and filtering
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');

    const columns = useMemo(() => {
        const columnHelper = createColumnHelper<CollectionItem>();

        const fieldColumns = collection?.fields.map((field, index) =>
            columnHelper.accessor((row) => row[field.name], {
                id: `${collectionName}_${field.name}_${index}`,
                header: ({ column }) => {
                    return (
                        <div className="flex items-center justify-between">
                            <div>{field.name}</div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => column.toggleSorting()}
                            >
                                <ArrowUpDown className="h-4 w-4" />
                            </Button>
                        </div>
                    );
                },
                cell: (info) => renderTableCell(info.getValue(), field),
                // Enable filtering for text-based fields
                enableColumnFilter: ([PlainText, RichText, StringArrayField] as Array<Field["type"]>).includes(field.type),
            })
        ) || [];

        const actionsColumn = columnHelper.display({
            id: `${collectionName}_actions`,
            header: 'Actions',
            cell: (props) => (
                <AlertDialog
                    open={itemToDelete === props.row.original._id}
                    onOpenChange={(open) => !open && setItemToDelete(null)}
                >
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setItemToDelete(props.row.original._id);
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
                            <AlertDialogAction onClick={() => deleteItem({ collectionName, id: props.row.original._id, auth })}>
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            ),
        });

        return [...fieldColumns, actionsColumn] as ColumnDef<CollectionItem>[];
    }, [collection, itemToDelete, collectionName]);

    const table = useReactTable({
        data: collections,
        columns,
        getCoreRowModel: getCoreRowModel(),
        // Add sorting
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting,
            globalFilter,
        },
        // Add filtering
        onGlobalFilterChange: setGlobalFilter,
        getFilteredRowModel: getFilteredRowModel(),
        // Add global filter function
        globalFilterFn: (row, columnId, filterValue) => {
            const value = row.getValue(columnId);
            if (value == null) return false;

            // Convert the value to a string for searching
            let textValue = '';
            if (typeof value === 'string') {
                textValue = value;
            } else if (typeof value === 'number') {
                textValue = value.toString();
            } else if (Array.isArray(value)) {
                textValue = value.join(' ');
            } else if (value instanceof Date) {
                textValue = value.toLocaleDateString();
            } else if (typeof value === 'boolean') {
                textValue = value ? 'Yes' : 'No';
            }

            return textValue.toLowerCase().includes(filterValue.toLowerCase());
        },
    });

    return (
        <div>
            {/* Replace multiple filters with single search input */}
            <div className="flex gap-2 py-4">
                <Input
                    placeholder="Search all columns..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id}>
                                    {flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
                                    )}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows.map((row) => (
                        <TableRow
                            key={row.id}
                            onClick={() => {
                                if (itemToDelete === null) {
                                    return onSelectItem(row.original._id)
                                }
                            }}
                            className={row.original.valid === false ? "bg-red-100 hover:bg-red-200" : ""}
                        >
                            {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id}>
                                    {flexRender(
                                        cell.column.columnDef.cell,
                                        cell.getContext()
                                    )}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

function renderTableCell(value: any, fieldSchema: Field | undefined) {
    if (!fieldSchema) {
        return "<missing field>";
    }
    const type = fieldSchema.type;
    switch (type) {
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
        case OptionsField:
            return value || "<empty>";
        case RelationField:
            return "<relation>";
        default:
            let _: never = type;
    }
}
