 /////////////////////////////////// tree 구조 만들기 ///////////////////////////////////
const path = require('path');
const fs = require('fs/promises');
const directoryPath = path.join(__dirname, './'); // 시작 디렉토리 경로


module.exports = { getFileTree };

 async function getFileTree(req, res) {
     try {
         let nextIdRef = { nextId: 1 };

         // 요청에서 path 파라미터를 받고, 유효한 경로로 조합
         const targetPath = req.query.path ? path.resolve(directoryPath, req.query.path) : directoryPath;

         // 경로가 실제 서버의 파일 시스템 내에 존재하는지 확인
         if (!targetPath.startsWith(directoryPath)) {
             return res.status(400).json({ error: 'Invalid path' });
         }

         let tree = await buildTree(targetPath);

         // 생성된 트리에 대한 메타데이터 설정
         tree = { name: path.basename(targetPath) || '/', isFolded: false, type: "directory", path: targetPath, children: tree };

         // 트리에 ID 할당
         assignIds(tree, nextIdRef);

         console.log(tree);
         res.json(tree);
     } catch (err) {
         console.error('Error reading directory:', err);
         res.status(500).json({ error: 'Server error' });
     }
 };

/*async function getFileTree(req, res) {
    try {
        let nextIdRef = { nextId: 1 };
        const targetPath = req.query.path ? path.join(directoryPath, req.query.path) : directoryPath;
        let tree = await buildTree(targetPath);

        tree = { name: path.basename(targetPath) || '/', isFolded: false, type: "directory", path: "", children: tree };
        assignIds(tree, nextIdRef);

        console.log(tree);
        res.json(tree);
    } catch (err) {
        console.error('Error reading directory:', err);
        res.status(500).json({ error: 'Server error' });
    }
};*/

// (assignIds 함수 구현 내용은 이전과 동일)
function assignIds(node, nextIdRef) {
    node.id = nextIdRef.nextId++; // 현재 노드에 ID 할당
    node.children.forEach(child => assignIds(child, nextIdRef)); // 자식 노드에 대해 재귀적으로 ID 할당
}

async function buildTree(dirPath, depth = 0) {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    let nodes = [];

    for (const entry of entries) {
        const entryPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            const childDirPath = path.join(dirPath, entry.name);
            const children = await buildTree(childDirPath, depth + 1);
            nodes.push({
                name: entry.name,
                isFolded: false,
                children: children,
                type: "directory",
                path: entryPath
            });
        } else if (entry.isFile()) {
            nodes.push({
                name: entry.name,
                isFolded: true,
                children: [],
                type: "file",
                path: entryPath
            });
        }
    }

    return nodes;
}
