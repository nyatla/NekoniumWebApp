//var $ = require('jquery');
// スタイルシートを読み込む
//import 'bootstrap/dist/css/bootstrap.min.css';
//var Web3 = require("web3");
require("../apps.less");
import React from 'react';
import ReactDOM from 'react-dom';
import { isNumber } from "util";

var Web3Wrapper=require("./Web3Wrapper.js");



class App extends React.Component{
  constructor(props) {
    super(props);
    this.state={};
  }
  componentDidMount()
  {
    var _t=this;    
    this.web3=new Web3Wrapper(function(state){
      _t.setState(Object.assign(_t.state,{st:state}));
      console.log("APP status:"+state);
    });
  }
  render()
  {
    var content=<div>NUkokococo</div>;
    if(this.web3){
      switch(this.state.st){
      case this.web3.ST.E_NOACCOUNT:
        content=<div>Account not exist.</div>;
        break;
      case this.web3.ST.E_NOWEB3:
        content=<div>Can not connuko to Web3 provider.</div>;
        break;
      case this.web3.ST.READY:
        content=<div><AddrForm web3={this.web3}/></div>;
        break;
      }
    }
    
    return(
      <div>
      <h1>ぬこ送信機</h1>
      <hr></hr>
      <p>
        このアプリケーションは、NukoMaskなどが提供するNekoniumのWeb3インタフェイスを使ってNUKOを送信します。
        動作にはNukoMaskなどが必要になりますので、事前に準備しておいてください。
      </p>
      <div>{content}</div>
      </div>
    );
  }
}

class AddrInput extends React.Component {
  constructor(props) {
    super(props);
    this.rex1=/^(0?|(0x[0-9a-fA-F]{0,40}))$/;
    this.rex2=/^(0x[0-9a-fA-F]{40})$/;
    this.state = {
      value:'',
      complete:false,
      fix:false
    };
    this.onChange = this.onChange.bind(this);
  }
  reset(){
    this.setState(Object.assign(this.state,{fix:false,value:'',complete:false}));
    if(this.props.onChange){
      this.props.onChange();
    }
  }
  setValue(v){
    var new_complete=false;
    if(!this.rex1.test(v)){
      return;
    }
    if(this.rex2.test(v)){
      new_complete=true;
    }
    this.setState(Object.assign(this.state,{complete:new_complete,value:v}));
    if(this.props.onChange){
      this.props.onChange();
    }
  }
  onChange(event) {
    this.setValue(event.target.value);
    event.preventDefault();
  }
  fix(f){
    this.setState(Object.assign(this.state,{fix:f}));
  }
  render() {
    return (
      <input type="text" value={this.state.value} disabled={this.state.fix} onChange={this.onChange} />
    );
  }
}

/**
 * Amount値のInput
 */
class AmountInput extends React.Component {
  constructor(props) {
    super(props);
    this.rex1=/^([0-9]{0,4}(\.[0-9]{0,5})?)$/;
    this.state = {
      value:props.value?props.value:'',
      complete:false,
      fix:false
    };
    this.onChange = this.onChange.bind(this);
  }
  fix(f){
    this.setState(Object.assign(this.state,{fix:f}));
  }
  reset(){
    this.setState(Object.assign(this.state,{fix:false,value:'',complete:false}));
    if(this.props.onChange){
      this.props.onChange();
    }
  }
  setValue(a){
    var new_complete=false;
    if(this.rex1.test(a)){
      var v=parseFloat(a);
      if(!isNaN(a) && v>0){
        new_complete=true;
      }
      this.setState(Object.assign(this.state,{complete:new_complete,value:a}));
      if(this.props.onChange){
        this.props.onChange();
      }
    }
  }
  onChange(event){
    this.setValue(event.target.value);
    event.preventDefault();
  }
  render() {
    return (
      <input type="text" value={this.state.value} disabled={this.state.fix} onChange={this.onChange} />
    );
  }
}

/**
 * 状態値['INCOMPLETE','READY','SUBMIT','ERROR','CONFIRMED']
 */
