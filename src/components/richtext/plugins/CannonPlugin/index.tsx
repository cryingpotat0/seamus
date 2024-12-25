import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createParagraphNode, $insertNodes, $isRootOrShadowRoot, COMMAND_PRIORITY_EDITOR, createCommand, LexicalCommand } from "lexical";
import { useEffect, useState } from 'react';
import { $createCannonNode, CannonNode } from "../../nodes/CannonNode";
import { $wrapNodeInElement } from "@lexical/utils";

export const INSERT_CANNON_COMMAND: LexicalCommand<string> = createCommand(
    'INSERT_CANNON_COMMAND',
);

export default function CannonPlugin(): JSX.Element | null {
    const [editor] = useLexicalComposerContext();
    useEffect(() => {
        if (!editor.hasNodes([CannonNode])) {
            throw new Error('CannonPlugin: CannonNode not registered on editor');
        }

        return editor.registerCommand<string>(
            INSERT_CANNON_COMMAND,
            (payload) => {
                const cannonNode = $createCannonNode(payload ? JSON.parse(payload) : undefined);
                $insertNodes([cannonNode]);
                // if ($isRootOrShadowRoot(cannonNode.getParentOrThrow())) {
                //     $wrapNodeInElement(cannonNode, $createParagraphNode).selectEnd();
                // }

                return true;
            },
            COMMAND_PRIORITY_EDITOR,
        );
    }, [editor]);
    return null;
}
