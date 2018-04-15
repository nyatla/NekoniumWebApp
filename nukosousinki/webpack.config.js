//require('babel-core/register'); // development.jsでES6を使えるようにする

const path = require('path');
var webpack = require("webpack");
var CopyWebpackPlugin = require('copy-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const app={
    mode:"production",
    // エントリーポイントの設定
    entry: [
        path.resolve(__dirname,'./src/js/app.jsx'),
    //    ,'react-hot-loader/patch'
    ],
    // 出力の設定
    output: {
        filename: 'app.js',
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
    plugins:[
        new CopyWebpackPlugin([
            { from: __dirname+'/src/index.html', to: "index.html" },
        ])
    ]
}

module.exports=app;
