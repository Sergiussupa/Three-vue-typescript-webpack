const path = require('path');
const { VueLoaderPlugin } = require('vue-loader');

module.exports = {
    mode: 'development',
    entry: './src/main.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
        publicPath: '/dist/'  // Обеспечивает правильный путь к bundle.js
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'public'),  // Указывает папку с index.html
        },
        historyApiFallback: true,  // Это важно для SPA, чтобы все URL направлялись на index.html
        compress: true,
        port: 8080,
    },
    module: {
        rules: [
            {
                test: /\.vue$/,
                loader: 'vue-loader'
            },
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                options: { appendTsSuffixTo: [/\.vue$/] }
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.vue']
    },
    plugins: [
        new VueLoaderPlugin()
    ]
};
