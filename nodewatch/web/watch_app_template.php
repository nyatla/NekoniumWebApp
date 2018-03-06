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
    function __construct($version="JsonExportApp/1.0",$a_db_file="log.sqlite3")
    {
        $this->version=$version;
        $this->dbfile=$a_db_file;
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
                "SELECT B.name as servername,B.status AS flag,A.details AS status,A.status AS resultinfo,B.details AS serverinfo ".
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
        return json_encode($ret_array,JSON_UNESCAPED_SLASHES | (JSON_NUMERIC_CHECK)|JSON_PRETTY_PRINT);
    }
    public function run()
    {
        header('Content-Type: application/json');
        header('Access-Control-Allow-Origin:*');
        print($this->makeLatestJson());
    }
};



?>
