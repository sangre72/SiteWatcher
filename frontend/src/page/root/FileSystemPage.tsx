import React, { useState, useEffect } from 'react';
import { TreeNode } from '../../components/tree/TreeNode';
import TreeView from '../../components/tree/TreeView';
import FileSidePanel from "../../layout/right/FileSidePanel";
import { determineMode } from '../../components/utils/FileEditor'
import {host_info} from "../../HostInfo";

const FileSystemPage: React.FC = () => {
    const [fileSystemData, setFileSystemData] = useState<TreeNode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [responseContent, setResponseContent] = useState<string>('');
    const [mode, setMode] = useState<string>('');
    const [filePath, setFilePath] = useState("");
    const [currentPath, setCurrentPath] = useState('/'); // 현재 경로 초기화
    const [prevPath, setPrevPath] = useState('');

    const handleClose = () => {
        setIsOpen(false);
    };

    useEffect(() => {
        if (isLoading) {
            fetch(host_info + '/directory-tree')
                .then(response => response.json())
                .then(data => {
                    setFileSystemData([data]);
                    setIsLoading(false);
                })
                .catch(error => {
                    console.error('Error fetching data:', error);
                    setIsLoading(false);
                });
        }
    }, [isLoading]);

    const handleFileOpen = (fileName: string) => {
        const url = `${host_info}/file/open?p=${encodeURIComponent(fileName)}`;
        fetch(url)
            .then(response => response.json())
            .then(data => {
                setResponseContent(data);
                const m = determineMode(fileName);
                setFilePath(fileName);
                setMode(m);
                setIsOpen(true);
            })
            .catch(error => {
                console.error('Error opening file:', error);
                setResponseContent("Failed to open file.");
                setIsOpen(true);
            });
    };

    useEffect(() => {
        // 여기에 fileSystemData가 변경될 때 실행하고 싶은 로직을 추가합니다.
        // 예를 들어, 트리를 다시 그리거나 추가적인 데이터 처리 등을 할 수 있습니다.
    }, [fileSystemData]); // 의존성 배열에 fileSystemData를

    useEffect(() => {
        fetchDirectory(prevPath);
    }, [prevPath]);
    const fetchDirectory = (path: string | number | boolean) => {
        setIsLoading(true);
        fetch(`${host_info}/directory-tree?path=${encodeURIComponent(path)}`)
            .then(response => response.json())
            .then(data => {
                setFileSystemData([data]);
                setIsLoading(false);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                setIsLoading(false);
            });
    };
    const goBack = () => {
        const upOneLevel = currentPath.replace(/\/[^\/]*$/, '');
        setPrevPath(upOneLevel);
    };
    const handleDirectoryChange = (directoryName: string) => {
        const url = `${host_info}/directory-tree?path=${encodeURIComponent(directoryName)}`;
        fetch(url)
            .then(response => response.json())
            .then(data => {
                setCurrentPath(directoryName);
                setFileSystemData([data]); // Spread 연산자를 사용하여 새로운 배열 생성
                setIsLoading(false);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                setIsLoading(false);
            });
    };

    const togglePanel = () => {
        setIsOpen(false);
    };

    return (
        <div>
            <>
                <button
                    className="btn btn-success"
                    style={{ clipPath : "polygon(20% 0, 100% 0%, 100% 100%, 0% 100%)"}}
                    onClick={goBack} >&nbsp;&nbsp;이전으로</button>
                <TreeView nodes={fileSystemData} onFileClick={handleFileOpen} onDirectoryChange={handleDirectoryChange}/>
            </>
            <FileSidePanel
                isOpen={isOpen}
                onClose={handleClose}
                onToggle={togglePanel}
                responseContent={responseContent}
                filePath={filePath}
            />
        </div>
    );
};

export default FileSystemPage;
