# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


## 2026-11-13 TOPIX修正

本番 `/api/market` でTOPIXが `source: none` になることと、Stooq `^tpx` のCSV取得先がHTTP 404を返すことを確認した。TOPIXはJPX公式ページ
https://www.jpx.co.jp/markets/indices/realvalues/
が参照する公開JSON（`/market/indices/indices_stock_price3.txt`）の `Topix.Topix` に切り替えた。APIキー・追加費用は不要。ETFや配当込み指数で代用しない。JPXの `previousDayRatio` は前日終値比（他のStooq指標の始値比とは異なる）。JPXの公表値でありリアルタイム配信の保証はしない。

取得失敗時は各行の `errors: [{source, reason}]` とサーバーログに理由を残す。成功した代替先があっても先行失敗の理由を残す。TOPIXでは誤銘柄の恐れがあるYahoo/Twelve Dataへ切り替えない。既存の配列レスポンスを維持する。

検証: `node --test tests/market.test.mjs`（3件）、`npm run lint`、`npm run build`。
既存lint不備に対し、API/テストのNodeグローバル設定、未使用変数削除、記事IDに基づくメモ状態の再初期化を行った。初回API購読開始の2箇所は理由付きでReactの同期setState規則を局所除外した。

未確認: Vercel反映後のEdge環境での公式データ取得、AI要約・ウォッチリスト・通知の実機動作。通知設定とテスト通知は実装があるが、継続的なプッシュ配信を確認したものではない。
依存関係インストール時のnpm auditは13件（low 1 / moderate 2 / high 10）を報告。今回依存更新は行っていない。
