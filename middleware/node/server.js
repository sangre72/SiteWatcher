const express = require('express');
const helmet = require('helmet');
const session = require('express-session');
const upload = require('./file/uploads/multer_config');

const app = express();
app.use(express.json());
// Helmet 미들웨어를 사용하여 기본적인 보안 헤더 설정
app.use(helmet());
//X-Content-Type-Options:
app.use(helmet.noSniff());
//X-Frame-Options:
app.use(helmet.frameguard({ action: 'sameorigin' })); // 동일 출처 프레임만 허용// app.use(helmet.frameguard({ action: 'deny' })); // 모든 프레임 로드 거부
//X-XSS-Protection:
app.use(helmet.xssFilter());
// Content Security Policy (CSP) 헤더 설정
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        // 추가적인 정책 설정...
    },
}));

const port = 3001; // 기존 HTTP 서버 포트와 동일하게 설정
//const { getTables, getTableColumns, getTableData, insertJSONL, getApiQuery , getApiSave} = require('./db/dbHandler');
const { getFileTree } = require('./file/fileTreeHandler');
const { getFileContent } = require('./file/fileOpenHandler');
const { saveFileContent } = require('./file/fileSaveHandler');
const { getCpuUsageNodes, getCpuUsageNode } = require('./chart/cpuUsageHandler');
const { getMemoryUsageNode } = require('./chart/MemoryUsageHandler');
const { getGPTMessage } = require('./api/GPTMessageHandler');
const { getGMNMessage } = require('./api/GMNMessageHandler');

const { createThread, addMessage, runAssistant, checkingStatus, checkRunStatus} = require('./api/GPTMessageAssistantsHandler2');
const { deleteAssistant } = require('./api/DeleteGPTAssistant');

//jmx information
const { getWASJMXInformation } = require('./monitor/java/jmx-monitor');
const { sshPing } = require('./monitor/host/ssh');
const { ssh_command } = require('./monitor/host/ssh_command');
const { checkWasStatus } = require('./monitor/host/was');
const { checkJmxStatus } = require('./monitor/host/jmx');
const { get_host_resources_information, get_host_resources_information_os} = require('./monitor/host/host_resources_information');
const { externalApiRouter, setExternalAPIs, getExternalAPIs } = require('./api/external_api'); // external_api.js 파일을 불러옴
const { log_fetchPageVisits, log_fetchPageVisitsAgg, log_fetchPageVisitsAggHost } = require('./monitor/host/log_query');
const { hosts_information } = require('./monitor/hosts/hosts_information');
// learn
// 라우트 모듈 사용
/*const { Authentication } = require('./login/sso/Authentication');*/
// CORS 미들웨어 설정
/*

권장 사항:

프로덕션 환경에서는 일반적으로 app.use(cors(corsOptions))를 사용하고 특정 출처와 적절한 자격 증명 처리를 사용하여 구성하는 것이 좋습니다. 이렇게 하면 보안을 강화하고 리소스 액세스에 대한 제어를 유지할 수 있습니다.


장점:

    세밀한 제어: 애플리케이션 요구 사항에 맞게 CORS 설정을 정교하게 구성할 수 있습니다.
    향상된 보안: 특정 출처로 액세스를 제한하여 보안 위험을 완화할 수 있습니다.
    단점:

더 복잡함: 기본 cors() 사용에 비해 추가 설정이 필요합니다.*/
const cors = require('cors');
const DeleteGPTAssistant = require("./api/DeleteGPTAssistant");

const whitelist = ['http://localhost:4000', 'http://localhost:3000'];

const corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1 || !origin) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true, // 쿠키/인증 정보를 처리하기 위해 필요
    optionsSuccessStatus: 200 // 일부 레거시 브라우저에 대한 지원
};

/* const corsOptions = {
    origin: 'http://localhost:4000', // 클라이언트 주소
    credentials: true, // 쿠키/인증 정보를 처리하기 위해 필요
    optionsSuccessStatus: 200 // 일부 레거시 브라우저에 대한 지원
}; */


