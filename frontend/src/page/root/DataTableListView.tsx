import React, { useState, useEffect } from 'react';
import { TreeNode, TreeProps } from '../../components/tree/TreeNode';
import { renderTree } from "../../components/tree/renderTree";
import { Button } from "react-bootstrap";
import sampleData from "../../components/tree/sampleData";
import {useRecoilState, useRecoilValue, useSetRecoilState} from "recoil";
import {gptDataState, gptDataTitleState} from "../../atom";
import {host_info} from "../../HostInfo";

// Entry 타입 정의
type Entry = {
    id: number;
    name: string;
    isFolded: boolean;
    type: string;
    path: string;
    description?: string;
    children?: Entry[];

    [key: string]: any;
};

const DataTableListView: React.FC<{ nodes?: Entry[] }> = ({ nodes = [] }) => {
    const setGptData = useSetRecoilState(gptDataState);

    const [treeData, setTreeData] = useState<Entry[]>([]);
    const [columnsData, setColumnsData] = useState<Entry[]>([]); // 선택된 테이블의 컬럼 정보를 저장할 상태
    const [schema, setSchema] = useState<string>('');
    const [tableName, setTableName] = useState<string>('');
    const [chartType, setChartType] = useState('Line');
    const handleChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
        setChartType(event.target.value);
    };

    const [userDataTitle, setUserDataTitle] = useState({});
    const [userData, setUserData] = useState({});

    const fetchTableData = async (changedColumns: Entry[]) => {
        try {
            const url = `${host_info}/node-db-info-tables-data`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'X-XSS-Protection': '1; mode=block',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ columns: changedColumns,limit:5 })
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data: Entry[] = await response.json();
            const d = data[0];
            if(d!=null){
                setUserDataTitle(d);
                setUserData(data);
                const tableData = {TableData : {ColumnsName : userDataTitle,ColumnData: data }}
                const j = JSON.stringify(tableData);
                setGptData(j);
            }else{
                alert('데이터가 존재하지 않습니다.')
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const toggleFold = (id: number) => {
        const toggle = (nodes: Entry[]): Entry[] =>
            nodes.map(node => {
                if (node.id === id) {
                    // 선택된 노드의 isFolded 상태를 반전
                    return { ...node, isFolded: !node.isFolded };
                } else if (node.children) {
                    // 하위 노드가 있는 경우 재귀적으로 처리
                    return { ...node, children: toggle(node.children) };
                }
                return node;
            });

        setTreeData(toggle(treeData));
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const tableSchema = 'egov';
                const url = `${host_info}/node-db-info-tables?tableSchema=${tableSchema}`;
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data: Entry[] = await response.json();

                const modifiedData = data.map(item => ({
                    ...item,
                    isFolded: true
                }));
                setTreeData(modifiedData);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []); // 빈 의존성 배열을 전달하여 컴포넌트 마운트 시에만 fetchData 함수를 호출합니다.

    // 테이블의 컬럼 정보를 조회하는 함수
    const fetchTableColumns = async (tableName: string, tableSchema: String) => {
        console.log("Fetching data for changed columns", tableName, tableSchema);
        try {
            const response = await fetch(`${host_info}/node-db-info-table-columns?tableName=${tableName}&tableSchema=${tableSchema}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }else{
                const data = await response.json();

                const d = data[0];
                const parts = d.name.split('|');
                setSchema(parts[0]);
                setTableName(parts[2]);
                setColumnsData(data); // 받아온 데이터로 컬럼 정보 상태 업데이트
                fetchTableData(data);

            }
            // Fetch sample data after columns are set
        } catch (error) {
            console.error('Error fetching table columns:', error);
        }
    };

    // 트리 아이템 클릭 핸들러
    const handleItemClick = (tableName: string, tableSchema: String) => {
        console.log("handleItemClick");
        fetchTableColumns(tableName, tableSchema); // 클릭된 테이블의 컬럼 정보 조회
    };

    return (
        <div className="d-flex" style={{ height: '100vh', marginTop: '16px' }}>
            {/* 왼쪽 섹션: 트리 구조 렌더링 */}
            <div style={{ overflow: 'auto', width: '280px' }}>
                <div style={{ overflow: 'auto', width: '100%' }}>
                    <strong>Table List</strong>
                </div>
                {renderTree(treeData, toggleFold, handleItemClick)}
            </div>
            {/* 중간 섹션: 선택된 테이블의 컬럼 정보 표시 */}
            <div className="" style={{ overflow: 'auto', width: '100%', paddingLeft: '20px' }}>
                <div className="row" style={{ height: '50vh', marginTop: '0px' }}> {/* 높이를 뷰포트의 50%로 설정 */}
                    <div style={{ overflow: 'auto', width: '100%', marginTop: '0px' }}>
                        <strong>Column List</strong>
                    </div>
                    <div className="container list-group "
                         style={{ overflowY: 'auto', width: '100%', height: '78%', paddingLeft: '20px' }}>
                        <table className="table table-striped" style={{ overflowY: 'auto', width: '100%' }}>
                            <thead>
                            <tr>
                                <td style={{ overflowY: 'auto', width: '100%' }}>
                                    <div className="row list-group-item d-flex" style={{ overflowY: 'auto', width: '100%' }}>
                                        <div className="col rounded" style={{ maxWidth: '250px' }}>
                                            <strong>Name</strong> {/* 제목 행 첫 번째 열 */}
                                        </div>
                                        <div className="col rounded" style={{ maxWidth: '250px' }}>
                                            <strong>Type</strong> {/* 제목 행 두 번째 열 */}
                                        </div>
                                        <div className="col rounded" style={{ maxWidth: '250px' }}>
                                            <strong>Comment</strong> {/* 제목 행 세 번째 열 */}
                                        </div>
                                    </div>
                                    {columnsData.map((columnStr, index) => {
                                        const parts = columnStr.name.split('|'); // 문자열 데이터를 '|'로 split하여 각 부분을 추출
                                        return (
                                            <div className="row list-group-item d-flex" key={index}>
                                                <div className="col rounded" style={{ maxWidth: '250px' }}>{parts[1].toLowerCase()}</div>
                                                <div className="col rounded" style={{ maxWidth: '250px' }}>{parts[3].toLowerCase()}</div>
                                                <div className="col rounded" style={{ maxWidth: '250px' }}>{parts[2].toLowerCase()}</div>
                                            </div>
                                        );
                                    })}
                                </td>
                            </tr>
                            </thead>
                        </table>
                    </div>
                </div>
                <div style={{ fontStyle: 'italic', overflow: 'auto', width: '100%' }}>
                    <strong>Sample 데이터</strong>
                </div>
                <div className="row" style={{ width: "100%", fontSize: '10px', position: 'sticky', top: '0', left: '0' }}>
                    <table id="limitData" style={{ border: '1px solid', borderColor: '#fff', width: '100%' }}>
                        <thead>
                        <tr style={{
                            height: '25px',
                            border: '1px solid',
                            width: '100%',
                            backgroundColor: '#008cba',
                            color: 'white'
                        }}>
                            {Object.entries(userDataTitle).map(([key1, value1], index1) => (
                                <th id={key1} key={key1}
                                    style={{
                                        height: '39px',
                                        fontStyle: 'italic',
                                        textAlign: 'center',
                                        border: '1px solid',
                                        borderColor: '#eeeeee'
                                    }}>{String(key1).toUpperCase()}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {Object.entries(userData).map(([key, value], index) => (
                            <tr key={index}
                                style={{ height: '23px', border: '1px solid', borderColor: '#e0e0e0', width: '100%' }}>
                                {Object.entries(value).map(([key1, value1], index1) => (
                                    <td id={key1} key={key1}
                                        style={{
                                            height: '23px',
                                            fontSize: '10px',
                                            textAlign: 'center',
                                            border: '1px solid',
                                            borderColor: '#e0e0e0'
                                        }}>{String(value1)}</td>
                                ))}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DataTableListView;
