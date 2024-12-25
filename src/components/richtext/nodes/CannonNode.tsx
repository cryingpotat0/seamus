/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
    DecoratorNode,
    DOMConversionMap,
    DOMConversionOutput,
    DOMExportOutput,
    LexicalNode,
    NodeKey,
    SerializedLexicalNode,
    Spread,
} from 'lexical';
import { Cannon, CannonProvider, CannonSerializedProps, CodeEditor, Iframe, Language, Terminal, createTheme, getLanguageExtension, getTemplate, solarizedLight, useCannon } from 'cannon-codeeditor'
import { Suspense, useEffect } from 'react';


export type SerializedCannonNode = Spread<
    CannonSerializedProps,
    SerializedLexicalNode
>;

// TODO:
function $convertCannonElement(domNode: HTMLElement): DOMConversionOutput | null {
    const node = $createCannonNode();
    return { node };
}

export class CannonNode extends DecoratorNode<JSX.Element> {
    __props: CannonSerializedProps


    // Terrible terrible hacks to get this working. Think through what the *correct* way is to do this.
    // Cannot just make a top-level `serialize` function since it is a readonly property
    public fns: any = {
        serializer: undefined
    }


    static getType(): string {
        return 'cannon-codeeditor';
    }

    // TODO: implement correctly.
    static clone(node: CannonNode): CannonNode {
        return new CannonNode(node.__props, node.__key);
    }

    static importJSON(serializedNode: SerializedCannonNode): CannonNode {
        const node = $createCannonNode(serializedNode);
        return node;
    }

    constructor(serializedNode?: CannonSerializedProps, key?: NodeKey) {
        super(key);
        if (!serializedNode) {
            const template = getTemplate(Language.Rust)
            const defaultProps: CannonSerializedProps = {
                languageProps: {
                    language: Language.Rust,
                    runnerUrl: 'https://cryingpotat0--cannon-runners-run.modal.run',
                },
                files: template.initialFiles,
                output: template.initialOutput || "",
                focus: { filePath: Object.keys(template.initialFiles)[0] }
            };
            this.__props = defaultProps;
        } else {
            this.__props = serializedNode
        }
    }

    exportJSON(): SerializedCannonNode {
        return {
            // @ts-ignore
            ...(this.fns.serializer!()),
            type: CannonNode.getType(),
            version: 1,
        }
    }

    static importDOM(): DOMConversionMap | null {
        return {
            span: (domNode: HTMLElement) => {
                if (!domNode.hasAttribute('data-lexical-cannon-codeeditor-question')) {
                    return null;
                }
                return {
                    conversion: $convertCannonElement,
                    priority: 2,
                };
            },
        };
    }

    // TODO: implement
    exportDOM(): DOMExportOutput {
        const element = document.createElement('cannon-codeeditor');
        element.setAttribute('data-cannon-props', JSON.stringify(this.exportJSON()));
        return { element };
    }

    // TODO: implement
    createDOM(): HTMLElement {
        const elem = document.createElement('span');
        elem.style.display = 'inline-block';
        elem.style.width = '100%';
        return elem;
    }

    updateDOM(): false {
        return false;
    }

    decorate(): JSX.Element {
        const theme = solarizedLight
        const editorExtensions = [getLanguageExtension(this.__props.languageProps.language), createTheme(theme)]

        return (
            <Suspense fallback={null}>
                <CannonProvider
                    {...this.__props}
                    allowBuilder={true}
                >
                    <SyncSerializeFn obj={this} fnName={"serialize"} />
                    <CodeEditor
                        extensions={editorExtensions}
                        theme={theme}
                    />
                    <Terminal
                        config={{
                            theme,
                        }}
                    />
                    <Iframe
                        style={{
                            display: 'none'
                        }}
                    />
                </CannonProvider>
            </Suspense>
        );
    }
}

// Heresy beyond belief
function SyncSerializeFn({ obj, fnName }: { obj: CannonNode, fnName: string }) {
    const { commands: { serialize } } = useCannon();
    useEffect(() => {
        if (serialize) {
            // console.log("Syncing serialize function", serialize, obj)
            obj.fns.serializer = () => {
                // console.log('calling sreializer');
                const value = serialize()
                // console.log('value', value)
                return value
            }
            // @ts-ignore
        } else {
            console.log("Serialize function not found")
        }
    }, [serialize])
    return null
}

export function $createCannonNode(serializedNode?: CannonSerializedProps): CannonNode {
    return new CannonNode(serializedNode);
}

export function $isCannonNode(
    node: LexicalNode | null | undefined,
): node is CannonNode {
    return node instanceof CannonNode;
}
