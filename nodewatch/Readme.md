NodeWatch


NodeWatchはNekoniumのノードを監視するウェブアプリケーションです。Rlpx(Ethereumの)ノード探索プロトコル、またはJSONRPCを使ってノードの死活状態を監視できます。

アプリケーションは、データベースを作成、更新するPythonスクリプトと、データベースの情報をRESTAPIで出力するPHPスクリプトでできています。
PythonスクリプトとPHPスクリプトを別のサーバーで動して連携することができます。


## セットアップ

### Python
Python3.6が必要です。必要なモジュールをインストールします。
~~~~
#pip3 install web3 
#pip3 install requests
#pip3 install secp256k1 
#pip3 install urlparse
#pip3 install pysha3
#pip3 install rlp
~~~~
web3がsha関連のエラーを出すときは、sha3をuninstallしてください。

### Php
PHP7位が必要です。
sslとsqlite3を使います。php.iniを編集して有効化してください。

##使い方

定期的にサーバ状態を更新するためには、cronなどでrunコマンドを定期実行してください。

###PublicNode
JSONRPCを有効にしたnekoniumノードを監視することができます。結果はdb/pubnodelog.dbに保存します。

監視リストにサーバーを追加
~~~~
$ python3 add https://127.0.0.1:8080/ NekoniumPublicNode#1 ノード説明の詳細
~~~~

idsテーブルの確認
~~~~
$ python3 app.cron.pubnode.py ids
[(6, 'http://127.0.0.1/', 'NekoniumPublicNode#1', 1, 'ノード説明の詳細')]
~~~~

サーバー状態を確認
~~~~
$ python3 app.cron.pubnode.py run
Start discovery process.
timestamp 1520491255662.
Connect to NekoniumPublicNode#1 http://127.0.0.1/.OFFLINE
Done.
~~~~

### Rlpx
Nekoniumノードを監視することができます。結果はdb/rlpxd.dbに保存します。
外部へUDP通信を行います。一部のVPSでは許可がありませんので、その場合はリモート更新を使ってください。

監視リストにEthereumノードを追加
~~~~
$ python3 app.cron.rlpxd.py add enode://120.0.0.1:28568 localnode ローカルノード
Add :  enode://120.0.0.1:28568
~~~~

idsテーブルの確認
~~~~
$ python3 app.cron.rlpxd.py ids
[(12, 'enode://120.0.0.1:28568', 'localnode', 1, 'ローカルノード')]
~~~~

サーバー状態を確認
~~~~
$ python3 app.cron.rlpxd.py run
Start discovery process.
timestamp 1520494641241.
Send PingPacket to localnode 120.0.0.1:28568.
Wait 5 seconds.
received message[ ('150.95.148.243', 28568) ]
received message[ ('150.95.148.243', 28568) ]
Recrived 2 packets.
AIIII
Done.
~~~~



### RESTAPIとサマリ

+ PublicNodeの状態をjsonで得る - app.pubnode-status.php
+ Rlpxの応答状態をjsonで得る - app.rlpx-status.php
+ RlpxとPublicNodeの簡易表示ページ -summary.html

RESTAPIが返すのは、最後に更新したサーバ状態のリストです。

## リモート更新

UDP通信許可していないサーバでAPIを公開するときに、外部からデータベースを更新する機能です。
次のようにremoteコマンドを使います。

rlpxdの例
~~~~
$ python3 app.cron.rlpxd.py remote <app.pubnode-status.php RESTAPIのURL>
~~~~
RESTAPIのURLは、たとえばhttp://127.0.0.1/app.pubnode-status.phpを指定します。
接続先のnodewatchのapp.pubnode-status.phpを編集して、次のようにPermissionリストに接続元のIPアドレスを加えてください。
~~~~
$app->setPermission(["127.0.0.1","your ip address"]);
~~~~