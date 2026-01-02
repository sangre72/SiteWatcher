// TreeNode.ts
export interface TreeNode {
    id: number;
    name: string;
    isFolded: boolean;
    type: string,
    path: string;
    children?: TreeNode[];
}


export interface TreeProps {
    nodes: TreeNode[];
}

