// dataFetcher.js
const fetchAccessData = async (req, res, opensearchClient) => {
    try {
        const response = await opensearchClient.search({
            index: 'tomcat-*',
            body: {
                size: 0,
                query: {
                    range: {
                        "@timestamp": {
                            "gte": "now-240m/m",
                            "lte": "now/m"
                        }
                    }
                },
                aggs: {
                    "hostname_stats": {
                        "terms": {"field": "hostname.keyword"},
                        "aggs": {
                            "code": {"terms": {"field": "code.keyword"}}
                        }
                    }
                }
            }
        });

        // 결과 출력
        const transformedData = transformData(response);
        console.log(transformedData);

        return res.status(200).json(transformedData);
    } catch (error) {
        console.error('Error querying Opensearch:', error);
        return res.status(200).json({ result: 'failed', error: error });
    }
};

// 결과를 변환하는 함수
function transformData(data) {
    const hostnameStats = data.body.aggregations.hostname_stats.buckets;
    return hostnameStats.map(host => ({
        h: host.key,
        c: host.code.buckets.map(code => ({
            cd: code.key,
            ct: code.doc_count
        }))
    }));
}

module.exports = { fetchAccessData };
