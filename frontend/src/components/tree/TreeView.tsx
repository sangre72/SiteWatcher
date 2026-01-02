import React, {useEffect, useState} from 'react';
import { TreeNode, TreeProps } from './TreeNode';
interface ExtendedTreeProps extends TreeProps {
    onFileClick: (fileName: string) => void; // 파일 클릭 함수 타입 추가
    onDirectoryChange: (directoryName: string) => void;
}

const TreeView: React.FC<ExtendedTreeProps> = ({ nodes, onFileClick, onDirectoryChange }) => {
    const [treeData, setTreeData] = useState<TreeNode[]>(nodes);

    useEffect(() => {
        setTreeData(nodes);  // nodes prop이 변경될 때마다 treeData 상태를 업데이트
    }, [nodes]);  // nodes를 의존성 배열에 추가

    const toggleFold = (id: number) => {
        const toggle = (nodes: TreeNode[]): TreeNode[] =>
            nodes.map(node => {
                if (node.id === id) {
                    return { ...node, isFolded: !node.isFolded };
                } else if (node.children) {
                    return { ...node, children: toggle(node.children) };
                }
                return node;
            });

        setTreeData(toggle(treeData));
    };

    const renderTree = (nodes: TreeNode[]) => (
        <ul className="list-group">
            {nodes.map((node) => (
                <li
                    key={node.id}
                    className={`list-group-item ${node.type === 'directory' ? 'list-group-item-info' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation(); // 중첩된 클릭 이벤트 버블링 방지
                        if (node.type === 'directory') {
                            toggleFold(node.id); // 디렉토리 경우, 접기/펼치기
                            onDirectoryChange(node.path);
                        } else if (node.type === 'file') {
                            onFileClick(node.path); // 파일 경우, 파일 클릭 이벤트 실행
                        }
                    }}
                    style={{cursor: 'pointer'}}
                >
                    {node.children && node.children.length > 0 ? (
                        <span>
                        {node.isFolded ? '[+]' : '[-]'} {node.name}
                    </span>
                    ) : (
                        <span>{node.name}</span>
                    )}
                    {!node.isFolded && node.children && renderTree(node.children)}
                </li>
            ))}
        </ul>
    );

    return <div>{renderTree(treeData)}</div>;
};

export default TreeView;
