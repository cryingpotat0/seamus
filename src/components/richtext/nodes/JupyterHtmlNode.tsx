import type {
    DOMExportOutput,
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

type JupyterHtmlComponentProps = Readonly<{
    className: Readonly<{
        base: string;
        focus: string;
    }>;
    format: ElementFormatType | null;
    nodeKey: NodeKey;
    htmlContent: string;
}>;

export type JupyterHtmlNodeArgs = { url: string; cellId: string; htmlContent: string };

function JupyterHtmlComponent({
    className,
    format,
    nodeKey,
    htmlContent,
}: JupyterHtmlComponentProps) {

    return (
        <BlockWithAlignableContents
            className={className}
            format={format}
            nodeKey={nodeKey}>
            <iframe
                width="100%"
                height="315"
                srcDoc={htmlContent}
                allowFullScreen={true}
            />
        </BlockWithAlignableContents>
    );
}

export type SerializedJupyterHtmlNode = Spread<
    {
        url: string;
        cellId: string;
        htmlContent: string;
    },
    SerializedDecoratorBlockNode
>;

export class JupyterHtmlNode extends DecoratorBlockNode {
    __url: string
    __cellId: string;
    __htmlContent: string;

    static getType(): string {
        return 'jupyter_html';
    }

    static clone(node: JupyterHtmlNode): JupyterHtmlNode {
        return new JupyterHtmlNode({
            cellId: node.__cellId,
            url: node.__url,
            htmlContent: node.__htmlContent,
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
            htmlContent: this.__htmlContent,
            type: 'jupyter_html',
            version: 1,
        };
    }

    constructor(args: JupyterHtmlNodeArgs, format?: ElementFormatType, key?: NodeKey) {
        super(format, key);
        this.__cellId = args.cellId;
        this.__url = args.url;
        this.__htmlContent = args.htmlContent;
    }

    exportDOM(): DOMExportOutput {
        const element = document.createElement('iframe');
        element.width = '100%';
        element.height = '315';
        element.srcdoc = this.__htmlContent;
        element.classList.add('JupyterHtml');
        return { element };
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
                htmlContent={this.__htmlContent}
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