app.use(cors(corsOptions));
/*
방법 1: app.use(cors()) 사용

이 방식은 Express.js에서 제공하는 기본 cors() 미들웨어를 사용합니다. 모든 출처からの 요청을 허용하고 기본 CORS 헤더를 설정하여 서버 리소스에 대한 광범위한 액세스를 제공합니다.

장점:

간편함: 구현이 쉽고 최소한의 설정만 필요합니다.
단점:

제한적인 제어: 모든 출처からの 요청을 허용하여 프로덕션 환경에서 보안 위험을 초래할 수 있습니다.
제한적인 사용자 지정: 특정 요구 사항에 맞게 CORS 설정을 조정하는 데 유연성이 부족합니다.

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});
*/
// API 정보를 저장할 객체
const apis_external = {};

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false, // 개발 환경에서는 false로 설정
        name: 'JSESSIONID' // 쿠키 이름을 JSESSIONID로 설정
    }
}));

// host resource
app.post('/ssh-host-resource-information', get_host_resources_information);
app.post('/ssh-host-resource-information_os', get_host_resources_information_os);
// was 정보
app.post('/ssh-was-status', checkWasStatus);
app.post('/ssh-jmx-status', checkJmxStatus);
app.post('/ssh-ping', sshPing);
app.post('/ssh-command', ssh_command);
app.post('/was-jmx-information', getWASJMXInformation);


// DB 관련 라우트 설정
/*app.get('/node-db-info-tables', getTables);
app.get('/node-db-info-table-columns', getTableColumns);
app.post('/node-db-info-tables-data', getTableData);
app.post('/node-db-insert-jsonl', insertJSONL);
app.post('/node-db-api-jsonl', getApiQuery);
app.post('/node-db-api-jsonl-save', getApiSave);*/
app.get('/directory-tree', getFileTree);
app.get('/file/open', getFileContent);
app.get('/file/save', saveFileContent);


// 차트 샘플
//app.get('/cpu-usage-nodes', getCpuUsageNodes);
app.get('/cpu-usage-nodes', getCpuUsageNodes);
// 차트 샘플
app.get('/cpu-usage-node', getCpuUsageNode);

// 차트 샘플
app.get('/memory-usage-node', getMemoryUsageNode);

// 차트 샘플
app.get('/api/gpt-message', getGPTMessage);
//app.get('/api/gmn-message', getGMNMessage);

// OpenAI Assistant ID - 환경 변수에서 로드
const assistantId = process.env.OPENAI_ASSISTANT_ID || '';

app.get('/gpt/thread', (req, res) => {
    createThread(res, assistantId);
});

const openai = require('openai');
app.post('/gpt/message', async (req, res) => {
    const { message, threadId } = req.body;
    try {
        console.log('Message received: ', req);
        // 메시지 추가
        // console.log("gpt 맞는가");
        await addMessage(threadId, message);
        // Assistant 실행
        const run = await runAssistant(threadId, assistantId);
        const runId = run.id;

        // 상태 확인 시작
        checkRunStatus(res, threadId, runId);  // `setInterval`을 내부적으로 관리하는 함수 호출
    } catch (error) {
        console.error('Error processing the message:', error);
        res.status(500).json({ error: 'Error processing the message' });
    }
});

app.get('/gpt/deleteAssistant', deleteAssistant);

