const { promisify } = require('util');
const os = require('os');
const {query} = require("express"); // Importing the diskusage module

// java 모듈 조건부 로드 (Apple Silicon에서 네이티브 빌드 문제 방지)
let java = null;
let JMXServiceURL = null;
let JMXConnectorFactory = null;
let ObjectName = null;
let javaAvailable = false;

try {
    java = require('java');
    JMXServiceURL = java.import('javax.management.remote.JMXServiceURL');
    JMXConnectorFactory = java.import('javax.management.remote.JMXConnectorFactory');
    ObjectName = java.import('javax.management.ObjectName');
    javaAvailable = true;
    console.log('[JMX Monitor] Java module loaded successfully');
} catch (err) {
    console.warn('[JMX Monitor] Java module not available:', err.message);
    console.warn('[JMX Monitor] JMX monitoring will be disabled');
}

module.exports = { getWASJMXInformation };

const t = 60000;
async function getWASJMXInformation(req, res) {
    // Java 모듈이 없으면 비활성화 응답
    if (!javaAvailable) {
        return res.status(503).json({
            systemInfo: {
                result: "disabled",
                message: "JMX monitoring is disabled (Java module not available)"
            }
        });
    }

    const timeout = setTimeout(() => {
        res.status(408).send('Request Timeout');
    }, t); // 5000ms = 5초 타임아웃 설정


    try {
        const { h: hostname, ip: ip, p: port } = req.body;
        //const hostname = "localhost";
        //const port = "9988"
        const u = 'service:jmx:rmi:///jndi/rmi://'+ip+':'+port+'/jmxrmi';
        //console.log("jmx-monitor ", u);
        const url = new JMXServiceURL(u);

        //const url = new JMXServiceURL('service:jmx:rmi:///jndi/rmi://localhost:9988/jmxrmi');
        const connectPromise = promisify(JMXConnectorFactory.connect);

        const connector = await connectPromise(url, null);
        const connection = connector.getMBeanServerConnectionSync();

        // Heap Memory
        const heapName = new ObjectName('java.lang:type=Memory');
        const getAttributePromise = promisify(connection.getAttribute.bind(connection));
        const heapMemoryUsage = await getAttributePromise(heapName, 'HeapMemoryUsage');
        const usedHeap = java.callMethodSync(heapMemoryUsage, 'get', 'used') / 1024 / 1024;
        const maxHeap = java.callMethodSync(heapMemoryUsage, 'get', 'max') / 1024 / 1024;

        const memoryUsage = await getAttributePromise(heapName, 'NonHeapMemoryUsage');
        const usedNonHeap = java.callMethodSync(memoryUsage, 'get', 'used') / 1024 / 1024;
        const committedNonHeap = java.callMethodSync(memoryUsage, 'get', 'committed') / 1024 / 1024;

        // Operating System
        const osMBeanName = new ObjectName('java.lang:type=OperatingSystem');
        const osName = await getAttributePromise(osMBeanName, 'Name');
        const osVersion = await getAttributePromise(osMBeanName, 'Version');
        const systemLoadAverage = await getAttributePromise(osMBeanName, 'SystemLoadAverage');
        const availableProcessors = await getAttributePromise(osMBeanName, 'AvailableProcessors');
        //console.log('=====================================================================');

        // Thread Info
        const threadMBeanName = new ObjectName('java.lang:type=Threading');
        const threadCount = await getAttributePromise(threadMBeanName, 'ThreadCount');
        const totalStartedThreadCount = await getAttributePromise(threadMBeanName, 'TotalStartedThreadCount');

        // Class Loading Info
        const classLoadingMBeanName = new ObjectName('java.lang:type=ClassLoading');
        const loadedClassCount = await getAttributePromise(classLoadingMBeanName, 'LoadedClassCount');
        const totalLoadedClassCount = await getAttributePromise(classLoadingMBeanName, 'TotalLoadedClassCount');
        const unloadedClassCount = await getAttributePromise(classLoadingMBeanName, 'UnloadedClassCount');

        const currentTime = new Date(); // 현재 일시

        const systemInfo = {
            hostname: hostname,
            timestamp: currentTime,
            osName: osName,
            osVersion: osVersion,
            systemLoadAverage: systemLoadAverage.toFixed(2),
            availableProcessors: availableProcessors.toString(),
            usedHeapMemoryMB: usedHeap.toFixed(2),
            maxHeapMemoryMB: maxHeap.toFixed(2),
            usedNonHeapMemoryMB: usedNonHeap.toFixed(2),
            maxNonHeapMemoryMB: committedNonHeap.toFixed(2),
            threadCount: threadCount,
            totalStartedThreadCount: totalStartedThreadCount,
            loadedClassCount: loadedClassCount,
            totalLoadedClassCount: totalLoadedClassCount,
            unloadedClassCount: unloadedClassCount,
            result: "success"
        };

        //console.log(systemInfo);
        //console.log('=================================================================');
        clearTimeout(timeout);
        res.setHeader('Content-Type', 'application/json');
        return res.json({ systemInfo });  // ID 접근 방식을 thread.data.id로 수정
          // ID 접근 방식을 thread.data.id로 수정
    } catch (err) {
        clearTimeout(timeout); // 에러 발생시 타임아웃 클리어
        console.error("Error fetching JMX information:", err);
        res.setHeader('Content-Type', 'application/json');
        const systemInfo = {
            result: "failed"
        };

        return res.json({ systemInfo });  // ID 접근 방식을 thread.data.id로 수정
    }
}

