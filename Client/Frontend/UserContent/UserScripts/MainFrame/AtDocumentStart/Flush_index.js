import React from "react";
import ReactDOM from "react-dom";
import CouponProcess from "./Flush_couponProcess";
import CAA from "./Flush_caa";
import {getMerchantById, getMerchantByPattern, reloadMerchantVouchers} from "./Flush_utils";



let store = new (function(){
    let state = {};
    return {
        getState: function () {
            return state;
        },
        ready: function(callback) {
            if (sessionStorage.flushDummyStore && (new Date().getTime() - parseInt(sessionStorage.flushDummyStoreTime)) < 60*1000){
                state = JSON.parse(sessionStorage.flushDummyStore);
                callback();
            } else {
                new Promise((resolve, reject) => {

                    let xhr = new XMLHttpRequest();
                    xhr.open('GET', 'https://cdn.robinhood.club/json/shops_extension.json');
                    xhr.send();
                    xhr.onload = function() {
                        let merchants = JSON.parse(xhr.responseText).shops;
                        let mappedMerchants = merchants.map((merchant) => {
                            let encodedStr = merchant.n;
                            let parser = new DOMParser;
                            let dom = parser.parseFromString(
                                '<!doctype html><body>' + encodedStr,
                                'text/html');
                            let merchantParsedName = dom.body.textContent;

                            return {
                                domain: merchant.domain,
                                id: merchant.i,
                                name: merchantParsedName,
                                //locale: merchant.c,
                                //autoredirct: merchant.a,
                                paypersale: merchant.pps,
                                payperlead: merchant.ppl,
                                currency: merchant.u,
                                logo: merchant.l,
                                description: merchant.d,
                                // pattern: merchant.p,  merchant.r
                                rating: merchant.r,
                                hideAlert: merchant.ha,
                                isTopMerchant: merchant.t === "true",
                                isSupportedVoucherShop: merchant.sv === "true",
                                couponCount: merchant.cc,
                                rxSource: (merchant.domain.replace(/\./g, "\\.")),
//							rxSource: "^((\\w|\\d)*:\\/\\/)?((\\w|\\d|\\-|\\‒|\\–|\\—|\\―)+\\.)*" + (merchant.domain.replace(/\./g, "\\.")),
                            }
                        });
                       resolve(mappedMerchants);
                    };
                }).then(function(merchants){
                    state.merchants = merchants;
                    new Promise((resolve, reject) => {
                        let xhr = new XMLHttpRequest();
                        xhr.open('GET', 'https://cdn.robinhood.club/json/couponsConfigs.json');
                        xhr.send();
                        xhr.onload = function() {
                            resolve(JSON.parse(xhr.responseText).configs)
                        };
                    }).then(function (coupons) {
                        state.couponConfigs = coupons;
                        new Promise((resolve, reject) => {
                            let xhr = new XMLHttpRequest();
                            xhr.open('GET', 'https://cdn.robinhood.club/json/translations_design.json');
                            xhr.send();
                            xhr.onload = function() {
                                resolve(JSON.parse(xhr.responseText).translations)
                            };
                        }).then(function (translations) {
                            state.translations = translations;
                            sessionStorage.flushDummyStore = JSON.stringify(state);
                            sessionStorage.flushDummyStoreTime = new Date().getTime();
                            callback();
                        });
                    })
                });
            }
        },
        subscribe: function(x,y,z){

        },
        dispatch: function(x,y,z){

        }
    }
})();


let caaInitDone = false;

let initCAA = (merchant) => {
    if (caaInitDone){
        return;
    }
    caaInitDone = true;
    reloadMerchantVouchers(merchant, function(merch){
        merchant = merch;
        if (!merchant.vouchers){
            let merch = getMerchantById(store, merchant.id);
            merchant.vouchers = merch.vouchers;
            sessionStorage.flush_merchant = JSON.stringify(merch);
            console.log("initCAA");
            let caa = new CAA();
            caa.init(store, merchant);
        } else {
            console.log("initCAA");
            let caa = new CAA();
            caa.init(store, merchant);
        }
    });
};

console.log("Start of content_bundle");

// CAA for not blinking
// loads instantly on the page opening
try {
    (function initCAAOnReload() {
        if (!_ || !document.body) {
            _.delay(initCAAOnReload, 20);
        } else {
            if (sessionStorage && sessionStorage.status) {
                if (sessionStorage.status === 'apply' ||sessionStorage.status === 'progress' || sessionStorage.status === 'parse' || sessionStorage.status === 'revoke') {

                    let index = parseInt(sessionStorage._i_couponIndex),
                        _coupons = JSON.parse(sessionStorage.coupons);
                    if (index <= _coupons.length) {
                        let couponProcess = document.querySelector('#flush-coupon-process-wrapper');
                        if (!couponProcess) {
                            couponProcess = document.createElement('div');
                            document.body.appendChild(couponProcess);
                            couponProcess.setAttribute('id', 'flush-coupon-process-wrapper');

                            ReactDOM.render((
                                    <CouponProcess
                                        ca={{
                                            index: index,
                                            _coupons: _coupons
                                        }}
                                        translations={JSON.parse(sessionStorage.translations)}
                                        merchantDomain={sessionStorage.merchantDomain}
                                    />
                            ), couponProcess);

                            store.ready(function(){
                                initCAA(JSON.parse(sessionStorage.flush_merchant));
                            });
                        }
                    }
                }
            }

        }
    })();
}
catch (e) {
}

store.ready(() => {
    console.log("Store ready");
    (function init() {
        if (document.getElementsByTagName('body').length < 1) {
            setTimeout(init, 100);
        } else {
            var head = document.getElementsByTagName('HEAD')[0];
            var link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = 'https://cdn.robinhood.club/css/flush_main.css';
            head.appendChild(link);

            console.log("Checking domain "+document.location.href);
            console.timeEnd();
            console.time();

            let merchant = getMerchantByPattern(store, document.location.href);
            console.log(merchant);
            if (merchant) {
                  initCAA(merchant);
            }
        }
    })();
});

window.addEventListener("DOMContentLoaded", function (event) {

});