# PICS Viewer — PWA版

高度化PICS（歩行者等支援情報通信システム）のBLEアドバタイズを受信して歩行者信号を表示するPWAです。
元の yumu19/ble-pics-viewer（MIT）の解析仕様を移植しました。

## 解析仕様（元リポジトリと同一）
- メーカーID: 0x01CE の manufacturerData のみ対象
- Type 0: 交差点識別名称（bytes 10-23）
- Type 1: 緯度・経度（big-endian int32 / 1,000,000）
- Type 2: 歩行者信号 最大6灯（下位4bit: 0 NoSignal/1 Red/2 BlinkGreen/3 Green/4 None、上位4bit: 残り値、>=8は不明）
- 信号1=東西、信号2=南北（元実装に合わせた表記。実際の方角は設置場所依存）

## 重要: iPhoneではPWAで実機受信できません
iOS Safari / iOS Chrome はどちらも WebKit で、Web Bluetooth API がありません。
ホーム画面に追加したPWAでも同じです。インストールはできますが、BLEスキャンは動きません。

実機受信できる環境:
- Android Chrome / Windows・Mac Chrome: `chrome://flags/#enable-experimental-web-platform-features` を有効化すると requestLEScan / watchAdvertisements が使える場合がある（元のweb版と同じ条件）
- iPhoneでどうしてもブラウザで受信したい場合: Web Bluetooth対応ブラウザ Bluefy でこのURLを開く（PWAインストールとは別物になります）
- iPhoneで確実に受信したい場合: ネイティブ版（先に作ったSwift版をPICS専用に寄せる）が必要です

iPhoneでもデモモードは動きます（画面確認用）。

## 動かし方（HTTPSが必須）
PWA / Web Bluetooth は HTTPS か localhost でしか動きません。

ローカル確認:
```
python3 -m http.server 8000 --bind 127.0.0.1 --directory .
# http://localhost:8000 を開く
```

公開するなら: このフォルダの中身を GitHub Pages / Vercel / Cloudflare Pages / Netlify Drop にそのまま置くだけ（ビルド不要）。

PWAとして入れる:
- Android Chrome: メニュー → アプリをインストール
- iPhone Safari: 共有 → ホーム画面に追加（ただし上記の通り実機受信は不可、デモ専用）

## ファイル
- index.html — 画面＋スキャン制御＋PWA登録
- pics.mjs — PICS解析（Nodeでテスト済み: デモパケットで Type0/1/2 を正しく復号）
- manifest.webmanifest / sw.js / icons/ — PWA一式

## Bluefyで使う場合（iPhone・v2で対応）
1. App Storeで「Bluefy – Web BLE Browser」（無料）を入れる
2. Bluefyの設定で「Enable BLE Advertisements」をONにして、Bluefyを完全終了→再起動
   - これをONにしないと watchAdvertisements が動きません
3. iPhoneの Bluetooth をON、BluefyへのBluetooth許可をON
4. このPWAをHTTPSのURLで Bluefy で開く（httpやファイル直開きでは動きません）
   - Bluefyで開くと自動で受信方式が「Bluefy」になります
5. 「スキャン開始」→ 選択画面が出たら信号機らしき機器／不明なデバイスを選ぶ
   - v2ではBluefy向けにメーカーIDフィルタを使いません（Bluefyではフィルタを付けると何も一致しません）。
     代わりに acceptAllDevices + optionalManufacturerData:[0x01CE] で受けて、画面側で 0x01CE だけ解析します
   - 画面下に「全○件 / PICS ○件」が出ます。全件が増えるのにPICSが0件なら、その機器はPICSではありません
6. 注意: BluefyではPWAのホーム画面インストール／Service WorkerはSafariと別扱いです。「Bluefyの中で開くWebアプリ」として使うのが前提です
