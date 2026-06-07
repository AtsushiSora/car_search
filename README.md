# おまかせカーサーチ ホームページ

車探し相談・販売向けの静的ホームページです。

## 開き方

`index.html` をブラウザで開くと表示できます。

## 変更しやすい場所

- 店舗名: `index.html` の `おまかせカーサーチ`
- 電話番号: `index.html` の `03-1234-5678` と `tel:0312345678`
- 送信先メール: `script.js` の `ownerEmail`
- ビジネスLINE: `script.js` の `lineUrl`
- フォーム送信先: `script.js` の `formEndpoint`
- ヒーロー画像: `assets/hero-car-consultation.png`

## フォームについて

現在は静的サイトとして、送信後に内容確認の画面を表示し、メール下書きを作成できる形です。

実際にメールで自動受信したい場合は、フォームサービスが発行する送信先URLを `script.js` の `formEndpoint` に設定してください。

```js
const ownerEmail = "あなたのメールアドレス";
const lineUrl = "LINE公式アカウントの友だち追加URL";
const formEndpoint = "フォームサービスの送信先URL";
```

`formEndpoint` を設定すると、フォーム送信時に入力内容をそのURLへPOSTします。
未設定の場合は、メール下書き作成ボタンで内容を送れるようにしています。
