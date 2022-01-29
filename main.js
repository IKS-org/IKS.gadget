class IKSGadget {

    constructor(){
        this.approval = false;
        this.userInfo = {};
        this.userToken = {};
        this.form = [];

        //内部用関数の実行状況
        this.checkinState = {};
        this.waiting = 0.0;
        this.recoveryState = 0;
    }

    // 利用条件を調べる
    async agreement(){
        this.approval = confirm( "このツールでは駅メモ! Our-Rails利用規約に抵触する行為を行います\nツールの実行を開始してもよろしいですか" );
        this.userInfo = await this.getUserInfo();
        this.userToken = this.getCSRFToken();

        return 0;
    }

    // main
    async main(){

        await this.agreement();
        if ( this.approval !== true || !this.userInfo.contents.owner.platform.id.length || !this.userToken.length ){
            alert( "利用条件を満たしていません。" );
            return -1;
        }
    }

    /*
     * 内部用関数
     */
    delay(n){
        this.waiting = n;
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

        this.checkinState = this.ourFetch(uri + getURIstr(Param), { method:'POST' }).then(res=>res.json());
        return this.checkinState;
    };

    // HP 全回復
    fullRecovery( dencoh ){
        const time = (new Date()).getTime();
        const uri = "https://game.our-rails.ekimemo.com/api/actions/partner/full_recovery";

        const Param = {
            __t : time,
            __os_id : this.userInfo.contents.owner.platform.id
        };

        const body = {
            target_name_en : dencoh
        };

        return this.ourFetch(uri + getURIstr(Param), { method:'POST', body:JSON.stringify(body) }).then(res=>res.json());
    };

    // 編成 取得
    getFormation(){
        const time = (new Date()).getTime();
        const uri = "https://game.our-rails.ekimemo.com/api/my/slots";

        const Param = {
            __t : time,
            __os_id : this.userInfo.contents.owner.platform.id,
            fields : 'hp,name_en,linked_stations,dress,theme_color'
        };

        return this.ourFetch(uri + getURIstr(Param)).then(res=>res.json());
    };

    // 編成 設定
    setFormation(formation){
        const time = (new Date()).getTime();
        const uri = "https://game.our-rails.ekimemo.com/api/my/slots";

        const Param = {
            __t : time,
            __os_id : this.userInfo.contents.owner.platform.id,
            fields : 'hp,name_en,linked_stations,dress,theme_color'
        };

        const body = {
            formation : formation
        };

        return this.ourFetch(uri + getURIstr(Param), { method:'POST', body:JSON.stringify(body) }).then(res=>res.json());
    }

    // ふくびき
    pullLottery(){
        const time = (new Date()).getTime();
        const uri = "https://game.our-rails.ekimemo.com/api/actions/daily_mission/lottery_box/lot";
        const Param = {
            __t : time,
            __os_id : this.userInfo.contents.owner.platform.id
        };

        const body = {
            lottery_box_id : 1
        };

        return this.ourFetch(uri + getURIstr(Param), { method:'POST', body:JSON.stringify(body) }).then(res=>res.json());

    }

    // HP 自動回復
    autoRecovery(){
        this.recoveryState = setInterval(()=>{
            this.getFormation().then((res)=>{
                res.contents.forEach((e)=>{
                    if (e.hp.current < e.hp.max){
                        this.fullRecovery( e.name_en );
                    }
                })
            });
        }, 1000)
    };

    // HP 自動回復 停止
    stopRecovery(){
        clearInterval( this.recoveryState );
        this.recoveryState = 0;
        return 0;
    }

    // 指定座標の最寄り駅に連鎖的にチェックイン
    async checkinAtNearest( origin, list ){

        let point = origin;

        const max = list.length;
        for( let i=0; i<max; i++ ){
            let res = searchNearestPoint( point, list );
            list.splice(res.index, 1)

            // checkin
            let cInRes = null;
            do{
                this.form = (await this.getFormation()).contents;
                cInRes = await this.checkin(coordTrick({lat:res.lat, lng:res.lng}), this.form[ getRandInt(this.form.length) ].name_en);
                await this.delay(res.distance*3000);
            }while(!cInRes.contents)

            point.lng = res.lng;
            point.lat = res.lat;
        }
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

function searchNearestPoint( coord, list ){
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

function getRandInt( max ){
    return Math.floor(Math.random() * max);
}

function coordTrick( coord ){
    const sign = [1, -1];
    return {
        lat : coord.lat + ( Math.Random() / 1000 * sign[getRandInt(2)],
        lng : coord.lng + ( Math.Random() / 1000 * sign[getRandInt(2)]
    };
}

(async()=>{
    const iks = new IKSGadget();
    const list = await fetch("https://raw.githubusercontent.com/IKS-org/IKS.gadget/develop/coords.json?token=GHSAT0AAAAAABQK5Q3BTOMMBIKLOJNNDXW6YP5KVEA").then(r=>r.json());
    const coords = list.map((e)=>{ return e.coord });

    const start = {lng: 139.738477, lat: 35.752164};

    let res = {};
    while(true){
        let res = searchNearestPoint( start, coords );
        coords.splice(res.index, 1);
        if(  res.lng == 140.051656 && res.lat == 36.666495 ) break;
    }

    await iks.agreement();
    this.checkinAtNearest( coordTrick({"lng": 140.051656, "lat": 36.666495}), coords );

})();