async function getWASJMXInformation_ori(req, res) {
    const timeout = setTimeout(() => {
        res.status(408).send('Request Timeout');
    }, t); // 5000ms = 5초 타임아웃 설정


    try {
        const { h: hostname, p: port } = req.body;
        //const hostname = "localhost";
        //const port = "9988"
        const u = 'service:jmx:rmi:///jndi/rmi://'+hostname+':'+port+'/jmxrmi';
        const url = new JMXServiceURL(u);

        //const url = new JMXServiceURL('service:jmx:rmi:///jndi/rmi://localhost:9988/jmxrmi');
        const connectPromise = promisify(JMXConnectorFactory.connect);

        const connector = await connectPromise(url, null);
        const connection = connector.getMBeanServerConnectionSync();

        // Heap Memory
        const heapName = new ObjectName('java.lang:type=Memory');
        const getAttributePromise = promisify(connection.getAttribute.bind(connection));
        const heapMemoryUsage = await getAttributePromise(heapName, 'HeapMemoryUsage');
        const usedHeap = java.callMethodSync(heapMemoryUsage, 'get', 'used') / 1024 / 1024;
        const maxHeap = java.callMethodSync(heapMemoryUsage, 'get', 'max') / 1024 / 1024;

        const memoryUsage = await getAttributePromise(heapName, 'NonHeapMemoryUsage');
        const usedNonHeap = java.callMethodSync(memoryUsage, 'get', 'used') / 1024 / 1024;
        const committedNonHeap = java.callMethodSync(memoryUsage, 'get', 'committed') / 1024 / 1024;

        // Operating System
        const osMBeanName = new ObjectName('java.lang:type=OperatingSystem');
        const osName = await getAttributePromise(osMBeanName, 'Name');
        const osVersion = await getAttributePromise(osMBeanName, 'Version');
        const systemLoadAverage = await getAttributePromise(osMBeanName, 'SystemLoadAverage');
        const availableProcessors = await getAttributePromise(osMBeanName, 'AvailableProcessors');
        //console.log('=====================================================================');

        // Thread Info
        const threadMBeanName = new ObjectName('java.lang:type=Threading');
        const threadCount = await getAttributePromise(threadMBeanName, 'ThreadCount');
        const totalStartedThreadCount = await getAttributePromise(threadMBeanName, 'TotalStartedThreadCount');

        // Class Loading Info
        const classLoadingMBeanName = new ObjectName('java.lang:type=ClassLoading');
        const loadedClassCount = await getAttributePromise(classLoadingMBeanName, 'LoadedClassCount');
        const totalLoadedClassCount = await getAttributePromise(classLoadingMBeanName, 'TotalLoadedClassCount');
        const unloadedClassCount = await getAttributePromise(classLoadingMBeanName, 'UnloadedClassCount');

        const currentTime = new Date(); // 현재 일시

        const systemInfo = {
            hostname: hostname,
            timestamp: currentTime,
            osName: osName,
            osVersion: osVersion,
            systemLoadAverage: systemLoadAverage.toFixed(2),
            availableProcessors: availableProcessors.toString(),
            usedHeapMemoryMB: usedHeap.toFixed(2),
            maxHeapMemoryMB: maxHeap.toFixed(2),
            usedNonHeapMemoryMB: usedNonHeap.toFixed(2),
            maxNonHeapMemoryMB: committedNonHeap.toFixed(2),
            threadCount: threadCount,
            totalStartedThreadCount: totalStartedThreadCount,
            loadedClassCount: loadedClassCount,
            totalLoadedClassCount: totalLoadedClassCount,
            unloadedClassCount: unloadedClassCount,
            result: "success"
        };

        //console.log(systemInfo);
        //console.log('=================================================================');
        clearTimeout(timeout);
        res.setHeader('Content-Type', 'application/json');
        return res.json({ systemInfo });  // ID 접근 방식을 thread.data.id로 수정
        // ID 접근 방식을 thread.data.id로 수정
    } catch (err) {
        clearTimeout(timeout); // 에러 발생시 타임아웃 클리어
        console.error("Error fetching JMX information:", err);
        res.setHeader('Content-Type', 'application/json');
        const systemInfo = {
            result: "failed"
        };

        return res.json({ systemInfo });  // ID 접근 방식을 thread.data.id로 수정
    }
}
async function fetchJmxData() {
    try {
        const hostname = "localhost";
        const port = "9988"
        const u = 'service:jmx:rmi:///jndi/rmi://'+hostname+':'+port+'/jmxrmi';
        const url = new JMXServiceURL(u);

        //const url = new JMXServiceURL('service:jmx:rmi:///jndi/rmi://localhost:9988/jmxrmi');
        const connectPromise = promisify(JMXConnectorFactory.connect);

        const connector = await connectPromise(url, null);
        const connection = connector.getMBeanServerConnectionSync();

        // Heap Memory
        const heapName = new ObjectName('java.lang:type=Memory');
        const getAttributePromise = promisify(connection.getAttribute.bind(connection));
        const heapMemoryUsage = await getAttributePromise(heapName, 'HeapMemoryUsage');
        const usedHeap = java.callMethodSync(heapMemoryUsage, 'get', 'used') / 1024 / 1024;
        const maxHeap = java.callMethodSync(heapMemoryUsage, 'get', 'max') / 1024 / 1024;

        const memoryUsage = await getAttributePromise(heapName, 'NonHeapMemoryUsage');
        const usedNonHeap = java.callMethodSync(memoryUsage, 'get', 'used') / 1024 / 1024;
        const committedNonHeap = java.callMethodSync(memoryUsage, 'get', 'committed') / 1024 / 1024;

        // Operating System
        const osMBeanName = new ObjectName('java.lang:type=OperatingSystem');
        const osName = await getAttributePromise(osMBeanName, 'Name');
        const osVersion = await getAttributePromise(osMBeanName, 'Version');
        const systemLoadAverage = await getAttributePromise(osMBeanName, 'SystemLoadAverage');
        const availableProcessors = await getAttributePromise(osMBeanName, 'AvailableProcessors');
        //console.log('=====================================================================');




        // Thread Info
        const threadMBeanName = new ObjectName('java.lang:type=Threading');
        const threadCount = await getAttributePromise(threadMBeanName, 'ThreadCount');
        const totalStartedThreadCount = await getAttributePromise(threadMBeanName, 'TotalStartedThreadCount');

        // Class Loading Info
        const classLoadingMBeanName = new ObjectName('java.lang:type=ClassLoading');
        const loadedClassCount = await getAttributePromise(classLoadingMBeanName, 'LoadedClassCount');
        const totalLoadedClassCount = await getAttributePromise(classLoadingMBeanName, 'TotalLoadedClassCount');
        const unloadedClassCount = await getAttributePromise(classLoadingMBeanName, 'UnloadedClassCount');

/*
        console.log(`OS Name: ${osName}`);
        console.log(`OS Version: ${osVersion}`);

        console.log(`System load average: ${systemLoadAverage.toFixed(2)}`);
        console.log(`Available processors: ${availableProcessors.toString()}`);

        console.log(`Used heap memory: ${usedHeap.toFixed(2)} MB`);
        console.log(`Max heap memory: ${maxHeap.toFixed(2)} MB`);
        console.log(`Used None heap memory: ${usedNonHeap.toFixed(2)} MB`);
        console.log(`Max None heap memory: ${committedNonHeap.toFixed(2)} MB`);

        console.log(`threadCount: ${threadCount}`);
        console.log(`totalStartedThreadCount: ${totalStartedThreadCount}`);

        console.log(`loadedClassCount: ${loadedClassCount}`);
        console.log(`totalLoadedClassCount: ${totalLoadedClassCount}`);
        console.log(`unloadedClassCount: ${unloadedClassCount}`);*/

        const currentTime = new Date(); // 현재 일시

        const systemInfo = {
            hostname: hostname,
            timestamp: currentTime,
            osName: osName,
            osVersion: osVersion,
            systemLoadAverage: systemLoadAverage.toFixed(2),
            availableProcessors: availableProcessors.toString(),
            usedHeapMemoryMB: usedHeap.toFixed(2),
            maxHeapMemoryMB: maxHeap.toFixed(2),
            usedNonHeapMemoryMB: usedNonHeap.toFixed(2),
            maxNonHeapMemoryMB: committedNonHeap.toFixed(2),
            threadCount: threadCount,
            totalStartedThreadCount: totalStartedThreadCount,
            loadedClassCount: loadedClassCount,
            totalLoadedClassCount: totalLoadedClassCount,
            unloadedClassCount: unloadedClassCount
        };

        //console.log(systemInfo);
        //console.log('=================================================================');

        // Operating System MBean


    } catch (err) {
        console.error("Error during JMX connection or data retrieval:", err);
    }
}

// 데이터 가져오기를 5초마다 반복
//setInterval(fetchJmxData, 1000);


/*
async function getHeapMemoryUsage() {
    try {
            const connector = await connectPromise(url, null);
            console.log("connectAsync => connectPromise: ", connector);
            const connection = connector.getMBeanServerConnectionSync();
            console.log("connectAsync => connectPromise: connection ", connection);

            const mbeanName = new ObjectName('java.lang:type=Memory');
            const getAttributePromise = promisify(connection.getAttribute.bind(connection));

            const heapMemoryUsage = await getAttributePromise(mbeanName, 'HeapMemoryUsage');
            console.log("Used memory:", java.callMethodSync(heapMemoryUsage, 'get', 'used').toString());

    } catch (err) {
        console.error("Error during JMX connection or data retrieval:", err);
    }
}

getHeapMemoryUsage()*/