const { getFilesAndDirs } = require('./learn/directoryStructure/directorySturcture');
const {readFileSync} = require("node:fs");
const {fetchAccessData} = require("./monitor/host/host_access_result");
const {getOpensearchClient} = require("./monitor/host/opensearch_client");
const {Client} = require("@elastic/elasticsearch");
const {addOrUpdateHostInfo} = require("./monitor/host/add_hosts");
const {addOrUpdateHttpInfo} = require("./monitor/host/add_https");
const {https_information} = require("./monitor/hosts/https_information");
const {getTables, getTableColumns, getTableData, insertJSONL, getApiQuery, getApiSave} = require("./db/dbHandler");
const { getNotices, getNoticeById, createNotice, updateNotice, deleteNotice } = require('./api/noticeHandler');
const { getComments, createComment, updateComment, deleteComment } = require('./api/noticeCommentHandler');
// Multi Board System
const { getBoards, getBoardByCode, getPosts, getPostById, createPost, updatePost, deletePost } = require('./api/boardHandler');
const { getComments: getBoardComments, createComment: createBoardComment, updateComment: updateBoardComment, deleteComment: deleteBoardComment } = require('./api/boardCommentHandler');
const { loadBoardSettings, uploadMiddleware, uploadFiles, getAttachments, downloadFile, deleteFile } = require('./api/boardAttachmentHandler');
const { requireAdmin, getBoards: getAdminBoards, createBoard, updateBoard, deleteBoard, addCategory, getCategories, deleteCategory } = require('./api/boardAdminHandler');
// Authentication
const { login, logout, getCurrentUser, register } = require('./api/authHandler');
// Menu System
const { getMenuTree, getUtilityMenu, getSitemap } = require('./api/menuHandler');
const { getAllMenus, getMenuById, createMenu, updateMenu, deleteMenu, reorderMenus, moveMenu } = require('./api/menuAdminHandler');
// Tenant System
const { getTenants, getTenantById, createTenant, updateTenant, deleteTenant } = require('./api/tenantAdminHandler');
app.post('/add-update-host', addOrUpdateHostInfo);
app.post('/add-update-http', addOrUpdateHttpInfo);

app.get('/learn/directory/list', getFilesAndDirs);

// Authentication API Routes (externalApiRouter보다 먼저 등록해야 함)
app.post('/api/auth/login', login);
app.post('/api/auth/logout', logout);
app.get('/api/auth/me', getCurrentUser);
app.post('/api/auth/register', register);

// Multi Board System API Routes (externalApiRouter보다 먼저 등록해야 함)
app.get('/api/boards', getBoards);
app.get('/api/boards/:boardCode', getBoardByCode);
app.get('/api/boards/:boardCode/posts', getPosts);
app.get('/api/boards/:boardCode/posts/:postId', getPostById);
app.post('/api/boards/:boardCode/posts', createPost);
app.put('/api/boards/:boardCode/posts/:postId', updatePost);
app.delete('/api/boards/:boardCode/posts/:postId', deletePost);

// Board Comments API Routes
app.get('/api/boards/:boardCode/posts/:postId/comments', getBoardComments);
app.post('/api/boards/:boardCode/posts/:postId/comments', createBoardComment);
app.put('/api/boards/:boardCode/posts/:postId/comments/:commentId', updateBoardComment);
app.delete('/api/boards/:boardCode/posts/:postId/comments/:commentId', deleteBoardComment);

// Board Attachments API Routes
app.get('/api/boards/:boardCode/posts/:postId/attachments', getAttachments);
app.post('/api/boards/:boardCode/posts/:postId/attachments', loadBoardSettings, uploadMiddleware, uploadFiles);
app.get('/api/attachments/:attachmentId/download', downloadFile);
app.delete('/api/attachments/:attachmentId', deleteFile);

// Board Admin API Routes
app.get('/api/admin/boards', requireAdmin, getAdminBoards);
app.post('/api/admin/boards', requireAdmin, createBoard);
app.put('/api/admin/boards/:boardCode', requireAdmin, updateBoard);
app.delete('/api/admin/boards/:boardCode', requireAdmin, deleteBoard);
app.get('/api/admin/boards/:boardCode/categories', requireAdmin, getCategories);
app.post('/api/admin/boards/:boardCode/categories', requireAdmin, addCategory);
app.delete('/api/admin/boards/:boardCode/categories/:categoryId', requireAdmin, deleteCategory);

