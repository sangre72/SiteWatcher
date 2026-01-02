import React, { useEffect, useRef, useState } from 'react';
import { Tree } from 'rc-easyui';
import 'rc-easyui/dist/themes/default/easyui.css';
import 'rc-easyui/dist/themes/icon.css';

interface TreeData {
    id: number;
    text: string;
    state?: string;
    checked?: boolean;
    attributes?: {
        [key: string]: string;
    };
    children?: TreeData[];
}

interface ExtendedTreeProps {
    onFileClick: (fileName: string) => void;
    onDirectoryChange: (directoryName: string) => void;
}

const initialData: TreeData[] = [
    {
        id: 1,
        text: "내 문서",
        children: [
            {
                id: 11,
                text: "사진",
                state: "closed",
                children: [
                    { id: 111, text: "친구" },
                    { id: 112, text: "아내" },
                    { id: 113, text: "회사" }
                ]
            },
            {
                id: 12,
                text: "프로그램 파일",
                children: [
                    { id: 121, text: "인텔" },
                    {
                        id: 122,
                        text: "자바",
                        attributes: {
                            p1: "커스텀 속성1",
                            p2: "커스텀 속성2"
                        }
                    },
                    { id: 123, text: "마이크로소프트 오피스" },
                    { id: 124, text: "게임", checked: true }
                ]
            },
            { id: 13, text: "index.html" },
            { id: 14, text: "about.html" },
            { id: 15, text: "welcome.html" }
        ]
    }
];

const Easy_ui_tree: React.FC<ExtendedTreeProps> = ({ onFileClick, onDirectoryChange }) => {
    const [treeData, setTreeData] = useState<TreeData[]>(initialData);
    const treeRef = useRef<HTMLUListElement>(null);

    useEffect(() => {
        if (treeRef.current) {
            (window as any).easyloader = {
                base: '/node_modules/rc-easyui/dist/'
            };
        }
    }, []);

    const handleSelect = (node: TreeData) => {
        if (node.children) {
            onDirectoryChange(node.text);
        } else {
            onFileClick(node.text);
        }
    };

    const handleDrop = (source: TreeData, target: TreeData, point: string) => {
        const moveNode = (data: TreeData[], sourceId: number, targetId: number, position: string): TreeData[] => {
            const findNode = (nodes: TreeData[], id: number): TreeData | null => {
                for (let node of nodes) {
                    if (node.id === id) return node;
                    if (node.children) {
                        const found = findNode(node.children, id);
                        if (found) return found;
                    }
                }
                return null;
            };

            const removeNode = (nodes: TreeData[], id: number): TreeData[] => {
                return nodes.reduce((acc, node) => {
                    if (node.id === id) return acc;
                    if (node.children) {
                        node.children = removeNode(node.children, id);
                    }
                    acc.push(node);
                    return acc;
                }, [] as TreeData[]);
            };

            const insertNode = (nodes: TreeData[], targetId: number, nodeToInsert: TreeData, position: string): TreeData[] => {
                return nodes.map(node => {
                    if (node.id === targetId) {
                        if (position === 'append') {
                            return {
                                ...node,
                                children: node.children ? [...node.children, nodeToInsert] : [nodeToInsert]
                            };
                        } else if (position === 'top') {
                            return {
                                ...node,
                                children: node.children ? [nodeToInsert, ...node.children] : [nodeToInsert]
                            };
                        } else if (position === 'bottom') {
                            return {
                                ...node,
                                children: node.children ? [...node.children, nodeToInsert] : [nodeToInsert]
                            };
                        }
                    }
                    if (node.children) {
                        return {
                            ...node,
                            children: insertNode(node.children, targetId, nodeToInsert, position)
                        };
                    }
                    return node;
                });
            };

            let newTreeData = removeNode([...data], sourceId);
            const sourceNode = findNode(data, sourceId);
            if (sourceNode) {
                newTreeData = insertNode(newTreeData, targetId, sourceNode, position);
            }
            return newTreeData;
        };

        const newData = moveNode(treeData, source.id, target.id, point);
        setTreeData(newData);
    };

    const nodeFormatter = (node: TreeData) => {
        return (
            <>
                <span>{node.text}</span>
                <span className="node-toolbar">
                    <button onClick={() => append(node.id)}>추가</button>
                    <button onClick={() => remove(node.id)}>제거</button>
                    <button onClick={() => edit(node.id)}>편집</button>
                </span>
            </>
        );
    };

    const append = (nodeId: number) => {
        const newTreeData = treeData.map(node => {
            if (node.id === nodeId && node.children) {
                return {
                    ...node,
                    children: [...node.children, { id: Date.now(), text: 'New Node' }]
                };
            }
            return node;
        });
        setTreeData(newTreeData);
    };

    const remove = (nodeId: number) => {
        const newTreeData = treeData.filter(node => node.id !== nodeId);
        setTreeData(newTreeData);
    };

    const edit = (nodeId: number) => {
        alert(`Edit node ${nodeId}`);
    };

    return (
        <>
            <style>
                {`
                    .node-toolbar {
                        display: none;
                        position: absolute;
                        right: 10px;
                        top: 5px;
                    }
                    .tree-node:hover .node-toolbar {
                        display: inline-block;
                    }
                `}
            </style>
            <div style={{ padding: 20 }}>
                <Tree
                    data={treeData}
                    animate={true}
                    dnd={true}
                    formatter={nodeFormatter}
                    onSelect={handleSelect}
                    onDrop={handleDrop}
                />
            </div>
        </>
    );
};

export default Easy_ui_tree;
