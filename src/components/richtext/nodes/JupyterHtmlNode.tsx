import type {
  DOMExportOutput,
  EditorConfig,
  ElementFormatType,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  Spread,
} from "lexical";
import { parse } from "node-html-parser";

import { BlockWithAlignableContents } from "@lexical/react/LexicalBlockWithAlignableContents";
import {
  DecoratorBlockNode,
  SerializedDecoratorBlockNode,
} from "@lexical/react/LexicalDecoratorBlockNode";
import { useEffect, useState } from "react";

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
  cellId,
  url,
}: JupyterHtmlComponentProps) {
  const [htmlContent, setHtmlContent] = useState("");
  useEffect(() => {
    (async () => {
      const res = await fetch(
        `https://${
          import.meta.env.VITE_DEPLOYMENT_NAME
        }.convex.site/proxy/${url}`,
        {
          method: "GET",
        }
      );
      const htmlContent = parse(await res.text());
      if (cellId?.length) {
        const cells = htmlContent.querySelectorAll('[id^="cell-id="]');
        const parent = cells[0].parentNode;
        const cellIdAsArr = (Array.isArray(cellId) ? cellId : [cellId]).map(
          (id) => `cell-id=${id}`
        );
        for (const cell of cells) {
          // If the cell id exists in cellIdAsArr, do not remove it
          if (!cellIdAsArr.includes(cell.id)) {
            parent.removeChild(cell);
          }
        }
      }
      setHtmlContent(htmlContent.toString());
    })();
  }, []);

  return (
    <BlockWithAlignableContents
      className={className}
      format={format}
      nodeKey={nodeKey}
    >
      {htmlContent.length === 0 ? (
        <div>Loading...</div>
      ) : (
        <iframe
          width="100%"
          height="315"
          srcDoc={htmlContent}
          allowFullScreen={true}
        />
      )}
    </BlockWithAlignableContents>
  );
}

export type SerializedJupyterHtmlNode = Spread<
  {
    url: string;
    cellId: string;
  },
  SerializedDecoratorBlockNode
>;

export class JupyterHtmlNode extends DecoratorBlockNode {
  __url: string;
  __cellId: string;

  static getType(): string {
    return "jupyter_html";
  }

  static clone(node: JupyterHtmlNode): JupyterHtmlNode {
    return new JupyterHtmlNode(
      {
        cellId: node.__cellId,
        url: node.__url,
      },
      node.__format,
      node.__key
    );
  }

  static importJSON(
    serializedNode: SerializedJupyterHtmlNode
  ): JupyterHtmlNode {
    const node = $createJupyterHtmlNode(serializedNode);
    node.setFormat(serializedNode.format);
    return node;
  }

  exportJSON(): SerializedJupyterHtmlNode {
    return {
      ...super.exportJSON(),
      cellId: this.__cellId,
      url: this.__url,
      type: "jupyter_html",
      version: 1,
    };
  }

  constructor(
    args: JupyterHtmlNodeArgs,
    format?: ElementFormatType,
    key?: NodeKey
  ) {
    super(format, key);
    this.__cellId = args.cellId;
    this.__url = args.url;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("jupyter-renderer");
    element.dataset.cellId = this.__cellId;
    element.dataset.url = this.__url;
    element.classList.add("JupyterHtml");
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
    _includeDirectionless?: false | undefined
  ): string {
    return `${this.__url}`;
  }

  decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element {
    const embedBlockTheme = config.theme.embedBlock || {};
    const className = {
      base: embedBlockTheme.base || "",
      focus: embedBlockTheme.focus || "",
    };
    console.log("JupyterHtmlNode.decorate", this.__url, this.__cellId);
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

export function $createJupyterHtmlNode(
  args: JupyterHtmlNodeArgs
): JupyterHtmlNode {
  return new JupyterHtmlNode(args);
}

export function $isJupyterHtmlNode(
  node: JupyterHtmlNode | LexicalNode | null | undefined
): node is JupyterHtmlNode {
  return node instanceof JupyterHtmlNode;
}
