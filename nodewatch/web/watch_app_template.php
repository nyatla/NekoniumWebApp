<?php
/**
 * サーバー監視アプリケーションのテンプレートです。
 * サーバーの監視ログを記録して出力するクラスライブラリです。
 * 
 * JsonRpc20
 * JSONクライアントです。
 * 
 * AWatchAppTemplate
 * アプリケーションのテンプレートクラスです。継承して使います。
 * 2つの仮想関数を上書きしてください。
 * 
 * JsonExport
 * データベースの内容をJSONで出力するクラスです。
 */

/**
 * JSONRPCの送信クラス
 */
class JsonRpc20
{
	protected $url, $version;
	protected $id = 0;
	
	function __construct($url, $version="2.0",$id=0)
	{
		$this->url = $url;
		$this->version = $version;
	}
    public function request($method,$params_array="[]")
    {
        $data=json_encode(array("jsonrpc"=>"2.0","method"=>$method,"params"=>$params_array,"id"=>$this->id));
        $this->id=$this->id+1;
        // header
        $header = array(
            "Content-Type: application/json",
            "Content-Length: ".strlen($data)
        );

        $curl = curl_init($this->url);
        curl_setopt($curl,CURLOPT_POST, TRUE);
        curl_setopt($curl,CURLOPT_POSTFIELDS, $data);
        curl_setopt($curl,CURLOPT_SSL_VERIFYPEER, FALSE);
        curl_setopt($curl,CURLOPT_SSL_VERIFYHOST, FALSE);
        curl_setopt($curl,CURLOPT_RETURNTRANSFER, TRUE);
        $data = curl_exec($curl);
        curl_close($curl);
        return $data;
    }
}

class JsonExportApp
{
    private $version;
    private $dbfile;
    private $permission=["127.0.0.1"];
    function __construct($version="JsonExportApp/1.0",$a_db_file="log.sqlite3")
    {
        $this->version=$version;
        $this->dbfile=$a_db_file;
    }
    function setPermission($permission){
        $this->permission=$permission;
    }
    private function checkPermission(){
        if(!in_array($_SERVER['REMOTE_ADDR'],$this->permission)){
            throw new Exception("Permission denied.");
        }
    }
    private function makeLatestJson()
    {
        $ret_array=null;
        try {
            $time=time();
            $is_db_exist=is_readable ($this->dbfile);
            // 接続
            $pdo = new PDO('sqlite:'.$this->dbfile);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            // デフォルトのフェッチモードを連想配列形式に設定 
            // (毎回PDO::FETCH_ASSOCを指定する必要が無くなる)
            $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            #ActivityLogの最新時刻を得る
            $r=$pdo->query("select latest from (select id,max(timestamp) as latest from activity_log);");
            $timestamp=$r->fetch()["latest"];
            $r=$pdo->query(
                "SELECT B.name as servername,B.status AS flag,B.url AS url,A.details AS serverinfo,A.status AS status,B.details AS resultinfo ".
                "FROM server_ids  AS B ".
                "LEFT OUTER JOIN (SELECT * FROM activity_log WHERE timestamp=$timestamp) AS A ON A.sid=B.id;");
            $l=$r->fetchAll();
            unset($pdo);
            $ret_array=array(
                "success"=>"true",
                "result"=>array("list"=>$l,"timestamp"=>$timestamp));
        } catch (Exception $e) {
            $ret_array=array(
                "success"=>false,
                "error"=>$e->__toString()
            );
        }
        $l=&$ret_array["result"]["list"];
        for($i=0;$i<count($l);$i++){
            if($l[$i]["status"]==null){
                $l[$i]["status"]="NODATA";
                $l[$i]["resultinfo"]="";
            }

        }
        $ret_array["created_time"]=$time*1000;
        $ret_array["version"]=$this->version;
        return $ret_array;
    }
    private function ids()
    {
        $this->checkPermission();
        $ret_array=null;
        // 接続
        $pdo = new PDO('sqlite:'.$this->dbfile);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        // デフォルトのフェッチモードを連想配列形式に設定 
        // (毎回PDO::FETCH_ASSOCを指定する必要が無くなる)
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        #ActivityLogの最新時刻を得る
        $r=$pdo->query("SELECT * FROM server_ids");
        $l=$r->fetchAll();
        unset($pdo);
        #idをunset
        $ret_array=array(
            "success"=>"true",
            "result"=>array("list"=>$l));

        return $ret_array;
    }
    private function push_activity()
    {
        $time=time();
        $this->checkPermission();
        //[url,status,description]
        $json=json_decode(file_get_contents('php://input'));
        if(empty($json) || !property_exists($json,"payload") || !property_exists($json->payload,"list")){
            throw new Exception("Invalid Json.");
        }

        // 接続
        $pdo = new PDO('sqlite:'.$this->dbfile);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        //idsテーブルを得る
        $r=$pdo->query("SELECT * FROM server_ids");
        $ids=$r->fetchAll();
        //idごとのステータスを書き込む。無いときは書き込まない。
        $retnumber=0;
        foreach($ids as $i){
            $l=$json->payload->list;
            foreach($l as $j){
                if($j[0]!=$i["url"]){
                    continue;
                }
                $stmt = $pdo->prepare("INSERT INTO activity_log (sid,timestamp,status,details) VALUES(?,?,?,?)");
                $stmt->bindValue(1,$i["id"]);
                $stmt->bindValue(2,$time*1000);
                $stmt->bindValue(3,$j[1]);
                $stmt->bindValue(4,$j[2]);
                $stmt->execute();
                $retnumber++;
                break;
            }
        }
        unset($pdo);
        #idをunset
        return array(
            "success"=>"true",
            "result"=>array("add"=>($retnumber)."/".count($ids)));
    }
    public function run()
    {
        header('Content-Type: application/json');
        header('Access-Control-Allow-Origin:*');
        $r=null;
        try {
            switch(isset($_GET['c'])?$_GET['c']:""){
            case 'ids':
                $r=($this->ids());
                break;
            case 'push_activity':
                $r=($this->push_activity());
                break;            
            default:
                $r=($this->makeLatestJson());
                break;
            }
        } catch (Exception $e) {
            $r=array(
                "success"=>false,
                "error"=>$e->__toString()
            );
        }
        print(json_encode($r,JSON_UNESCAPED_SLASHES | (JSON_NUMERIC_CHECK)|JSON_PRETTY_PRINT));
    }
};



?>
