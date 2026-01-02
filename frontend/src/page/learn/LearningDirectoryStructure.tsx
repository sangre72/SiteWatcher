import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {determineMode} from "../../components/utils/FileEditor";
import {fileTextState, TextAreaProps} from '../../layout/menu/utility/GPT'
//전역 변수 사용
import {useRecoilState} from "recoil";
import {host_info} from "../../HostInfo";

// Entry 타입 정의
type Entry = {
    id: number;
    name: string;
    isFolded: boolean;
    type: string;
    path: string;
    description?: string;
    isActive: boolean;  // 활성 상태를 나타내는 속성 추가
    children?: Entry[];
};

const LearningDirectoryStructure: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    // entries 상태와 해당 상태를 업데이트하는 함수
    const [data, setData] = useState<Entry[]>([]);
    // 전역 변수 사용
    const [, setFiletext] = useRecoilState<TextAreaProps>(fileTextState)

    useEffect(() => {
        // 데이터 불러오기 등의 초기화 코드
    }, []);

    useEffect(() => {
        if (isLoading) {
        // 컴포넌트 마운트 시 서버에서 파일 목록을 가져옴
            const url = host_info + '/learn/directory/list';
            const options = {
                method: 'GET', // 또는 'POST' 등 원하는 HTTP 메소드
                headers: {
                    'X-XSS-Protection': '1; mode=block',
                    'Content-Type': 'application/json', // 요청 헤더에 추가할 특정 헤더
                    // 다른 요청 헤더를 추가할 수도 있습니다.
                },
            };
            fetch(url, options)
                .then(response => response.json()) // JSON 형식으로 응답 데이터를 파싱
                .then(data => {
                    setData([data]);  // 서버에서 받은 데이터로 상태를 직접 설정
                })
                .catch(error => console.error('Error fetching files:', error));
            }
        setIsLoading(false);
    }, [isLoading]);

    // 설명 변경 핸들러
    const handleDescriptionChange = (path: string, description: string) => {
        const updateDescriptions = (items: Entry[]): Entry[] => {
            return items.map(item => {
                if (item.path === path) {
                    if(description.length >     0) {
                        return {...item, description, isActive: true};
                    } else {
                        item.description = '';
                        return {...item, isActive: false};
                    }
                } else if (item.children) {
                    return { ...item, children: updateChildrenDescription(item.children, path, description) };
                }
                return item;
            });
        };
        setData(updateDescriptions(data));
    };

    const handleFileOpen = (fileName: string) => {
        const url = `${host_info}/file/open?p=${encodeURIComponent(fileName)}`;

        const options = {
            method: 'GET', // 또는 'POST' 등 원하는 HTTP 메소드
            headers: {
                'X-XSS-Protection': '1; mode=block',
                'Content-Type': 'application/json', // 요청 헤더에 추가할 특정 헤더
                // 다른 요청 헤더를 추가할 수도 있습니다.
            },
        };

        fetch(url, options)
            .then(response => response.json())
            .then(data => {
                setFiletext({fileText: "{"+fileName+"}\n " +data})
                const m = determineMode(fileName);
            })
            .catch(error => {
                console.error('Error opening file:', error);
                setFiletext({fileText: "Failed to load file content."})
            });
    };

    function fileOpenWithPath(path: string) {
        handleFileOpen(path);
    }

    // 파일 및 디렉토리 렌더링을 위한 재귀 컴포넌트
    const renderItems = (items: Entry[]) => {
        return items.map((item, index) => (
            <ul key={item.id}>
                    <li key={index}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <span style={{ fontSize: '13px' }} onClick={() => fileOpenWithPath(item.path.replace("//","/"))}>{item.path.replace("//","/")})</span>
                            {/* 슬라이드 토글 추가 */}
                            <span style={{display: 'flex', width: '400px', textAlign: 'right'}}>
                            <div className="form-check form-switch" style={{verticalAlign:'middle', textAlign: 'right'}}>
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="active-toggle"
                                    checked={item.isActive}
                                    onChange={(e) => {
                                    }} // 이벤트 핸들러는 아이템 상태 변경을 처리합니다
                                />
                            </div>
                                <input
                                    type="text"
                                    className="form-control"
                                    style={{width: '80%'}}  // 입력 필드가 span의 전체 너비를 차지하도록 설정
                                    value={item.description || ''}
                                    onChange={(e) => handleDescriptionChange(item.path, e.target.value)}
                                />
                            </span>
                        </div>
                        {item.children && renderItems(item.children)}
                    </li>
            </ul>
        )
    );
    };
    const updateChildrenDescription = (children: Entry[], path: string, description: string): Entry[] => {
        return children.map(child => {
            if (child.path === path) {
                if(description.length>0)
                    return { ...child, description, isActive: true };
                else
                    return { ...child, description, isActive: false };
            } else if (child.children) {
                return { ...child, children: updateChildrenDescription(child.children, path, description) };
            }
            return child;
        });
    };

    const collectEntries = (entries: Entry[]): any[] => {
        return entries.flatMap(entry => {
            if (entry.description) {
                const item = {
                    prompt: `Describe the file at path: ${entry.path}`,
                    completion: entry.description
                };
                return entry.children ? [item, ...collectEntries(entry.children)] : [item];
            } else {
                return entry.children ? collectEntries(entry.children) : [];
            }
        });
    };

    const handleSubmit = () => {
        const entriesForTraining = collectEntries(data);
        const jsonlData = entriesForTraining.map(entry => JSON.stringify(entry)).join("\n");
        axios.post(host_info + '/node-db-insert-jsonl', {
            q: jsonlData  // 'q' 파라미터로 데이터를 포장
        })
            .then(response => {
            })
            .catch(error => {
                console.error('Error sending data to the server:', error);
            });
    };


    // 컴포넌트 렌더링
    return (
        <div id="directory-structure">
            {isLoading ? <p>Loading...</p> : renderItems(data)}
        </div>
    );
};

export default LearningDirectoryStructure;
