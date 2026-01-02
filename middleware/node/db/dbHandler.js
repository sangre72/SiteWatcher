const mysql = require('mysql');
const {query} = require("express");
const fs = require('fs').promises; // Promise 기반의 fs 모듈 사용
const path = require('path');

// MySQL 데이터베이스 연결 설정 (조건부 연결)
let connection = null;
let mysqlAvailable = false;

try {
    connection = mysql.createConnection({
        host: process.env.MYSQL_HOST || 'localhost',
        user: process.env.MYSQL_USER || 'dbuser',
        password: process.env.MYSQL_PASSWORD || 'dbuser',
        database: process.env.MYSQL_DATABASE || 'egov'
    });

    connection.connect(error => {
        if (error) {
            console.warn('[MySQL] Connection failed:', error.message);
            console.warn('[MySQL] Database features will be disabled');
            mysqlAvailable = false;
        } else {
            console.log('[MySQL] Successfully connected to the database.');
            mysqlAvailable = true;
        }
    });
} catch (err) {
    console.warn('[MySQL] Failed to create connection:', err.message);
    console.warn('[MySQL] Database features will be disabled');
}

// 테이블 목록 조회 핸들러
function insertJSONL(req, rep) {
    const jsonl = req.body.q;
    const query = `INSERT INTO EGOV.TB_JSONL (jsonl, create_dt) VALUES (?, NOW())`;
    connection.query(query, [jsonl], (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            return;
        }
    });
}

function getTables(req, res) {
    const tableSchema = req.query.tableSchema;
    const query = 'SELECT table_name, table_schema FROM information_schema.TABLES WHERE table_schema = ?';
    connection.query(query, [tableSchema], function (error, results, fields) {
        if (error) {
            return res.status(500).json({ error: 'Error fetching tables' });
        }

        const trees = results.map((row, index) => ({
            id: index + 1,
            name: Object.values(row)[0],
            isFolded: false,
            type: "TABLE",
            path: Object.values(row)[1],
            children: []
        }));

        res.json(trees);
    });
}

// 테이블 컬럼 정보 조회 핸들러
function getTableColumns(req, res) {
    const tableName = req.query.tableName;
    if (!tableName) {
        return res.status(400).json({ error: 'Table name is required' });
    }

    const query = `
        SELECT TABLE_SCHEMA, COLUMN_NAME, TABLE_NAME, DATA_TYPE, IFNULL(COLUMN_COMMENT, COLUMN_NAME) AS COLUMN_COMMENT
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
        ORDER BY COLUMN_NAME
    `;

    connection.query(query, [connection.config.database, tableName], (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Error fetching column info' });
        }

        const treeNodes = results.map((column, index) => ({
            id: index + 1,
            name: `${column.TABLE_SCHEMA}|${column.COLUMN_NAME}|${column.TABLE_NAME}|(${column.DATA_TYPE})`,
            isFolded: true,
            type: 'column',
            children: []
        }));

        res.json(treeNodes);
    });
}


// 테이블 컬럼 정보 조회 핸들러
function getTableData(req, res) {
    const entries = req.body.columns; // 클라이언트로부터 받은 JSON 배열
    console.log("entries", entries.entries);
    let table = '';
    let schema = '';
    let columns =''
    const limit = req.body.limit;
    const queries = entries.map((entry, index) => {
        const parts = entry.name.split('|');
        if (parts.length < 3) {
            return res.status(400).json({ error: 'Invalid name format' });
        }
        table=parts[2];
        schema=parts[0];
        column=parts[1];
        if(index==0){
            columns += column;
        }else{
            columns += ", " + column;
        }


        // SQL 인젝션 방지를 위한 기본 검증
        if (!/^[a-zA-Z0-9_]+$/.test(column) || !/^[a-zA-Z0-9_]+$/.test(table)) {
            return res.status(400).json({ error: 'Invalid table or column name' });
        }

        // 동적으로 쿼리 생성
    });

    const query = `
            SELECT ${columns}
            FROM ${schema}.${table}
            limit ${limit}
        `;

    console.log('Generated Query:', query);

    connection.query(query, [connection.config.database, table], (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Error fetching column info' });
        }

        // 결과를 기반으로 TreeNode 객체 생성
        const treeNodes = results.map((column, index) => {
            const columnDetails = {
                name: column.COLUMN_NAME
            };

            // 동적으로 컬럼 세부정보 추가
            Object.keys(column).forEach(key => {
                columnDetails[key.toLowerCase()] = column[key];
            });

            return columnDetails;
        });

        res.json(treeNodes);
    });
}


