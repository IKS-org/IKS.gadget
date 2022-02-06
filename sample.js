import IKSGadget from './IKS.gadget';

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

function coordTrick( coord ){
    const sign = [1, -1];
    return {
        lat : coord.lat + ( Math.random() / 1000 * sign[getRandInt(2)]),
        lng : coord.lng + ( Math.random() / 1000 * sign[getRandInt(2)])
    };
}

function getRandInt( max ){
    return Math.floor(Math.random() * max);
}

(async()=>{

    const iks = new IKSGadget();
    const list = await fetch("https://raw.githubusercontent.com/IKS-org/IKS.gadget/develop/coords.json?token=GHSAT0AAAAAABQK5Q3BTOMMBIKLOJNNDXW6YP5KVEA").then(r=>r.json());
    const coords = list.map((e)=>{ return e.coord });

    const start = {lng: 139.738477, lat: 35.752164};
    const breakpoint = { lng: 138.853927, lat: 37.447787 }

    let res = {};
    while(true){
        let res = searchNearestPoint( start, coords );
        coords.splice(res.index, 1);
        if(  res.lng == breakpoint.lng && res.lat == breakpoint.lat ) break;

    }

    await iks.agreement();

    // 指定座標の最寄り駅に連鎖的にチェックイン
    let point = breakpoint;
    const max = list.length;
    for( let i=0; i<max; i++ ){
        let res = searchNearestPoint( point, list );
        list.splice(res.index, 1)

        // checkin
        let cInRes = null;
        do{
            iks.form = (await iks.getFormation()).contents;
            cInRes = await iks.checkin(coordTrick({lat:res.lat, lng:res.lng}), iks.form[ getRandInt(iks.form.length) ].name_en);
            await iks.delay(res.distance*2300);
        }while(!cInRes.contents)

        point.lng = res.lng;
        point.lat = res.lat;
    }
})();
