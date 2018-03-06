
"""
    EthereumNodeのRlpx探索ログ生成スクリプト。
    Idsにあるサーバーに探索パケットを投げて、応答のあったサーバーの情報を記録します。
    コマンド
    add <url> <name> <discription>
        サーバーリストに登録する
        urlは、"(http|https)://<host>:<port>"
    ids
        サーバーリストの一覧を返す
    log
        ログの一覧を返す
    latest
    run <pk>
"""
import time
from datetime import datetime
import sys
import sqlite3
from pprint import pprint
from secp256k1 import PrivateKey
from rlpxdiscover import * 
from db_activity import * 
from urllib.parse import urlparse

#CONFIG
CONFIG_DB_PATH="../db/rlpxd.db"


def run(conn,pk):

    print("Start discovery process.")
    timestamp=time.time()*1000  #ms単位の現在時刻
    print("timestamp %d."%timestamp)
    #idsから有効な行を得る
    ids=ServerIdsTable(conn)
    fds=ids.getAll()

    #検索
    priv_key = PrivateKey()
    priv_key.deserialize(pk)
    rlpxd=RLPxDiscovery(priv_key)
    rlpxd.listen()
    for i in fds:
        if i[3]!=ServerIdsTable.STATUS_ENABLE :
            continue
        ipport=urlparse(i[1])
        print("Send PingPacket to %s %s:%d."%(i[2],ipport.hostname,ipport.port))
        rlpxd.sendPing(ipport.hostname,ipport.port)
    print("Wait 5 seconds.")
    time.sleep(5)
    r=rlpxd.close()
    print("Recrived %d packets."%(len(r)))


    def toMsg(info):
        return "enode://%s:%d %s"%(info["addr"],info["port"],datetime.fromtimestamp(info["packet"]["payload"].timestamp).strftime("%Y/%m/%d:%H%M%S"))
    log=ActivityLogTable(conn)
    for i in fds:
        if i[3]!=ServerIdsTable.STATUS_ENABLE :
            continue
        #PONG受信した?
        msg=""
        status="OFFLINE"
        for j in r:
            #PONGのみを対象にする
            if j["packet"]["packet_type"]!=PongPayload.PACKET_TYPE:
                #不明なパケットタイプ
                print("I", end="")
                continue
            print("A", end="")
            msg=toMsg(j)
            status="ONLINE"
            break
        log.add(i[0],timestamp,status,msg)
    print()
    print("Done.")

def main():
    a=sys.argv[1]
    c = sqlite3.connect(CONFIG_DB_PATH)
    try:
        if a=="add":
            ids=ServerIdsTable(c)
            url=urlparse(sys.argv[2])
            url=url if url.scheme!="" else urlparse("enode://"+sys.argv[2])
            port=28568 if (url.port is None) else url.port    
            print("Add:enode://",url.hostname,":",port)
            ids.add("enode://%s:%d"%(url.hostname,port),sys.argv[3],details=sys.argv[4])
        elif a=="ids":
            ids=ServerIdsTable(c)
            pprint(ids.getAll())
        elif a=="log":
            act=ActivityLogTable(c)
            pprint(act.getAll())
        elif a=="run":
            pk="0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF"
            if len(sys.argv)>2:
                pk=sys.argv[2]
            run(c,pk)
        else:
            raise Exception("Invalid arg[1]")
    finally:
        c.close()


if __name__ == '__main__':
    main()

