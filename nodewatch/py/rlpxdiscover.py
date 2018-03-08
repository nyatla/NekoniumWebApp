# -*- coding:utf-8 -*-
"""
 Copyright 2018 nyatla
 nyatla@gmail.com

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is 
 furnished to do so, subject to the following conditions:
 The above copyright notice and this permission notice shall be included in 
 all copies or substantial portions of the Software.
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 --------------------------------------------------------------------------------

 Ethereum RLPx discovryプロトコルのPython実装

 + Ping/Pongのみテスト済
 + 仕様 https://github.com/ethereum/devp2p/blob/master/rlpx.md#introduction

"""


import socket
import threading
import time
import struct
import rlp
import _pysha3 
from secp256k1 import PrivateKey
from ipaddress import ip_address


class Addr(object):
    def __init__(self, i_address, i_udpPort, i_tcpPort=None):
        self.address = ip_address(i_address)
        self.udpPort = i_udpPort
        self.tcpPort = i_tcpPort
    # Addrのバイナリ
    def pack(self):
        return [ \
        self.address.packed, \
        struct.pack(">H", self.udpPort), \
        "" if (self.tcpPort is None) else struct.pack(">H", self.tcpPort)]
        
class PingPayload(object):
    PACKET_TYPE=1
    version=None
    addr_from=None
    addr_to=None
    timestamp=None
    def __init__(self,addr_from,addr_to,timestamp=(int)(time.time()) + 60,version=3):
        self.version=version
        self.addr_from=addr_from
        self.addr_to=addr_to
        self.timestamp=timestamp
        return
    def payload(self):
        s=  [ chr(self.version).encode(), \
            self.addr_from.pack(), \
            self.addr_to.pack(), \
            struct.pack(">I",self.timestamp)]
        return chr(PingPayload.PACKET_TYPE).encode()+rlp.encode(s)        

class PongPayload:
    PACKET_TYPE=2
    addr_to=None
    echo=None
    timestamp=None
    def __init__(self, addr_to, echo,timestamp=(int)(time.time()) + 60):
        self.addr_to=addr_to
        self.echo=echo
        self.timestamp=timestamp

class FindNeighbours:
    PACKET_TYPE=3
    timestamp=None
    node_id=None
    def __init__(self,node_id,timestamp=(int)(time.time()) + 60):
        self.timestamp=timestamp
        self.node_id=node_id
    def payload(self):
        s=  [ \
            self.node_id, \
            struct.pack(">I",self.timestamp)]
        return chr(FindNeighbours.PACKET_TYPE).encode()+rlp.encode(s)        
        
class Neighbours:
    PACKET_TYPE=4
    timestamp=None
    nodes=None
    def __init__(self,nodes=[],timestamp=(int)(time.time()) + 60):
        self.timestamp=timestamp
        self.nodes=nodes
    
class RLPxPacket:
    # make packet from data
    @classmethod
    def pack(cls,pkey,payload):
        def _keccak256(s):
            k = _pysha3.keccak_256()
            k.update(s)
            return k.digest()
        def _sign(payload):
            sig = pkey.ecdsa_sign_recoverable(_keccak256(payload), raw = True)
            sig_serialized = pkey.ecdsa_recoverable_serialize(sig)
            return sig_serialized[0] + chr(sig_serialized[1]).encode()
        data=payload.payload()
        data=_sign(data)+data
        data=_keccak256(data)+data
        return data
    @classmethod
    def unpack(cls,packet):
        r={}
        l=len(packet)
        r["hash"]=packet[0:32]                 # hash
        r["signature"]=packet[32:32+65]        # signature
        packet_type=r["packet_type"]=struct.unpack("B",packet[32+65:32+65+1])[0] # packet-type
        payload=rlp.decode(packet[32+65+1:]) #struct
        if packet_type==PingPayload.PACKET_TYPE:
            #アドレスのパースさぼってるから必要になったらやって。
            r["payload"]=PingPayload( \
                payload[1], \
                payload[2], \
                struct.unpack("I",payload[3])[0], \
                struct.unpack("B",payload[0])[0] \
            )
        elif packet_type==PongPayload.PACKET_TYPE:
            r["payload"]=PongPayload( \
                payload[0], \
                payload[1], \
                struct.unpack("I",payload[2])[0] \
            )
        elif packet_type==0x03:
            r=None
        elif packet_type==0x04:
            r=None
        else:
            raise Exception("Unknown packet type")
        return r

class RLPxDiscovery(object):
    _response=None
    def __init__(self, p_key,my_addr=u"0000::",my_port=28568):
        self.pkey=p_key
        self.my_addr = Addr(my_addr, my_port, my_port)
        self.th_join=None
        self.th=None
        self.result=[]
    def listen(self):
        def receive_ping():
            while not self.th_join.is_set():
                try:
                    data, addr = self.sock.recvfrom(1024)
                    print("received message[", addr, "]")
                    try:
                        self._response.append({"addr":addr[0],"port":addr[1],"packet":RLPxPacket.unpack(data)})
                    except:
                        print("Parse Error from ",addr," '",data,"'")
                except socket.timeout as msg:
                    continue
        if self.th is not None:
            raise Exception()
        self._response=[]
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.sock.settimeout(3)
        self.sock.bind(('0.0.0.0', self.my_addr.udpPort))
        self.th_join=threading.Event()
        self.th=threading.Thread(target = receive_ping)
        self.th.start()
        return
    def sendPing(self,addr,port):
        ip_to = Addr(addr,port,None)
        ping=PingPayload(self.my_addr,ip_to,version=4)
        d=self.sock.sendto(RLPxPacket.pack(self.pkey,ping), (ip_to.address.exploded, ip_to.udpPort))
    def sendFindNeighbours(self,addr,port):
        fn=FindNeighbours("")
        d=self.sock.sendto(RLPxPacket.pack(self.pkey,fn), (ip_address(addr).exploded,port))
    def close(self):
        if self.th is None:
            return
        self.th_join.set()
        self.th.join()
        self.th=None
        self.sock.close()
        self.sock=None
        return self._response

# # テスト
# # データの収集
# priv_key = PrivateKey()
# priv_key.deserialize("50868ff38b05f30d710b23123ea2af59cc087a10e721b0e6331a7bc8d014014e")
# dn=RLPxDiscovery(priv_key)
# dn.listen()
# dn.sendPing("192.168.128.195",28568)
# time.sleep(3)
# l=dn.close()
# print(l)
# #分析
