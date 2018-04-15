const Web3 = require("web3");
/**
 * NukoMaskのWeb3監視クラス。
 * 一定間隔でWeb3の状態を監視して、現在の状態を上位に伝える。
 */
function Web3Wrapper(event)
{
    var _t=this;
    _t.st=this.ST.E_NOWEB3;
    
    function periodic(){
        switch(_t.st){
        case _t.ST.E_NOWEB3:
            var web3=undefined;
            if(typeof window.nekonium !== 'undefined'){
                console.log("connect to nekonium.");
                web3=window.nekonium.web3;
            }else if(typeof window.nukomask !== 'undefined'){
                console.log("connect to nekonium.");
                web3=window.nukomask.web3;
            }
            if (typeof web3 === 'undefined'){
                _t.web3=undefined;
            }else{
                _t.web3=new Web3(web3.currentProvider);
                _t.st=_t.ST.E_NOACCOUNT;
                event(_t.st);
                periodic();//即時コール
                return;
            }
            setTimeout(periodic,1000);
            return;
        case _t.ST.E_NOACCOUNT:
            _t.web3.eth.getAccounts(function(err, accounts){
            if(!err && accounts.length>0){
                _t.st=_t.ST.READY;
                event(_t.st);
            }
            setTimeout(periodic,1000);
            });
            return;
        case _t.ST.READY:
            _t.web3.eth.getAccounts(function(err, accounts){
            if(err || accounts.length==0){
                _t.st=_t.ST.E_NOACCOUNT;
                event(_t.st);
            }
            setTimeout(periodic,1000);
            });
            return;
        }
    }
    event(_t.st);
    periodic();
}

Web3Wrapper.prototype.ST={
    E_NOWEB3:0,     //WEB3がない。
    E_NOACCOUNT:1,  //Accountがない。
    READY:2         //WEB3があり、Accountもある。
};

    /**
     * 現在のアカウントから、デフォルトGas値でNUKOを他のアカウントに送信する。
     * @param {*} toaccount 
     * 送信先アカウント
     * @param {*} amount 
     * 送信料(ether)
     * @param {*} cb 
     * function(res)
     *  resは失敗時null
     */
Web3Wrapper.prototype.sendNuko=function(toaccount,amount,cb)
{
    var _t=this;
    //アカウント取得
    _t.web3.eth.getAccounts(function(err, accounts){
        if(err || accounts.length==0){
            cb(null);
            return;
        }
        //from default,to toaccount
        var m = {to:toaccount, from:accounts[0],value: _t.web3.utils.toWei(amount, 'ether')};
        //送信
        _t.web3.eth.sendTransaction(m,(err, res) => {
        console.log("Callback");
        if(err){
            cb(null);
            return;
        }
        console.log("TransactionResponse:"+res);
        cb(res);
        })
    });
}

module.exports=Web3Wrapper;