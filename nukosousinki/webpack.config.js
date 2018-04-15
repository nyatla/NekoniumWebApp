//require('babel-core/register'); // development.jsでES6を使えるようにする

const path = require('path');
var webpack = require("webpack");
var CopyWebpackPlugin = require('copy-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const app = {
    // モードの設定、v4系以降はmodeを指定しないと、webpack実行時に警告が出る
    mode: 'development',
    // エントリーポイントの設定
    entry: [
        path.resolve(__dirname,'./src/js/app.jsx'),
        'webpack-dev-server/client?http://localhost:3000',
        'webpack/hot/only-dev-server'
    //    ,'react-hot-loader/patch'
    ],
    // 出力の設定
    output: {
        filename: 'app.jsx',
        path: path.join(__dirname, 'public'),
        publicPath: '/'
    },
    module:{
        rules:[
            { test: /\.jsx$/,exclude: /node_modules/,loader: 'babel-loader',    query:{presets:['react']}},
            { test: /\.less$/,use:[{loader: 'style-loader'}, {loader: 'css-loader'}, {loader: 'less-loader'}]},
            { test: /\.css$/, use: ['style-loader','css-loader'] },
            //https://github.com/ics-creative/170330_webpack/blob/master/tutorial-bootstrap-style-js/webpack.config.js
            { test: /\.scss$/,use: ExtractTextPlugin.extract([
                {loader: 'css-loader',options: {url: false,sourceMap: true,minimize: true,importLoaders: 2},},
                {loader: 'postcss-loader',options: {sourceMap: true,plugins: () => [require('autoprefixer')]},},
                {loader: 'sass-loader',options: {sourceMap: true,}}
            ],)}
        ]
    },
    resolve: {
        extensions: ['.js', '.jsx'],
    },
    plugins: [
        new CopyWebpackPlugin([
            { from: __dirname+'/src/index.html', to: "index.html" },
            //      { from: './app/images', to: "images" },
        ]),
        //    new ExtractTextPlugin('style.css'),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),  // don't reload if there is an error    
    ],

    // webpack-dev-server向け設定
    devServer: {
        hot: true,
        inline: true,
        historyApiFallback: true,
        port: 3000,
        headers: { 'Access-Control-Allow-Origin': '*' } // 必要があれば設定する
    },
    devtool: "source-map"
};
module.exports=[app];
