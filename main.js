class IKSGadget {

    constructor(){
        this.approval = false;
        this.userInfo = {};
        this.userToken = {};
    }

    // 利用条件を調べる
    async check(){
        this.approval = confirm( "このツールでは駅メモ! Our-Rails利用規約に抵触する行為を行います\nツールの実行を開始してもよろしいですか" );
        this.userInfo = await this.getUserInfo();
        this.userToken = this.getCSRFToken();

        return 0;
    }

    // main
    async main(){
        if ( this.approval !== true || !this.userInfo.contents.owner.platform.id.length || !this.userToken.length ){
            alert( "利用条件を満たしていません。" );
            return -1;
        }

        //TODO : 実行する内容を選択できるように
    }

    /*
     * 内部用関数
     */

    // fetch
    ourFetch(uri, subParams){
        const baseParams = {
            credentials : 'include',
            headers : {
                'x-csrf-token' : getCSRFToken(),
                'x-requested-with' : 'XMLHttpRequest',
                'Content-Type' : 'application/json'
            }
        };
        const params = mergeDeeply(baseParams, subParams);
        return fetch(uri, params)
    }

    // アカウントトークン取得
    getCSRFToken(){
        let csrf_token = "";
        document.cookie.split(';').forEach((v)=>{
            if (v.match(/csrf_token=/)){
                csrf_token = v.match(/csrf_token=/)['input'].split('=')[1];
            }
        });
        return csrf_token;
    }

    // ユーザ情報取得
    getUserInfo(){
        const time = (new Date()).getTime();
        const uri = "https://game.our-rails.ekimemo.com/api/bundled/prefetch?__t" + time;
        return this.ourFetch(uri, { method:'GET' }).then(res=>res.json());
    }

}


function mergeDeeply(target, source, opts) {
    const isObject = obj => obj && typeof obj === 'object' && !Array.isArray(obj);
    const isConcatArray = opts && opts.concatArray;
    let result = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
        for (const [sourceKey, sourceValue] of Object.entries(source)) {
            const targetValue = target[sourceKey];
            if (isConcatArray && Array.isArray(sourceValue) && Array.isArray(targetValue)) {
                result[sourceKey] = targetValue.concat(...sourceValue);
            }
            else if (isObject(sourceValue) && target.hasOwnProperty(sourceKey)) {
                result[sourceKey] = mergeDeeply(targetValue, sourceValue, opts);
            }
            else {
                Object.assign(result, {[sourceKey]: sourceValue});
            }
        }
    }
    return result;
}
