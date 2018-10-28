//require('babel-core/register'); // development.jsでES6を使えるようにする

const path = require('path');
var webpack = require("webpack");
app=require(__dirname+"/webpack.config.js");

app.mode="development";
app.entry.push(
    'webpack-dev-server/client?http://localhost:3000',
    'webpack/hot/only-dev-server'
)
app.plugins.push(
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin());
app.devtool="source-map";
app.devServer={
    hot: true,
    inline: true,
    historyApiFallback: true,
    port: 3000,
    headers: { 'Access-Control-Allow-Origin': '*' } // 必要があれば設定する
};
module.exports=app;


    