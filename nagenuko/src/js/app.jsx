//var $ = require('jquery');
// スタイルシートを読み込む
//import 'bootstrap/dist/css/bootstrap.min.css';


import React from 'react';
import ReactDOM from 'react-dom';

class App extends React.Component {
  render () {
    alert(0);
    return "AAAAAddddAAAAAA";
  }
}

window.onload = function() {
  ReactDOM.render(<App/>, document.getElementById('app'));
}

/*
import 'bootstrap';
require("../apps.less");
ethutil=require("ethereumjs-util");

function AddrInput(div)
{
    var _t=this;
    this.val=function(){return tag.val();}
    this.isAddr=function(){return ethutil.isValidAddress(_t.val());}
}

function AddrTable(div)
{

    this.getAddrs=function(){

    }
    this.append=function(){}
}
*/