

# add <node>
# 監視リストにノードを追加する
# remove <id>
# getAll
# 監視リストの中身を表示する
# setStatus <id>
# 監視対象を有効化する
# disable <id>


import sqlite3
from contextlib import contextmanager

"""
    サーバーアドレスを格納するテーブル
    |id|name|url|status|details|
    url
        サーバーアドレス
    port
    status データの状態
        DISABLE 無効なデータ
        ENABLE  有効なデータ
"""
class ServerIdsTable:
    TABLE_NAME="server_ids"
    STATUS_DISABLE=0
    STATUS_ENABLE =1
    def __init__(self,conn,name=TABLE_NAME):
        self._name=name
        self._conn=conn
        sql = '''
            CREATE TABLE IF NOT EXISTS %s(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                url TEXT UNIQUE,
                name TEXT,
                status INTEGER,
                details TEXT)'''%(self._name)
        try:
            c = self._conn.cursor()
            c.execute(sql)
        finally:
            c.close()
        return
    def add(self,url,name,status=STATUS_ENABLE,details=None):
        c = self._conn.cursor()
        sql = '''INSERT INTO %s (url,name,status,details) VALUES(?,?,?,?)'''%(self._name)
        try:
            c.execute(sql,(url,name,status,details))
            c.execute("select last_insert_rowid()")
            r=c.fetchone()[0]
            self._conn.commit()
            return r
        except Exception:
            return None
        finally:
            c.close()
    def getAll(self):
        c = self._conn.cursor()
        try:
            sql = '''SELECT * FROM %s'''%(self._name)
            c.execute(sql)
            r=c.fetchall()
        finally:
            c.close()
        return r
    def setStatus(self,id,flag):
        c = self._conn.cursor()
        try:
            sql = '''UPDATE %s SET status=? WHERE id=?'''%(self._name)
            c.execute(sql,(flag,id))
            self._conn.commit()
        finally:
            c.close()
        return

"""
    アクティビティログを格納するテーブル
    id
    sid         ServerIdsTableのid
    timestamp
    status      自由テキスト。サーバーの状態を示すenum値
    details     自由テキスト
"""
class ActivityLogTable:
    def __init__(self,conn,name="activity_log"):
        self._name=name
        self._conn=conn
        sql = '''
            CREATE TABLE IF NOT EXISTS %s(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sid INTEGER,
                timestamp INTEGER,
                status TEXT,
                details TEXT,UNIQUE(sid,timestamp))'''%(self._name)
        try:
            c = self._conn.cursor()
            c.execute(sql)
        finally:
            c.close()
        return
    def add(self,sid,timestamp,status="",details=None):
        c = self._conn.cursor()
        sql = '''INSERT INTO %s (sid,timestamp,status,details) VALUES(?,?,?,?)'''%(self._name)
        try:
            c.execute(sql,(sid,int(timestamp),status,details))
            c.execute("select last_insert_rowid()")
            r=c.fetchone()[0]
            self._conn.commit()
            return r
        except Exception:
            return None
        finally:
            c.close()
    def getAll(self):
        c = self._conn.cursor()
        try:
            sql = '''SELECT * FROM %s'''%(self._name)
            c.execute(sql)
            r=c.fetchall()
        finally:
            c.close()
        return r


