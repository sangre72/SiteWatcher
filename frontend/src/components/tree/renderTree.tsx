import React from 'react';
import { TreeNode } from './TreeNode'; // TreeNode 타입이 정의된 경로로 수정하세요.

export const renderTree = (
    nodes: TreeNode[],
    toggleFold: (id: number) => void,
    onItemClick: (tableName: string, tableSchema: string,) => void
) => {
    const handleItemClick = (node: TreeNode, event: React.MouseEvent) => {
        // 자식 노드가 있으면 toggleFold를 호출하여 접기/펼치기 상태를 변경
        if (node.children && node.children.length > 0) {
            event.stopPropagation(); // 이벤트 버블링을 막아 중첩된 리스트에서 부모 노드의 이벤트가 함께 발생하는 것을 방지
            toggleFold(node.id);
        } else {
            // 자식 노드가 없으면 onItemClick를 호출하여 추가 동작 수행
            onItemClick(node.name, node.type);
        }
    };

    const renderNode = (node: TreeNode) => (
        <li key={node.id}
            className={`list-group-item ${node.type === 'directory' ? 'list-group-item-info' : ''}`}
            onClick={(event) => handleItemClick(node, event)}
            style={{ cursor: 'pointer' }}>
            {node.isFolded ? '[+]' : '[-]'} {node.name.toLowerCase()}
            {!node.isFolded && node.children && (
                <ul className="list-group">
                    {renderTree(node.children, toggleFold, onItemClick)}
                </ul>
            )}
        </li>
    );

    return <ul className="list-group">{nodes.map(renderNode)}</ul>;
};
