const axios = require('axios');

module.exports = { log_fetchPageVisits, log_fetchPageVisitsAgg, log_fetchPageVisitsAggHost };
async function log_fetchPageVisits(req, res) {
    const hostname = req.query.hostname;
    const intv = `now-${req.query.t}/s`;
    console.log("interval : " + intv);
    const url = 'http://localhost:9200/tomcat-*/_search';
    const data = {
        "query": {
            "bool": {
                "must": [
                    {
                        "match": {
                            "hostname.keyword": hostname
                        }
                    },
                    {
                        "range": {
                            "@timestamp": {
                                "gte": "now-360000s/s",
                                "lte": "now/s"
                            }
                        }
                    }
                ]
            }
        },
        _source: ["hostname", "@timestamp", "path"],  // 반환할 필드
        size: 1000  // 반환할 문서 수
    };

    try {
        const response = await axios.post(url, data, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log("Aggregation Results:", response.data);
        res.json({ result: response.data });
       /* node: string;
        x: string;
        y: number;
        */
    } catch (error) {
        console.error("Error fetching data:", error);
        res.setHeader('Content-Type', 'application/json');
        res.status(500).send("Internal Server Error");
    }
}


async function log_fetchPageVisitsAgg(req, res) {
    const hostname = req.query.hostname;
    const t = `now-${req.query.t}/m`;
    console.log("interval : " + t);
    const url = 'http://localhost:9200/tomcat-*/_search';
    const data = {
        size: 0,
        query: {
            bool: {
                must: [
                    {
                        range: {
                            "@timestamp": {
                                "gte": t, // 현재 시간으로부터 1분 전
                                "lte": "now/m"    // 현재 시간까지, 정확한 분 단위로 라운딩
                            }
                        }
                    }
                ]
            }
        },
        aggs: {
            "minute_stats": {
                "date_histogram": {
                    "field": "@timestamp",
                    "calendar_interval": "1m", // 1분 단위로 데이터를 그룹화
                },
                "aggs": {
                    "hosts": {
                        "terms": {
                            "field": "hostname.keyword",  // 호스트별로 그룹화
                            "size": 10                    // 상위 10개 호스트
                        },
                        "aggs": {
                            "pages": {
                                "terms": {
                                    "field": "path.keyword",  // 각 호스트 내 페이지별로 그룹화
                                    "size": 100               // 각 호스트별 상위 10개 페이지
                                }
                            },
                        }
                    }
                }
            }
        }
    };

//./ㄴ    "min_doc_count": 1        // 적어도 하나의 문서가 있는 간격만 포함


    try {
        const response = await axios.post(url, data, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log("================  Aggregation Results:", response.data.aggregations.minute_stats.buckets);

        const cpuUsagesMap = {};

        response.data.aggregations.minute_stats.buckets.forEach((bucket) => {
            bucket.hosts.buckets.forEach((hostBucket) => {
                const nodeName = hostBucket.key;
                // 현재 호스트 이름이 이미 맵에 있으면 기존 배열을 가져오고, 없으면 새 배열을 초기화
                if (!cpuUsagesMap[nodeName]) {
                    cpuUsagesMap[nodeName] = {
                        node: nodeName,
                        data: []
                    };
                }
                // 호스트의 데이터 배열에 새로운 x, y 값을 추가
                cpuUsagesMap[nodeName].data.push({
                    x: bucket.key, // Elasticsearch에서 제공하는 타임스탬프
                    y: hostBucket.doc_count // 해당 호스트의 문서 수
                });
            });
        });

// 객체의 값들만 배열로 변환
        const cpuUsages = Object.values(cpuUsagesMap);

        console.log(cpuUsages);

        res.json(cpuUsages);
    } catch (error) {
        console.error("Error fetching data:", error);
        res.setHeader('Content-Type', 'application/json');
        res.status(500).send("Internal Server Error");
    }
}

//1 간 단위 집계
/*const data = {
    size: 0,
    query: {
        bool: {
            must: [
                {
                    range: {
                        "@timestamp": {
                            "gte": "now-200h/h",  // 검색 시간 범위 설정
                            "lte": "now/h"        // 현재 시간까지, 올바른 라운딩
                        }
                    }
                }
            ]
        }
    },
    aggs: {
        "hourly_stats": {
            "date_histogram": {
                "field": "@timestamp",
                "calendar_interval": "1h", // 한 시간 단위로 데이터를 그룹화
                "min_doc_count": 1        // 적어도 하나의 문서가 있는 간격만 포함
            },
            "aggs": {
                "hosts": {
                    "terms": {
                        "field": "hostname.keyword",  // 호스트별로 그룹화
                        "size": 10                    // 상위 10개 호스트
                    },
                    "aggs": {
                        "pages": {
                            "terms": {
                                "field": "path.keyword",  // 각 호스트 내 페이지별로 그룹화
                                "size": 10               // 각 호스트별 상위 10개 페이지
                            }
                        },
                        "first_visit": {
                            "min": {
                                "field": "@timestamp"  // 각 호스트별 첫 방문 시간
                            }
                        },
                        "last_visit": {
                            "max": {
                                "field": "@timestamp"  // 각 호스트별 마지막 방문 시간
                            }
                        }
                    }
                }
            }
        }
    }
};*/

async function log_fetchPageVisitsAggHost(req, res) {
    const hostname = req.query.hostname;
    const intv = `now-${req.query.t}/s`;
    console.log("interval : " + intv);
    const url = 'http://localhost:9200/tomcat-*/_search';
    const data = {
        size: 0,
        query: {
            bool: {
                must: [
                    {
                        match: {
                            "hostname.keyword": hostname
                        }
                    },
                    {
                        range: {
                            "@timestamp": {
                                "gte": "now-360000s/s",
                                "lte": "now/s"
                            }
                        }
                    }
                ]
            }
        },
        aggs: {
            "hosts": {
                "terms": {
                    "field": "hostname.keyword",
                    "size": 10
                },
                aggs: {
                    "pages": {
                        "terms": {
                            "field": "path.keyword",
                            "size": 10
                        },
                        aggs: {
                            "first_visit": {
                                "min": {
                                    "field": "@timestamp"
                                }
                            },
                            "last_visit": {
                                "max": {
                                    "field": "@timestamp"
                                }
                            }
                        }
                    }
                }
            }
        }
    };

    try {
        const response = await axios.post(url, data, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log("Aggregation Results:", response.data);
        res.json({ result: response.data });
    } catch (error) {
        console.error("Error fetching data:", error);
        res.setHeader('Content-Type', 'application/json');
        res.status(500).send("Internal Server Error");
    }
}
