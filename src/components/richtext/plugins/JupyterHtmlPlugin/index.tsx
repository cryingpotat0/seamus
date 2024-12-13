import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $insertNodeToNearestRoot } from '@lexical/utils';
import { COMMAND_PRIORITY_EDITOR, createCommand, LexicalCommand } from 'lexical';
import { useEffect } from 'react';

import { $createJupyterHtmlNode, JupyterHtmlNode } from '../../nodes/JupyterHtmlNode';

export const INSERT_JUPYTER_HTML_COMMAND: LexicalCommand<string> = createCommand(
    'INSERT_JUPYTER_HTML_COMMAND',
);

export default function JupyterHtmlPlugin(): JSX.Element | null {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        if (!editor.hasNodes([JupyterHtmlNode])) {
            throw new Error('JupyterHtmlPlugin: JupyterHtmlNode not registered on editor');
        }

        return editor.registerCommand<string>(
            INSERT_JUPYTER_HTML_COMMAND,
            (payload) => {
                try {
                    const figmaNode = $createJupyterHtmlNode(JSON.parse(payload));
                    $insertNodeToNearestRoot(figmaNode);
                    return true;
                } catch (e) {
                    console.error(e);
                    return false;
                }
            },
            COMMAND_PRIORITY_EDITOR,
        );
    }, [editor]);

    return null;
}