function makeSelectQuery(req, res) {

    const entries = req.body.use_yn; // 클라이언트로부터 받은 JSON 배열
    console.log("useyn entries", entries);
    let table = '';
    let schema = '';
    let columns =''
    const limit = req.body.limit;
    if(entries.length === 0) {
        return '';
    }
    const queries = entries.map((entry, index) => {
        const parts = entry.split('|');
        if (parts.length < 3) {
            return res.status(400).json({ error: 'Invalid name format' });
        }
        table=parts[2];
        schema=parts[0];
        column=parts[1];
        if(index==0){
            columns += column;
        }else{
            columns += ", " + column;
        }
        // SQL 인젝션 방지를 위한 기본 검증
        if (!/^[a-zA-Z0-9_]+$/.test(column) || !/^[a-zA-Z0-9_]+$/.test(table)) {
            return res.status(400).json({ error: 'Invalid table or column name' });
        }
        return columns;
        // 동적으로 쿼리 생성
    });
    console.log('Generated makeSelectQuery:', columns);
    return [schema, table, columns];
}
function makeWhereQuery(req, res) {

    const entries = req.body.key; // 클라이언트로부터 받은 JSON 배열
    let table = '';
    let schema = '';
    let columns =''
    if (entries.length === 0) {
        return '';
    }
    const queries = entries.map((entry, index) => {
        const parts = entry.split('|');
        if (parts.length < 3) {
            return res.status(400).json({ error: 'Invalid name format' });
        }
        table=parts[2];
        schema=parts[0];
        column=parts[1];
        if(index==0){
            columns += " where " + column + " = ? ";
        }else{
            columns += " and " + column  + " = ? ";
        }

        // SQL 인젝션 방지를 위한 기본 검증
        if (!/^[a-zA-Z0-9_]+$/.test(column) || !/^[a-zA-Z0-9_]+$/.test(table)) {
            return res.status(400).json({ error: 'Invalid table or column name' });
        }

        // 동적으로 쿼리 생성
    });
    console.log('Generated makeWhereQuery:', columns);
    return columns;
}

function makeOrderQuery(req, res) {

    const entries = req.body.order; // 클라이언트로부터 받은 JSON 배열
    const sorts = req.body.sort; // 클라이언트로부터 받은 JSON 배열
    let table = '';
    let schema = '';
    let column = {};
    let sort = {};
    if (entries.length === 0) {
        return '';
    }
    const o = entries.map((entry, index) => {
        const parts = entry.split('|');
        if (parts.length < 3) {
            return res.status(400).json({ error: 'Invalid name format' });
        }
        column[index]= parts[1];
        // 동적으로 쿼리 생성
    });
    const s = sorts.map((entry, index) => {
        sort[index] = entry;
    });

    console.log('Generated makeOrderQuery:', query);
    return query;
}

function getApiQuery(req, res) {
    console.log('Generated getApiQuery:', req.body);
    const [schema, table, columns] = makeSelectQuery(req, res);
    const where = makeWhereQuery(req, res);
    //const order = makeOrderQuery(req, res);
    const limit = req.body.limit;

    const query = `
        SELECT ${columns} FROM ${schema}.${table} ${where} limit ${limit}
    `;

    console.log('Generated Query:', query);
    res.json(query);
}

function getApiSave(req, res) {
    console.log('Generated getApiSave:', req.body);
    const [schema, table, columns] = makeSelectQuery(req, res);
    const where = makeWhereQuery(req, res);
    //const order = makeOrderQuery(req, res);
    const fileName = `${schema}.${table}___column___${columns.replaceAll(", ",".")}.info`;
    console.log('Generated getApiSave:', fileName);

    const filePath = path.join(__dirname, 'ext_api', fileName);
    const dataToWrite = JSON.stringify(req.body); // 파일에 저장할 데이터

    // 파일 생성 및 데이터 쓰기
    fs.writeFile(filePath, dataToWrite, 'utf8')
        .then(() => {
            console.log('File saved successfully:', filePath);
            res.json({ message: 'File saved successfully', filePath: filePath });
        })
        .catch(err => {
            console.error('Error writing file:', err);
            res.status(500).json({ error: 'Failed to write file' });
        });
}


module.exports = { getTables, getTableColumns, getTableData, insertJSONL, getApiQuery, getApiSave };
