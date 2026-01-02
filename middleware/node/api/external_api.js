const express = require('express');
const { readFileSync } = require("node:fs");
const externalApiRouter = express.Router();

// external_api.js 파일
let externalAPIs = {};

/**
 * externalAPIs 객체를 설정하는 함수
 *
 * @param {object} apis - 설정할 API 객체
 */
function setExternalAPIs(apis) {
    externalAPIs = apis;
}

/**
 * externalAPIs 객체를 반환하는 함수
 *
 * @returns {object} - 현재 설정된 API 객체
 */
function getExternalAPIs() {
    return externalAPIs;
}

// API 등록 엔드포인트
externalApiRouter.post('/register', (req, res) => {
    const { name, table, columns } = req.body;

    // 새로운 API 정보를 externalAPIs 객체에 추가
    externalAPIs[name] = { table, columns };

    res.send('API registered successfully');
});

// API 실행 엔드포인트
externalApiRouter.get('/:name', (req, res) => {
    const { name } = req.params;
    const { table, columns } = externalAPIs[name] || {};

    // API 정보가 없을 경우 404 에러 응답
    if (!table || !columns) {
        return res.status(404).send('API not found');
    }

    // 동적으로 쿼리 생성
    const query = `SELECT ${columns.split(',').join(',')} FROM ${table}`;

    // 생성된 쿼리를 콘솔에 출력
    console.log('Generated Query:', query);

    // 실제로는 데이터베이스에 쿼리를 전송하고 결과를 처리할 수 있음
    // 이 예제에서는 생성된 쿼리를 응답으로 보냄
    res.json({ query });
});

// API 정보를 파일에서 읽어와 메모리에 저장하는 함수 (구현되지 않음)

module.exports = { setExternalAPIs, getExternalAPIs, externalApiRouter };
