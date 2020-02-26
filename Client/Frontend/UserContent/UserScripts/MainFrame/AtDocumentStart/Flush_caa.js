import _ from 'lodash';
import CouponApplier from './Flush_caaModule';

import React from "react"
import ReactDOM from "react-dom"

import CouponProcess from './Flush_couponProcess';
import CouponSuccess from './Flush_couponSuccess';

export default class CAA {
    init(store, merchant, useCache) {

        let couponConfigs = store.getState().couponConfigs;
        if (couponConfigs && couponConfigs.length)  {
            let locale = navigator.language === 'de' || navigator.language === 'de-DE' ? 'de' : 'en';
            let coupons = _.filter(merchant.vouchers, 'code');

            new CouponApplier({
                'curl': document.location.toString(),
                'merchant': merchant,
                'coupons': coupons,
                'config': couponConfigs,
                //'localization': merchant.localization,
                'skipPromoFieldSearch': !!merchant.runCAA,
                'init': function (ca) {
                    if (sessionStorage.status === 'apply' ||sessionStorage.status === 'progress' || sessionStorage.status === 'parse' || sessionStorage.status === 'revoke') {
                        let prog = ca.start();
                        prog && this.progress(ca);
                    } else if (sessionStorage.status === 'abort' || sessionStorage.status === 'finish') {
                        ca.start();
                        this.success(ca);
                    } else {
                        merchant.runCAA = false;
                        ca.start();
                        sessionStorage.translations = JSON.stringify(store.getState().translations[locale].caa);
                        sessionStorage.merchantDomain = merchant.domain;

                    }
                },
                'updateVoucherUsage': function (code, success) {

                },
                'progress': function (ca) {
                    if (ca.index < ca._coupons.length) {
                        let couponProcess = document.querySelector('#flush-coupon-process-wrapper');
                        if (!couponProcess) {
                            couponProcess = document.createElement('div');
                            document.body.appendChild(couponProcess);
                            couponProcess.setAttribute('id', 'flush-coupon-process-wrapper');

                            ReactDOM.render((
                                <CouponProcess
                                    ca={ca}
                                    store={store}
                                    merchant={merchant}
                                    userId={1}
                                    translations={store.getState().translations[locale].caa}
                                    merchantDomain={this.merchant.domain}
                                />
                            ), couponProcess);
                        } else {
                            ReactDOM.hydrate((
                                <CouponProcess
                                    ca={ca}
                                    store={store}
                                    merchant={merchant}
                                    userId={1}
                                    translations={store.getState().translations[locale].caa}
                                    merchantDomain={this.merchant.domain}
                                />
                            ), couponProcess);
                        }
                    }
                },
                'success': function (ca) {
                    let couponProcess = document.querySelector('#flush-coupon-process-wrapper');
                    if (couponProcess) {
                        couponProcess.remove();
                    }
                    let couponSuccess = document.querySelector('#flush-coupon-success-wrapper');
                    if (!couponSuccess) {
                        couponSuccess = document.createElement('div');
                        document.body.appendChild(couponSuccess);
                        couponSuccess.setAttribute('id', 'flush-coupon-success-wrapper');

                        if (ca._coupon && ca._coupon.discount) {
                           //add saved amount
                        }


                        if (ca._coupon && ca._coupon.discount) {
                            ReactDOM.render((
                                <CouponSuccess
                                    ca={ca}
                                    store={store}
                                    translations={store.getState().translations[locale]}
                                    merchant={merchant}
                                    lot={false}
                                />
                            ), couponSuccess);
                        } else {

                            //get lot
                            ReactDOM.render((
                                    <CouponSuccess
                                        ca={ca}
                                        store={store}
                                        translations={store.getState().translations[locale]}
                                        merchant={merchant}
                                        lot={false}
                                    />
                            ), couponSuccess);
                        }
                    }
                }
            });
        }
    }
}