class TxThread extends React.Component {
  constructor(props) {
    super(props);
    this.ST={
      INCOMPLETE:1,
      READY:2,    //構成するコンポーネントがすべて有効な値を持つ
      SUBMIT:3,
      ERROR:4,
      SUBMITED:5
    };
    this.state = {
      st:this.ST.INCOMPLETE,
    };
    this.handleButton = this.handleButton.bind(this);
  }
  updateStatus(){
    switch(this.state.st){
      case this.ST.INCOMPLETE:
      case this.ST.READY:
        break;
      default:
        return;
    }
    var new_st;
    if(this.addrinput.state.complete && this.amountinput.state.complete){
      new_st=this.ST.READY;
    }else{
      new_st=this.ST.INCOMPLETE;
    }
    this.setState(Object.assign(this.state,{st:new_st}));
  }
  reset(){
    this.addrinput.reset();
    this.amountinput.reset();
    this.setState(Object.assign(this.state,{st:this.ST.INCOMPLETE}));
  }
  doSend(){
    var _t=this;
    switch(_t.state.st){
      case _t.ST.READY:
        break;
      default:
        console.error("oops!");
        return;
    }    
    var web3=_t.props.web3;
    _t.addrinput.fix(true);
    _t.amountinput.fix(true);
    _t.setState(Object.assign(_t.state,{st:_t.ST.SUBMIT}));
    web3.sendNuko(this.addrinput.state.value,this.amountinput.state.value,function(res){
      if(res==null){
        _t.setState(Object.assign(_t.state,{st:_t.ST.ERROR}));
      }else{
        _t.state.txhash=res;
        _t.setState(Object.assign(_t.state,{st:_t.ST.SUBMITED}));
      }
    });  
  }
  handleButton(event){
    console.log("button");
    this.doSend();
    event.preventDefault();
  }
  render() {
    function onChange(t){return function(){t.updateStatus();}}
    var bt="UNDEF";
    var tx="";
    var btn_disabled=true;
    switch(this.state.st){
      case this.ST.INCOMPLETE:
        bt="...";
        break;
      case this.ST.READY:
        btn_disabled=false;
        bt="Send";
        break;
      case this.ST.SUBMIT:
        bt="Submit";
        break;
      case this.ST.ERROR:
        bt="Error";
        break;
      case this.ST.SUBMITED:
        bt="Submited";
        tx=<span>TX : <a target="_blank" rel="noreferrer noopener" href={"http://nekonium.network/tx/"+this.state.txhash}>{this.state.txhash}</a></span>
        console.log(tx);
        break;
      }

    return (
      <div>
        <div>
          <div>
            <div><AddrInput onChange={onChange(this)} ref={(i) => {this.addrinput = (i)}}/></div>
            <div><AmountInput onChange={onChange(this)} value={this.props.amount} ref={(i) => {this.amountinput = (i)}}/></div>
            <div><button onClick={this.handleButton} disabled={btn_disabled}>{bt}</button></div>
          </div>
        </div>
        <div>{tx}</div>
      </div>
    );
  }
}


class AddrForm extends React.Component {
  constructor(props) {
    super(props);
    this.state={
      count:1
    }
    this.rows=[];
    this.handleAdd = this.handleAdd.bind(this);
    this.handleReset = this.handleReset.bind(this);
    this.handleSendAll = this.handleSendAll.bind(this);
    this.handleSetAmount = this.handleSetAmount.bind(this);
  }
  handleAdd(event) {
    console.log("add");
    this.setState({count:this.state.count+1});
    event.preventDefault();
  }
  handleReset(event) {
    if(window.confirm("アプリケーションをリセットしますか？\n入力した内容はすべて失われます。")){
      this.rows[0].reset();
      this.setState({count:1});
    }
    event.preventDefault();
  }
  handleSendAll(event) {
    var l=[];
    for(var i=0;i<this.rows.length;i++){
      if(this.rows[i].state.st==this.rows[i].ST.READY){
        l.push(this.rows[i]);
      }
    }
    if(l.length==0){
      alert("送信可能なアイテムはありません。");
      return;
    }
    if(window.confirm("送信可能な"+l.length+"件のアイテムを送信しますか？")){
      for(var i=0;i<l.length;i++){
          l[i].doSend();
      }
    }
    event.preventDefault();
  }
  handleSetAmount(){
    var l=[];
    for(var i=0;i<this.rows.length;i++){
      switch(this.rows[i].state.st){
      case this.rows[i].ST.READY:
      case this.rows[i].ST.INCOMPLETE:
        l.push(this.rows[i]);
      }
    }
    if(l.length==0){
      alert("設定可能なアイテムはありません。");
      return;
    }
    if(window.confirm(l.length+"件のアイテムのAmountを設定します。")){
      for(var i=0;i<l.length;i++){
          l[i].amountinput.setValue(this.default_amount.state.value);
      }
    }
    event.preventDefault();    
  }
  render() {

    var rows=[];
    const items=[];
    const amount=(this.default_amount)?this.default_amount.state.value:'';
    console.log(amount);
    for(var i=0;i<this.state.count;i++){
      items.push(<TxThread web3={this.props.web3} ref={(ri) => {rows.push(ri)}} key={i}/>)
    }
    this.rows=rows;
    return (
      <div className="AddrForm">
        <div><div>
          <div><button type="button" value="SetAmounts" onClick={this.handleSetAmount}>SetAmounts</button><AmountInput value="0.01" ref={(ri) => {this.default_amount=(ri)}}/><span>NUKO</span></div>
          <div><button type="button" value="Reset" onClick={this.handleReset}>Reset</button></div>
          <div><button type="button" value="SendAll" onClick={this.handleSendAll}>SendAll</button></div>
        </div></div>
        <div>
          <div>
            <div>To: Address</div><div>Amount(NUKO)</div><div>ACTION</div>
          </div>   
        </div>
        {items}
        <button type="button" value="Add" onClick={this.handleAdd}>+</button>
        <ul>
          <li>SetAmounts - 送信量を一括で設定します。</li>
          <li>Reset - アプリケーションを初期状態にします。</li>
          <li>SendAll - Actionが送信可能状態(Send)の行の送信を実行します。</li>
          <li>To:Address - 送信先のアカウントです。</li>
          <li>Amount(NUKO) -そのアカウントに送信する。NUKOの量です。個別に設定できます。</li>
          <li>Action - Sendと表示されているときは押すことができます。</li>
          <li>+ - 行を追加します。</li>
        </ul>
        <div id="footer"><a href="https://github.com/nyatla/NekoniumWebApp/tree/master/nukosousinki">Github</a>&nbsp;-&nbsp;<a href="https://nekonium.github.io/">Nekonium Project</a></div>
      </div>
    );

  }
}




window.onload = function() {
  ReactDOM.render(<App/>, document.getElementById('app'));
}