// Menu API Routes (Public)
app.get('/api/menus', getMenuTree);
app.get('/api/menus/utility/:utilityType', getUtilityMenu);
app.get('/api/menus/sitemap', getSitemap);

// Menu Admin API Routes
app.get('/api/admin/menus', getAllMenus);
app.get('/api/admin/menus/:id', getMenuById);
app.post('/api/admin/menus', createMenu);
app.put('/api/admin/menus/reorder', reorderMenus);
app.put('/api/admin/menus/:id/move', moveMenu);
app.put('/api/admin/menus/:id', updateMenu);
app.delete('/api/admin/menus/:id', deleteMenu);

// Tenant Admin API Routes
app.get('/api/admin/tenants', requireAdmin, getTenants);
app.get('/api/admin/tenants/:id', requireAdmin, getTenantById);
app.post('/api/admin/tenants', requireAdmin, createTenant);
app.put('/api/admin/tenants/:id', requireAdmin, updateTenant);
app.delete('/api/admin/tenants/:id', requireAdmin, deleteTenant);

// 외부 API 라우터 등록
app.use('/api', externalApiRouter);

/*
const { directoryStructureRoute } = require('./learn/directoryStructure/directorySturcture');
app.use(directoryStructureRoute);
*/


// Passport 초기화
/*
app.use(Authentication.initialize());
*/

/*// SSO 로그인 라우트
app.post('/sso/login', Authentication.authenticate());
// 서버 시작*/


app.get('/log_monitor/fetchPageVisits', log_fetchPageVisits);
app.get('/log_monitor/fetchPageVisitsAgg', log_fetchPageVisitsAgg);
app.get('/log_monitor/fetchPageVisitsAggHost', log_fetchPageVisitsAggHost);

app.get('/hosts_information', hosts_information);
app.get('/https_information', https_information);

// Notice Board API Routes
app.get('/api/notices', getNotices);
app.get('/api/notices/:id', getNoticeById);
app.post('/api/notices', createNotice);
app.put('/api/notices/:id', updateNotice);
app.delete('/api/notices/:id', deleteNotice);

// Notice Comments API Routes
app.get('/api/notices/:noticeId/comments', getComments);
app.post('/api/notices/:noticeId/comments', createComment);
app.put('/api/notices/:noticeId/comments/:commentId', updateComment);
app.delete('/api/notices/:noticeId/comments/:commentId', deleteComment);

// 데이터 업데이트 함수 호출
// 웹소켓 핸들러 설정
const osc = getOpensearchClient();

app.get('/access-data', (req, res) => fetchAccessData(req, res, osc));

// '/upload' 경로에서 POST 요청을 처리합니다.
// 'files'라는 필드 이름으로 최대 5개의 파일을 업로드 허용
app.post('/upload', upload.array('filepond', 5), (req, res) => {
    if (req.files.length === 0) {
        return res.status(400).send('No files were uploaded.');
    }


    res.json(`${req.files.length} files uploaded successfully!`);
});

function loadAPIs() {

    const data = readFileSync('./api/external/api_list.properties', 'utf8');
    const lines = data.split('\n');

    lines.forEach(line => {
        const [key, value] = line.split('=');
        if(key.length >= 1) {
            const [apiName, property] = key.split('.');
            const prop = apis_external[apiName] || {};
            prop[property] = value.trim();
            apis_external[apiName] = prop;
        }
    });
    if(apis_external.length >= 1) {
     setExternalAPIs(apis_external);
    }
}


app.post('/image/search', async (req, res) => {
    const queryString = req.body.query;
    const translatedQuery = await translateTextKoreanToEnglish(queryString);
    console.log(`Translated query: ${translatedQuery}`);

    const matches = await imageSearch.searchImages(translatedQuery);
    res.render('results', { matches });
});


app.listen(port, ()  => {
    loadAPIs();

});