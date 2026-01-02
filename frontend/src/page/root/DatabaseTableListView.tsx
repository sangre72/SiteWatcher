import React, { useState, useEffect } from 'react';
import { TreeNode, TreeProps } from '../../components/tree/TreeNode';
import {renderTree} from "../../components/tree/renderTree";
import {queries} from "@testing-library/react";
import {Button} from "react-bootstrap";
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';
import {host_info} from "../../HostInfo";

// Entry 타입 정의
type Entry = {
    id: number;
    name: string;
    isFolded: boolean;
    type: string;
    path: string;
    description?: string;
    isKey: boolean;  // 조회를 위해서 받아야할 파라메터
    isMandatory: boolean;  // 문서 상에 표기할 필수 입력항목
    isUseYn: boolean;  // 리턴되는 컬럼값
    isOrder: boolean; // 정령 할 것인지
    sort: boolean; // off desc / on asc
    children?: Entry[];

    [key: string]: any;
};

const DatabaseTableListView: React.FC<{ nodes?: Entry[] }> = ({ nodes = [] }) => {
    const [treeData, setTreeData] = useState<Entry[]>([]);
    const [columnsData, setColumnsData] = useState<Entry[]>([]); // 선택된 테이블의 컬럼 정보를 저장할 상태
    const [checkboxStates, setCheckboxStates] = useState(
        columnsData.map(column => ({
            isUserYn: false,
            isKey: false, // 초기 상태를 isUserYn에 맞추거나 별도 로직에 따라 설정
            isMandatory: false
        }))
    );
    const [schema, setSchema] = useState<string>('');
    const [tableName, setTableName] = useState<string>('');

    const [useYn, setUseYn] = useState<string[]>([]);
    const [mandatory, setMandatory] = useState<string[]>([]);
    const [order, setOrder] = useState<string[]>([]);
    const [key, setKey] = useState<string[]>([]);
    const [sort, setSort] = useState<string[]>([]);

    const [chartType, setChartType] = useState('Line');

    const handleChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
        setChartType(event.target.value);
    };


    // 체크박스 상태 변경 핸들러
    const handleCheckboxChange = (column: Entry, type: string) => {
        const updatedColumns = columnsData.map(col => {
            if (col.id === column.id) {
                const updatedCol = { ...col };
                if (type === 'isUseYn') {
                    updatedCol.isUseYn = !col.isUseYn;
                    return updatedCol;
                }
                if (type === 'isKey') {
                    updatedCol.isKey = !col.isKey;
                    return updatedCol;
                }
                if (type === 'isMandatory') {
                    updatedCol.isMandatory = !col.isMandatory;
                    return updatedCol;
                }
                if (type === 'isOrder') {
                    updatedCol.isOrder = !col.isOrder;
                    return updatedCol;
                }
                if (type === 'sort') {
                    updatedCol.sort = !col.sort;
                    return updatedCol;
                }
            }
            return col;
        });

        setColumnsData(updatedColumns);
        const changedColumns = updatedColumns.filter(col => col.isUseYn);

        // Filter and create JSON for changed data
        const createJsonDataForType = (type: string) => {
            return updatedColumns.filter(col => col[type]).map(col => col.name.toLowerCase());
        };

        // Example of gathering JSON data for each type
        const useYnJson = createJsonDataForType('isUseYn');
        const mandatoryJson = createJsonDataForType('isMandatory');
        const keyJson = createJsonDataForType('isKey');
        const orderJson = createJsonDataForType('isOrder');
        const sortJson = createJsonDataForType('sort');

        setUseYn(useYnJson);
        setMandatory(mandatoryJson);
        setKey(useYnJson);
        setOrder(orderJson);
        setSort(sortJson);

        const query = {
            use_yn : useYnJson,
            mandatory : mandatoryJson,
            key : keyJson,
            order : orderJson,
            sort: sortJson,
            limit: 10
        }
        console.log("query:", query);

/*
        const query = {
            schema: schema,
            table: tableName,
            use_yn: useYnJson,
            mandatory: mandatoryJson,
            key: keyJson,
            order: orderJson,
            sort: sortJson,
            limit: 10
        };
        setGeneratedJson(JSON.stringify(query, null, 2));
*/


        const changedSort = updatedColumns.filter(col => col.isOrder);
        if (useYnJson.length > 0) {
            console.log("Fetching data for changed columns", updatedColumns);
            fetchData(changedColumns);
        }
        fetchApiQuery(JSON.stringify(query));
    };

    const [userDataTitle, setUserDataTitle] = useState({});
    const [userData, setUserData] = useState({});

    const fetchData = async (changedColumns: Entry[]) => {
        try {
            const url = host_info + '/node-db-info-tables-data`;';
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'X-XSS-Protection': '1; mode=block',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ columns: changedColumns,limit:100 })
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data: Entry[] = await response.json();
            const d = data[0];
            if(d!=null){
                setUserDataTitle(d);
                setUserData(data);
            }else{
                alert('데이터가 존재하지 않습니다.')
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const fetchApiQuery = async (query: string) => {
        try {
            const url = host_info + '/node-db-api-jsonl';
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'X-XSS-Protection': '1; mode=block',
                    'Content-Type': 'application/json'
                },
                body: query
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data: Entry[] = await response.json();
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const fetchApiSave = async () => {
        if(useYn.length === 0 || useYn === undefined){
            alert('API 생성을 위해서는 리턴해야할 컬럼과 조회 파라메터를 입력 받을 컬럼을 선택하셔야 합니다.');
            return;
        }
        try {
            const url = host_info + '/node-db-api-jsonl-save';
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'X-XSS-Protection': '1; mode=block',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                        use_yn: useYn,
                        mandatory: mandatory,
                        key: key,
                        order: order,
                        sort: sort
                    })
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const r = await response.json();
            alert(`${r.message}\n${r.filePath}`);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };


    // 노드의 접기/펼치기 상태를 토글하는 함수
    const toggleFold = (id: number) => {
        const toggle = (nodes: Entry[]): Entry[] =>
            nodes.map(node => {
                if (node.id === id) {
                    // 선택된 노드의 isFolded 상태를 반전
                    return {...node, isFolded: !node.isFolded};
                } else if (node.children) {
                    // 하위 노드가 있는 경우 재귀적으로 처리
                    return {...node, children: toggle(node.children)};
                }
                return node;
            });

        setTreeData(toggle(treeData));
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const tableSchema = 'egov';
                const url = host_info + `/node-db-info-tables?tableSchema=${tableSchema}`;
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data: Entry[] = await response.json();

                const modifiedData = data.map(item => ({
                    ...item,
                    isKey: false,
                    isMandatory: false,
                    isUseYn: true
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
        try {
            const response = await fetch(host_info + `/node-db-info-table-columns?tableName=${tableName}&tableSchema=${tableSchema}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();

            const d = data[0];
            const parts = d.name.split('|');
            setSchema(parts[0]);
            setTableName(parts[2]);
            setColumnsData(data); // 받아온 데이터로 컬럼 정보 상태 업데이트
        } catch (error) {
            console.error('Error fetching table columns:', error);
        }
    };

    // 트리 아이템 클릭 핸들러
    const handleItemClick = (tableName: string, tableSchema: String) => {
        fetchTableColumns(tableName, tableSchema); // 클릭된 테이블의 컬럼 정보 조회
    };

    const labelStyle = {
        display: 'inline-block',
        marginRight: '20px'
    };

    return (
        <div className="d-flex" style={{height: '100vh', marginTop: '16px'}}>
            {/* 왼쪽 섹션: 트리 구조 렌더링 */}
            <div style={{overflow: 'auto', width: '280px'}}>
                <div style={{overflow: 'auto', width: '100%'}}>
                    <strong>Table List</strong>
                </div>
                {renderTree(treeData, toggleFold, handleItemClick)}
            </div>
            {/* 중간 섹션: 선택된 테이블의 컬럼 정보 표시 */}
            <div className="" style={{overflow: 'auto', width: '100%', paddingLeft: '20px'}}>
                <div className="row" style={{height: '50vh', marginTop: '0px'}}> {/* 높이를 뷰포트의 50%로 설정 */}
                    <div style={{overflow: 'auto', width: '100%', marginTop: '0px'}}>
                        <strong>Column List</strong>
                    </div>
                    <div><Button variant="primary" onClick={() => fetchApiSave()} style={{fontStyle: 'italic', overflow: 'auto', width: '50%'}}>API저장</Button>
                        <Button variant="secondary" style={{fontStyle: 'italic', overflow: 'auto', width: '50%'}}>데이터생성</Button>
                    </div>
                    <div className="container list-group "
                         style={{overflowY: 'auto', width: '100%', height: '78%', paddingLeft: '20px'}}>
                        <table className="table table-striped" style={{overflowY: 'auto', width: '100%'}}>
                            <thead>
                            <tr>
                                <td style={{overflowY: 'auto', width: '65%'}}>
                                    <div className="row list-group-item d-flex" style={{overflowY: 'auto', width: '100%'}}>
                                        <div className="col-auto" style={{maxWidth: '150px'}}>
                                            <strong>Use</strong> {/* 제목 행 첫 번째 열 */}
                                        </div>
                                        <div className="col-auto" style={{maxWidth: '150px'}}>
                                            <strong>Key</strong> {/* 제목 행 두 번째 열 */}
                                        </div>
                                        <div className="col-auto" style={{maxWidth: '150px'}}>
                                            <strong>Man</strong> {/* 제목 행 세 번째 열 */}
                                        </div>
                                        <div className="col-auto" style={{maxWidth: '150px'}}>
                                            <strong>Order</strong> {/* 제목 행 세 번째 열 */}
                                        </div>
                                        <div className="col-auto" style={{maxWidth: '150px'}}>
                                            <strong>Sort</strong> {/* 제목 행 세 번째 열 */}
                                        </div>
                                        <div className="col rounded" style={{maxWidth: '250px'}}>
                                            <strong>Name</strong> {/* 제목 행 네 번째 열 */}
                                        </div>
                                        <div className="col rounded" style={{maxWidth: '250px'}}>
                                            <strong>Type</strong> {/* 제목 행 다섯 번째 열 */}
                                        </div>
                                        <div className="col rounded" style={{maxWidth: '250px'}}>
                                            <strong>Comment</strong> {/* 제목 행 여섯 번째 열 */}
                                        </div>
                                    </div>
                                    {columnsData.map((columnStr, index) => {
                                        const parts = columnStr.name.split('|'); // 문자열 데이터를 '|'로 split하여 각 부분을 추출
                                        return (
                                            <div className="row list-group-item d-flex" key={index}>
                                                <div className="col-auto" style={{maxWidth: '150px'}}>
                                                    <div className="form-check form-switch" style={{textAlign: 'right'}}>
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            id={`useyn-toggle-${index}`}
                                                            checked={columnStr.isUseYn}
                                                            onChange={() => handleCheckboxChange(columnStr, 'isUseYn')}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-auto" style={{maxWidth: '150px'}}>
                                                    <div className="form-check form-switch" style={{textAlign: 'right'}}>
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            id={`key-toggle-${index}`}
                                                            checked={columnStr.isKey}
                                                            onChange={() => handleCheckboxChange(columnStr, 'isKey')}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-auto" style={{maxWidth: '150px'}}>
                                                    <div className="form-check form-switch" style={{textAlign: 'right'}}>
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            id={`mandatory-toggle-${index}`}
                                                            checked={columnStr.isMandatory}
                                                            onChange={() => handleCheckboxChange(columnStr, 'isMandatory')}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-auto" style={{maxWidth: '150px'}}>
                                                    <div className="form-check form-switch" style={{textAlign: 'right'}}>
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            id={`order-toggle-${columnStr.isOrder}`}
                                                            checked={columnStr.isOrder}
                                                            onChange={() => handleCheckboxChange(columnStr, 'isOrder')}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-auto" style={{maxWidth: '150px'}}>
                                                    <div className="form-check form-switch" style={{textAlign: 'right'}}>
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            id={`sort-toggle-${index}`}
                                                            checked={columnStr.sort}
                                                            onChange={() => handleCheckboxChange(columnStr, 'sort')}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col rounded"
                                                     style={{maxWidth: '250px'}}>{parts[1].toLowerCase()}</div>
                                                <div className="col rounded"
                                                     style={{maxWidth: '250px'}}>{parts[3].toLowerCase()}</div>
                                                <div className="col rounded"
                                                     style={{maxWidth: '250px'}}>{parts[2].toLowerCase()}</div>
                                            </div>
                                        );
                                    })}
                                </td>
                                <td style={{width:'35%'}}>
                                    <table className="table table-striped" style={{border:'2px', width: '100%', height: '100%'}}>
                                        <thead>
                                            <tr>
                                                <th>
                                                    <td style={{border:'2px', width:'100px', textAlign: 'center', verticalAlign: 'top'}}>
                                                        <label style={labelStyle}>
                                                            <input
                                                                type="radio"
                                                                name="chartType"
                                                                value="Line"
                                                                checked={chartType === 'Line'}
                                                                onChange={handleChange}
                                                            />
                                                            Line
                                                        </label>
                                                    </td>
                                                    <td>
                                                        <label style={labelStyle}>
                                                            <input
                                                                type="radio"
                                                                name="chartType"
                                                                value="Bar"
                                                                checked={chartType === 'Bar'}
                                                                onChange={handleChange}
                                                            />
                                                            Bar
                                                        </label>
                                                    </td>
                                                    <td>
                                                        <label style={labelStyle}>
                                                            <input
                                                                type="radio"
                                                                name="chartType"
                                                                value="Pie"
                                                                checked={chartType === 'Pie'}
                                                                onChange={handleChange}
                                                            />
                                                            Pie
                                                        </label>
                                                    </td>
                                                    <td>
                                                        <label style={labelStyle}>
                                                            <input
                                                                type="radio"
                                                                name="chartType"
                                                                value="Scatter"
                                                                checked={chartType === 'Scatter'}
                                                                onChange={handleChange}
                                                            />
                                                            Scatter
                                                        </label>
                                                    </td>
                                                    <td>

                                                    </td>
                                                </th>
                                            </tr>
                                        </thead>
                                    </table>
                                </td>
                            </tr>
                            </thead>
                        </table>


                    </div>

                </div>
                <div style={{fontStyle: 'italic', overflow: 'auto', width: '100%'}}>
                    <strong>Sample 데이터</strong>
                </div>
                <div className="row" style={{width: "100%", fontSize: '10px', position: 'sticky', top: '0', left: '0'}}>
                    <table id="limitData" style={{border: '1px solid', borderColor: '#fff', width: '100%'}}>
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
                        {Object.entries(userData).map(([key, value], index) => (
                            <tr key={index}
                                style={{height: '23px', border: '1px solid', borderColor: '#e0e0e0', width: '100%'}}>
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
                    </table>
                </div>

            </div>
        </div>
    );
};

export default DatabaseTableListView;
