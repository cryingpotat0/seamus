import { useCallback, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { auth } from "./auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichText, schema } from "./lib/schema/index";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { createHeadlessEditor } from "@lexical/headless";
import { $convertFromMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import PlaygroundNodes from "./components/richtext/nodes/PlaygroundNodes";
import { $generateHtmlFromNodes } from "@lexical/html";
import { useNavigate, useParams, Navigate } from "react-router-dom";

type ValidationError = {
    row: number;
    column: string;
    message: string;
};

export function MigrationView() {
    const navigate = useNavigate();
    const { collectionName } = useParams();
    const [data, setData] = useState<any[]>([]);
    const [errors, setErrors] = useState<ValidationError[]>([]);
    const saveItems = useMutation(api.collections.saveMany);

    if (!collectionName) {
        return <Navigate to="/collections" replace />;
    }

    const handleFileUpload = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const text = await file.text();
        const lines = text.trim().split("\n");
        const parsedData = lines.map((line) => JSON.parse(line));

        validateAndProcessData(parsedData);
    };

    const collectionSchema = schema.collections[collectionName];

    const validateAndProcessData = useCallback(
        async (rawData: any[]) => {
            const newErrors: ValidationError[] = [];
            const processedData = await Promise.all(
                rawData.map(async (row, rowIndex) => {
                    const processedRow: any = {};

                    for (const field of collectionSchema.fields) {
                        const value = row[field.name];

                        if (field.type === RichText) {
                            if (value?.lexicalJson) {
                                processedRow[field.name] = value;
                                continue;
                            } else if (typeof value === "string") {
                                const editor = createHeadlessEditor({
                                    nodes: [...PlaygroundNodes],
                                    onError: () => { },
                                });

                                let html = "";
                                editor.update(
                                    () => {
                                        $convertFromMarkdownString(value || "", TRANSFORMERS);
                                        html = $generateHtmlFromNodes(editor, null);
                                    },
                                    {
                                        discrete: true,
                                    }
                                );

                                const editorState = editor.getEditorState();

                                processedRow[field.name] = {
                                    lexicalJson: JSON.stringify(editorState.toJSON()),
                                    html,
                                };
                            } else {
                                newErrors.push({
                                    row: rowIndex,
                                    column: field.name,
                                    message: "Invalid Rich Text Content",
                                });
                                continue;
                            }
                        } else {
                            processedRow[field.name] = value;
                        }
                    }

                    return processedRow;
                })
            );

            setData(processedData);
            setErrors(newErrors);
        },
        [collectionSchema.fields]
    );

    const handleSave = async () => {
        if (errors.length > 0) return;
        await saveItems({ collectionName, items: data, auth });
        navigate(`/collections/${collectionName}`);
    };

    const hasError = (rowIndex: number, column: string) => {
        return errors.some(
            (error) => error.row === rowIndex && error.column === column
        );
    };

    const getError = (rowIndex: number, column: string) => {
        return errors.find(
            (error) => error.row === rowIndex && error.column === column
        )?.message;
    };

    return (
        <div className="p-4">
            <div className="flex justify-between mb-4">
                <h2 className="text-2xl">Import {collectionName}</h2>
                <Input
                    type="file"
                    accept=".jsonl"
                    onChange={handleFileUpload}
                    className="max-w-xs"
                />
            </div>

            {data.length > 0 && (
                <>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {collectionSchema.fields.map((field) => (
                                    <TableHead key={field.name}>{field.name}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((row, rowIndex) => (
                                <TableRow key={rowIndex}>
                                    {collectionSchema.fields.map((field) => (
                                        <TooltipProvider key={field.name}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <TableCell
                                                        className={
                                                            hasError(rowIndex, field.name) ? "bg-red-100" : ""
                                                        }
                                                    >
                                                        {field.type === RichText
                                                            ? "Rich Text Content"
                                                            : String(row[field.name])}
                                                    </TableCell>
                                                </TooltipTrigger>
                                                {hasError(rowIndex, field.name) && (
                                                    <TooltipContent>
                                                        {getError(rowIndex, field.name)}
                                                    </TooltipContent>
                                                )}
                                            </Tooltip>
                                        </TooltipProvider>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <div className="mt-4 flex gap-2">
                        <Button onClick={handleSave} disabled={errors.length > 0}>
                            Save All
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => navigate(`/collections/${collectionName}`)}
                        >
                            Cancel
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}
