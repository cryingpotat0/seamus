import type {
    EditorConfig,
    ElementFormatType,
    LexicalEditor,
    LexicalNode,
    NodeKey,
    Spread,
} from 'lexical';

import { BlockWithAlignableContents } from '@lexical/react/LexicalBlockWithAlignableContents';
import {
    DecoratorBlockNode,
    SerializedDecoratorBlockNode,
} from '@lexical/react/LexicalDecoratorBlockNode';
import { useEffect, useState } from 'react';

type JupyterHtmlComponentProps = Readonly<{
    className: Readonly<{
        base: string;
        focus: string;
    }>;
    format: ElementFormatType | null;
    nodeKey: NodeKey;
    cellId: string;
    url: string;
}>;

export type JupyterHtmlNodeArgs = { url: string; cellId: string };

function JupyterHtmlComponent({
    className,
    format,
    nodeKey,
    url,
    cellId,
}: JupyterHtmlComponentProps) {



    console.log('Jupyter render', cellId, url, import.meta.env.VITE_DEPLOYMENT_NAME);
    const [html, setHtml] = useState('<div>Loading...</div>');
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`https://${import.meta.env.VITE_DEPLOYMENT_NAME}.convex.site/get-jupyter-html-content`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        cellId,
                        url,
                    }),
                })
                const data = await res.json();
                const parsed = data.html;
                setHtml(parsed);
            } catch (e) {
                console.error(e);
            }
        })();
    }, [cellId, url]);

    return (
        <BlockWithAlignableContents
            className={className}
            format={format}
            nodeKey={nodeKey}>
            <iframe
                width="100%"
                height="315"
                srcDoc={html}
                allowFullScreen={true}
            />
        </BlockWithAlignableContents>
    );
}

export type SerializedJupyterHtmlNode = Spread<
    {
        url: string;
        cellId: string
    },
    SerializedDecoratorBlockNode
>;

export class JupyterHtmlNode extends DecoratorBlockNode {
    __url: string
    __cellId: string;

    static getType(): string {
        return 'jupyter_html';
    }

    static clone(node: JupyterHtmlNode): JupyterHtmlNode {
        return new JupyterHtmlNode({
            cellId: node.__cellId,
            url: node.__url,
        }, node.__format, node.__key);
    }

    static importJSON(serializedNode: SerializedJupyterHtmlNode): JupyterHtmlNode {
        const node = $createJupyterHtmlNode(serializedNode);
        node.setFormat(serializedNode.format);
        return node;
    }

    exportJSON(): SerializedJupyterHtmlNode {
        return {
            ...super.exportJSON(),
            cellId: this.__cellId,
            url: this.__url,
            type: 'jupyter_html',
            version: 1,
        };
    }

    constructor(args: JupyterHtmlNodeArgs, format?: ElementFormatType, key?: NodeKey) {
        super(format, key);
        this.__cellId = args.cellId;
        this.__url = args.url;
    }

    updateDOM(): false {
        return false;
    }

    getId(): string {
        return this.__url;
    }

    getTextContent(
        _includeInert?: boolean | undefined,
        _includeDirectionless?: false | undefined,
    ): string {
        return `${this.__url}`;
    }

    decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element {
        const embedBlockTheme = config.theme.embedBlock || {};
        const className = {
            base: embedBlockTheme.base || '',
            focus: embedBlockTheme.focus || '',
        };
        return (
            <JupyterHtmlComponent
                className={className}
                format={this.__format}
                nodeKey={this.getKey()}
                url={this.__url}
                cellId={this.__cellId}
            />
        );
    }
}

export function $createJupyterHtmlNode(args: JupyterHtmlNodeArgs): JupyterHtmlNode {
    return new JupyterHtmlNode(args);
}

export function $isJupyterHtmlNode(
    node: JupyterHtmlNode | LexicalNode | null | undefined,
): node is JupyterHtmlNode {
    return node instanceof JupyterHtmlNode;
}
