const path = require('path');

module.exports = {
    mode: 'development',
    entry: './src/index.tsx',  // Entry 포인트 변경
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,  // TypeScript 파일에 대한 규칙
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader',
                    'postcss-loader'
                ]
            },
            {
                test: /\.js$/,
                enforce: 'pre',
                use: ['source-map-loader'],
                exclude: /node_modules/
            }
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],  // TypeScript 파일 확장자 추가
        fallback: {
            stream: require.resolve("stream-browserify"),
            vm: require.resolve("vm-browserify"),
            crypto: require.resolve('crypto-browserify'),
            os: require.resolve("os-browserify/browser"),
            path: require.resolve("path-browserify")
        },
    },
    devtool: 'inline-source-map',  // 소스맵 설정
    ignoreWarnings: [
        {
            module: /bootswatch\/dist\/yeti\/bootstrap\.min\.css/, // 경고를 무시할 모듈 경로
            message: /Failed to parse source map/ // 무시할 경고 메시지
        }
    ],
    stats: {
        warningsFilter: [
            /Failed to parse source map/,
            /bootswatch\/dist\/yeti\/bootstrap\.min\.css/
        ]
    }
};
