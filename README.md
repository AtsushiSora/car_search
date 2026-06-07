# おまかせカーサーチ ホームページ

車探し相談・販売向けの静的ホームページです。

## 開き方

`index.html` をブラウザで開くと表示できます。

## 変更しやすい場所

- 店舗名: `index.html` の `おまかせカーサーチ`
- 電話番号: `index.html` の `03-1234-5678` と `tel:0312345678`
- 送信先メール: `script.js` の `ownerEmail`
- ビジネスLINE: `script.js` の `lineUrl`
- ビジネスLINE通知Webhook: `script.js` の `lineWebhookEndpoint`
- フォーム送信先: `script.js` の `formEndpoint`
- ヒーロー画像: `assets/hero-car-consultation.png`

## フォームについて

現在は静的サイトとして、送信後に内容確認の画面を表示し、メール下書きを作成できる形です。

相談方法は、電話・メール・ビジネスLINEの3パターンを表示しています。
電話番号は `index.html` の表示番号と `tel:` リンクを差し替えてください。

## 動的機能

- ご提案例を条件別に絞り込み
- フォーム入力内容のライブ表示
- 入力済み項目の進捗表示
- 相談方法に合わせた案内文と送信ボタン文言の切り替え
- Netlify設定前の内容確認モーダル、メール下書き、LINE相談導線

## 掲載内容

- 車探しから納車までの対応内容
- サービスの流れ
- ご提案例
- 在庫車両
- 電話・メール・ビジネスLINEの相談方法
- 無料相談フォーム
- よくある質問

実際にメールで自動受信したい場合は、フォームサービスが発行する送信先URLを `script.js` の `formEndpoint` に設定してください。
ビジネスLINEへ自動通知したい場合は、LINE Messaging APIなどを扱うサーバー側Webhook URLを `lineWebhookEndpoint` に設定してください。

```js
const ownerEmail = "あなたのメールアドレス";
const lineUrl = "LINE公式アカウントの友だち追加URL";
const lineWebhookEndpoint = "ビジネスLINE通知用Webhook URL";
const formEndpoint = "フォームサービスの送信先URL";
```

`formEndpoint` を設定すると、フォーム送信時に入力内容をそのURLへPOSTします。
`lineWebhookEndpoint` を設定すると、フォーム送信時に入力内容をJSONでPOSTします。
未設定の場合は、メール下書き作成ボタンで内容を送れるようにしています。

LINEのチャネルアクセストークンなどの秘密情報は、`script.js` に直接書かないでください。
GitHub Pagesのような静的サイトでは誰でも中身を見られるため、秘密情報は必ずサーバー側Webhookに置きます。
