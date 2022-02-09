# IKS.gadget
「駅メモ! Our-Rails」を操作するライブラリ

## 使い方
- import後、コンストラクタを呼び出し`IKS.agreement()`関数を呼び出す。
```js
(await ()=>{
    const module = await import([path to this lib]);
    const IKS = new module.IKSGadget();

    IKS.agreement();
})();
```

## methods
### getUserInfo()
ユーザ情報を取得する

### checkin( coord, dencoh )
チェックインを実行する
`coord` : `{ lat: <Number>, lng: <Number> }`でチェックインする座標を渡す。  
`dencoh` : チェックインするでんこの名前を文字列で渡す。編成外のでんこを指定すると500エラーとなる。  

### fullRecovery( denoh )
HPを全回復する
`dencoh` : HP回復するでんこの名前を文字列で渡す。編成外のでんこを指定すると500エラーとなる。  

### getFormation()
編成を取得する

### setFormation( formation )
編成を変更する
`formation` : `getFormation`で得られる形式の配列

### pullLottery()
ふくびきを1回引く
