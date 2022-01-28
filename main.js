class IKSGadget {

    constructor(){
        this.approval = false;
        this.userInfo = {};
        this.userToken = {};
        this.form = ["naru", "luna", "subaru", "mei", "nagisa"]; // TODO:編成はAPIで取得する
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

        await this.check();
        if ( this.approval !== true || !this.userInfo.contents.owner.platform.id.length || !this.userToken.length ){
            alert( "利用条件を満たしていません。" );
            return -1;
        }

        // 東京駅を起点に近い駅にアクセスしていく
        let point = {lng: 139.766103, lat: 35.681391};

        const list = await fetch("https://raw.githubusercontent.com/IKS-org/IKS.gadget/develop/coords.json?token=GHSAT0AAAAAABQK5Q3BTOMMBIKLOJNNDXW6YP5KVEA").then(r=>r.json());
        const coords = list.map((e)=>{ return e.coord });

        const max = coords.length;
        for( let i=0; i<max; i++ ){
            let res = searchNearestPoint( point, coords, list );
            console.log(res);
            for(let j=0;j<coords.length;j++){
                if(coords[j].lat == res.lat && coords[j].lng == res.lng){
                    coords.splice(j, 1)
                }
            }
            //駅名表示
            list.forEach((s)=>{
                if(s.coord.lat == res.lat && s.coord.lng == res.lng){
                    console.log(s);
                }
            })
            point.lng = res.lng;
            point.lat = res.lat;

            // checkin
            let cInRes = null;
            do{
                cInRes = await this.checkin({lat:res.lat, lng:res.lng}, this.form[Math.floor(Math.random() * 5)]); //TODO:編成数に応じて乱数の幅を変更する
                await this.delay(res.distance*3000);
            }while(!cInRes.contents)
        }
    }

    /*
     * 内部用関数
     */
    delay(n){
        return new Promise(function(resolve){
            setTimeout(resolve,n*1000);
        });
    }

    // fetch
    ourFetch(uri, subParams){
        const baseParams = {
            credentials : 'include',
            headers : {
                'x-csrf-token' : this.userToken,
                'x-requested-with' : 'XMLHttpRequest',
                'Content-Type' : 'application/json'
            }
        };
        const params = mergeDeeply(baseParams, subParams);
        return fetch(uri, params);
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

    // チェックイン
    checkin( coord, dencoh ){
        const time = (new Date()).getTime();
        const uri = "https://game.our-rails.ekimemo.com/api/actions/access/checkin";

        const Param = {
            __t : time,
            __os_id : this.userInfo.contents.owner.platform.id,
            acc : 0,
            acquired : '',
            kalman_distance : '',
            kalman_lat : '',
            kalman_lng : '',
            lat : coord.lat,
            lng : coord.lng,
            partner_name_en : dencoh,
            speed : null,
            mocked : null,
            time : Math.floor(time/1000),
        }

        return this.ourFetch(uri + getURIstr(Param), { method:'POST' }).then(res=>res.json());
    }

}

function getURIstr(params){
    const paramStr = "?" + Object.entries(params).map((p) => {
        return `${p[0]}=${p[1]}`;
    }).join("&");
    return paramStr;
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

function searchNearestPoint( coord, list, sta ){
    const nearest = {
        lng : 180,
        lat : 180,
        index : -1,
        distance : 180
    };


    list.forEach((e, index)=>{
        distance = Math.max( Math.sqrt(Math.abs(e.lng - coord.lng) * Math.abs(e.lat - coord.lat)), Math.abs(e.lng - coord.lng), Math.abs(e.lat - coord.lat));
        if ( nearest.distance > distance ){
            nearest.distance = distance;
            nearest.lng = e.lng;
            nearest.lat = e.lat;
            nearest.index = index;
        }
    });

    return nearest;
}

(async()=>{
    const IKS = new IKSGadget();
    IKS.main();
})();
