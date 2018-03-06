
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
from web3 import Web3, HTTPProvider, IPCProvider

DB_PATH="../db/pubnodelog.db"
def run(conn):

    print("Start discovery process.")
    timestamp=time.time()*1000  #ms単位の現在時刻
    print("timestamp %d."%timestamp)
    #idsから有効な行を得る
    ids=ServerIdsTable(conn)
    fds=ids.getAll()
    
    log=ActivityLogTable(conn)
    #検索
    for i in fds:
        if i[3]!=ServerIdsTable.STATUS_ENABLE :
            continue
        print("Connect to %s %s."%(i[2],i[1]),end="")
        web3= Web3(HTTPProvider(i[1]))
        try:
            #登録
            log.add(i[0],timestamp,web3.version.node,"ONLINE")
            print("ONLINE")
        except IOError as e:
            log.add(i[0],timestamp,"","OFFLINE")
            print("OFFLINE")
            continue
    print("Done.")




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
        else:
            raise Exception("Invalid arg[1]")
    finally:
        c.close()


if __name__ == '__main__':
    main()

