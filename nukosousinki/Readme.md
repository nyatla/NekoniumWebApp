# ぬこ送信機

ぬこ送信機は、Nekoniumの内部通貨NUKOを一括送信するためのDAppsユーザーインタフェイスです。登録したアカウントに向けて、NUKOを送信することができます。
動作にはNukoMaskなどのNekonium用Web3プロバイダ付きのブラウザが必要です。

クライアントアプリケーションです。Web3プロバイダ以外のサーバープログラムなどは不要です。
webpack/web3/React4の練習用に作ったものですので、品質についてはお察しください。

## 使い方
1. NuKoMaskが使えるブラウザで、http://nekonium.org/nukosousinki/を開きます。
2. To: Addressの列に送信先のアドレスを入力します。
3. Amount(NUKO)列にそのアカウントへの送信量を入力します。
4. ２つの項目が正しく入力されると、ACTION列のボタンが押せるようになります。
5. ボタンを押下すると、NukoMaskに送信情報が転送されます。NukoMaskで取引を認証してください。
6. +ボタンを押すと、もう一行追加ができます。

+ SetAmountsは、設定値をすべての未送信アイテムに一括設定します。
+ Resetは、アプリケーションを初期状態に戻します。
+ SendAllは送信可能状態にあるすべてのアイテムをSendします。
+ 漢字変換が有効だと入力できません！


## Development

nodeJS,Webpack4,React4,Less,Web3を使います。npmで適切にセットアップしておいてください。

### deploy
```
npm run build
```

debug
```
npm run webpack-dev-server
```
Open http;//localhost:3000 with your browser.



## ライセンス

MITライセンスとします。

### デモ
http://nekonium.org/nukosousinki/index.html

