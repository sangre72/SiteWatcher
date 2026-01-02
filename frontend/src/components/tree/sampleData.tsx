import {TreeNode} from "./TreeNode";


const treeData: TreeNode[] = [
    {
        id: 1,
        name: '/', // 루트 디렉토리
        isFolded: false,
        type: "directory",
        path: "",
        children: [
            {id: 2, name: 'bin', isFolded: false, type: "directory", path: "", children: []}, // 실행 바이너리가 위치하는 디렉토리
            {
                id: 3, name: 'etc', isFolded: false, type: "directory", path: "", children: [ // 설정 파일 디렉토리
                    {id: 4, name: 'apache2', isFolded: false, type: "directory", path: "", children: [] }, // 예: Apache 설정 디렉토리
                    { id: 5, name: 'ssh', isFolded: false, type: "directory", path: "", children: [] }, // SSH 설정 디렉토리
                ]
            },
            {
                id: 6, name: 'home', isFolded: false, type: "directory", path: "", children: [ // 사용자 디렉토리
                    { id: 7, name: 'user1', isFolded: false, type: "directory", path: "", children: [] }, // 예: 사용자 디렉토리
                ]
            },
            {
                id: 8, name: 'var', isFolded: false, type: "directory", path: "", children: [ // 가변 데이터를 저장하는 디렉토리
                    { id: 9, name: 'log', isFolded: false, type: "directory", path: "", children: [] }, // 로그 파일 디렉토리
                    { id: 10, name: 'mail', isFolded: false, type: "directory", path: "", children: [] }, // 메일 저장 디렉토리
                ]
            },
            {
                id: 11, name: 'usr', isFolded: false, type: "directory", path: "", children: [ // 사용자 프로그램과 데이터
                    { id: 12, name: 'bin', isFolded: false, type: "directory", path: "", children: [] }, // 사용자 실행 바이너리 디렉토리
                    { id: 13, name: 'lib', isFolded: false, type: "directory", path: "", children: [] }, // 라이브러리 디렉토리
                    { id: 14, name: 'share', isFolded: false, type: "directory", path: "", children: [] }, // 아키텍처 독립적인 데이터 디렉토리
                ]
            },
        ]
    }];

export default treeData;