
"""
    コマンド
    add <url> <name> <discription>
    ids
    log
    latest
    run
"""
import time
from datetime import datetime
import sys
import sqlite3
from pprint import pprint
from rlpxdiscover import * 
from db_activity import * 
import requests
import json
from web3 import Web3, HTTPProvider, IPCProvider

DB_PATH="../db/pubnodelog.db"
def makeList(fds,conn):
    print("Start discovery process.")
    timestamp=time.time()*1000  #ms単位の現在時刻
    print("timestamp %d."%timestamp)
    l=[]
    #検索
    for i in fds:
        if i[3]!=ServerIdsTable.STATUS_ENABLE :
            continue
        print("Connect to %s %s."%(i[2],i[1]),end="")
        web3= Web3(HTTPProvider(i[1]))
        try:
            #登録
            l.append((i[0],timestamp,"ONLINE",web3.version.node,i[1]))
            print("ONLINE")
        except IOError as e:
            l.append((i[0],timestamp,"OFFLINE","",i[1]))
            print("OFFLINE")
            continue
    print("Done.")
    return l    
def run(conn):
    ids=ServerIdsTable(conn)
    log=ActivityLogTable(conn)
    for i in makeList(ids.getAll(),conn):
        log.add(i[0],i[1],i[2],i[3])
def remote(conn,api_path):
    ids_json=requests.get("%s?c=ids"%(api_path)).json()
    fds=[(i["id"],i["url"],i["name"],i["status"],i["details"]) for i in ids_json["result"]["list"]]
    l=[]
    for i in makeList(fds,conn):
        l.append((i[4],i[2],i[3]))
    d=json.dumps({"payload":{"list":l}})
    r=requests.post("%s?c=push_activity"%(api_path),data=d)
    print(r.text)



def main():
    a=sys.argv[1]
    c = sqlite3.connect(DB_PATH)
    try:
        if a=="add":
            ids=ServerIdsTable(c)
            ids.add(sys.argv[2],sys.argv[3],details=sys.argv[4])
        elif a=="ids":
            ids=ServerIdsTable(c)
            pprint(ids.getAll())
        elif a=="log":
            act=ActivityLogTable(c)
            pprint(act.getAll())
        elif a=="run":
            run(c)
        elif a=="remote":
            remote(c,sys.argv[2])            
        else:
            raise Exception("Invalid arg[1]")
    finally:
        c.close()


if __name__ == '__main__':
    main()

