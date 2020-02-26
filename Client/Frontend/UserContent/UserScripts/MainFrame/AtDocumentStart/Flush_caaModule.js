import _ from "lodash";

export default function CouponApplier(opt_options) {
    var _self = this,
        _stopped = false,
        _currentUrl = opt_options['curl'],
        _bPromoFieldFound = false,
        _iTimer = null,
        _i_couponIndex = sessionStorage._i_couponIndex ? parseInt(sessionStorage._i_couponIndex) : 0,
        _checkPromoFieldFound = false,
        _config = opt_options['config'],
        _skipPromoFieldSearch = opt_options['skipPromoFieldSearch'] ? opt_options['skipPromoFieldSearch'] : false,
        _coupons = sessionStorage.coupons ? JSON.parse(sessionStorage.coupons) : opt_options['coupons'],
        _merchantdomain = opt_options['curl'],
        _merchant = opt_options['merchant'],
        _defaultTimeout = 1500,
        _overlay,
        _price,
        _iframe,
        _iframeSelector = '#coupons_applier',
        _coupon = sessionStorage._coupon ? JSON.parse(sessionStorage._coupon) : null,
        _timeoutApply,
        _timeoutRevoke;


    _coupons = _.values(_coupons);


    // Variables for the global scope
    _self.rules = null;
    _self.index = null;
    _self._coupons = null;
    _self._coupon = null;
    _self._price = null;
    _self.currency = null;
    _self.nextState = null;
    _self.currentDiscount = 0;
    _self.fieldsChecked = false;

    // Start applying of _coupons
    _self['reset'] = function (skipNewCustomer) {
        _i_couponIndex = 0;
        _self._coupon = null;
        _self.currency = null;
        _self.nextState = null;
        _self.currentDiscount = 0;
        sessionStorage._i_couponIndex = 0;


        if (skipNewCustomer){
            _coupons = _.filter(_coupons, function(coupon){
                return coupon.newCustomer == false
            })
        }

    };
    // Start applying of _coupons
    _self['start'] = function (cpons) {

        _coupons = cpons || _coupons;

        if (!sessionStorage.rules){
            sessionStorage.rules = JSON.stringify(_self.rules);
        }

        _self.nextState = sessionStorage.status || 'apply';
        sessionStorage.status = _self.nextState;
        sessionStorage.coupons = JSON.stringify(_coupons);
        _self._coupons = _coupons;

        if (sessionStorage._coupon) {
            _self._coupon = JSON.parse(sessionStorage._coupon);
        }
        _price = _price || sessionStorage.price;
        _self._price = parseFloat(_price);
        _i_couponIndex = sessionStorage._i_couponIndex || _i_couponIndex;


        if (_self.nextState === "revoke"){
            return true;
        }

        if (_i_couponIndex >= _coupons.length) {
            _couponApplianceDone();
            return false;
        }
        apply_coupons();
        return true;
    };

    // Stop applying of _coupons
    _self['stop'] = function () {
        stop();
        sessionStorage._i_couponIndex = '';
        sessionStorage.status = 'abort';
        sessionStorage.coupons = '';
        sessionStorage.price = '';
        sessionStorage.nextState = 'abort';
        sessionStorage.currentDiscount = '';
        delete sessionStorage.rules;
    };

    // Starts applying of the best _coupon when it is found
    _self['finishing'] = function () {
        if (sessionStorage.status !== 'finish' && _coupon && (_self._coupons.length > 1 || _self.rules["remove"])) {
            apply_coupon(_coupon, true);
        }
    };

    _self['clearStorage'] = function () {
        clearStorage();
    };

    _self['couponApplianceDone'] = function () {
        stop();
        _couponApplianceDone();
        _self.nextState = 'abort';
        sessionStorage.status = 'abort';
        sessionStorage.nextState = 'abort';
    };

    // Define the callbacks
    var _options = _.assignIn({
        'init': null,
        'progress': null,
        'success': null,
        //'sendState': null
    }, opt_options);


    var processRule = function(value){
        _self.rules = value;

        window.clearInterval(_iTimer);
        _iTimer = window.setInterval(function () {
            checkPromoField.apply(_self);
        }, 500);
    };


    var checkRules = function(){

        if (sessionStorage.rules){
            processRule(JSON.parse(sessionStorage.rules));
        } else {
            // Function monitors if there is _configuration object to enable _coupons for the current page
            _.each(_config, (value) => {
                _.each([].concat(value.url), (url) => {


                    if (_currentUrl.indexOf(url) >= 0 || new RegExp(url, "ig").test(_currentUrl)) {
                        processRule(value);
                        return false;
                    }
                });
            });
        }
    };

    checkRules();

    // Function parse the total _price string value to get the numeric value
    function parse_price(str) {

        // '$26,98' -> 26.98
        // '$26.98' -> 26.98
        // '$26,987' -> 26987
        // '$26.987' -> 26987
        // '$26,123.56' -> 26123.56
        // '$26.123,56' -> 26123.56

        //if last char is a .
        if (str.substr(str.length - 1) == '.') {
            str = str.substring(0, str.length - 1);
        }

        if (str) {
            str = str + '';
            var coma = (str.indexOf(',') >= 0) ? str.length - str.indexOf(',') - 1 : 0;
            var dot = (str.indexOf('.') >= 0) ? str.length - str.indexOf('.') - 1 : 0;
            if (!coma && !dot) {
                if (str.indexOf('€') > 0) {
                    str = str.replace('€', '.');
                }
            }

            // keep only digitals, dot and coma
            str = str.replace(/[^\d\.\,\n]/g, '');
            str = str.replace(/[\r\n]/g, ''); // newline character
            //if last char is a . or ,
            if (str.substr(str.length - 1) == '.') {
                str = str.substring(0, str.length - 1);
                dot = false;

            } else if (str.substr(str.length - 1) == ',') {
                str = str.substring(0, str.length - 1);
                coma = false;
            }

            if (coma && dot) {
                if (coma > dot) {
                    str = str.replace(',', '');
                } else {
                    str = str.replace('.', '');
                    str = str.replace(',', '.');
                }
            }

            str = str.replace(',', '.');
            dot = (str.indexOf('.') >= 0) ? str.length - str.indexOf('.') - 1 : 0;
            if (dot === 3) {
                str = str.replace('.', '');
            }
            return parseFloat(str);
        }
    }

    // Function to find the total _price value on the page or in the response document when _coupon is applied
    function getAmount(rule, opt_data) {
        let data = opt_data || document.body;
        if (typeof rule == 'string') {

            //console.log("COUPON TOTAL", rule);

            if (_iframe) {
                return document.querySelector(_iframeSelector).querySelector(rule).innerText;
            } else {
                return document.querySelector(rule).innerText;
            }
        } else if (rule['rx'] && rule['selector']) {
            var html = document.querySelector(rule['selector']).innerText;
            var rx = new RegExp(rule['rx']);
            var match = html.trim(html).match(rx);
            if (match && match.length > 1) {
                return match.pop();
            }
        } else if (rule['rx']) {
            var rx = new RegExp(rule['rx']);
            var match = data.trim().match(rx);
            if (match && match.length > 1) {
                return match.pop();
            }
        } else if (rule['path']) {
            var responseObj = typeof opt_data === 'string' ? JSON.parse(opt_data) : opt_data,
                process = function (obj, path) {
                    if (typeof path === 'string') {
                        return process(obj, path.split('//'));
                    } else if (path.length === 0) {
                        return obj;
                    } else {
                        return process(obj[path[0]], path.slice(1));
                    }
                };
            return process(responseObj, rule['path']);
        }
    }

    // Function to compare the total _prices for the all _coupons and to find the one wit minimal _price
    function findBest_coupon(_price) {
        var i = -1,
            min = _price || _coupons[0].total;
        _.forEach(_coupons, function (c, j) {
            if (c.total && c.total < min) {
                i = j;
                min = c.total;
            }
        });
        return _coupons[i];
    }

    // Function to replace the value '%promo' in conflagration data string
    function substitute(str) {
        if (typeof str === 'string') {
            str = str.replace('%promo', _coupons[_i_couponIndex].c);
            return str;
        } else if (typeof str === 'object') {
            var obj = JSON.parse(JSON.stringify(str));
            for (var key in obj) {
                obj[key] = substitute(obj[key]);
            }
            return obj;
        }
    }

    // Function to paste script to the page document
    // function executeInlineJavaScript(js) {
    // var script = document.createElement('script');
    // if (script.innerText) {
    // script.innerText = js;
    // } else {

    // // IE variant
    // script.text = js;
    // }
    // document.body.appendChild(script);
    // }

    // Function starts when all _coupons tried and now need to find one the best and apply it
    function _couponApplianceDone() {
        _coupon = (_coupons.length > 0) && findBest_coupon(_price);
        var tmpCurrency = getAmount(_self.rules['controls']['currency'] || {
            'selector': _self.rules['controls']['total'],
            'rx': '(.*?)[\\d\\s]'
        }, document.body);
        var currency = tmpCurrency ? tmpCurrency : '€';
        _self._coupon = _coupon;
        _self._price = _price;
        _self.currency = currency;
        if (_coupon) {
            sessionStorage._coupon = JSON.stringify(_coupon);
        }
        sessionStorage.currency = currency;

        _iframe = false;

        let frame = document.querySelector(_iframeSelector);
        if (frame) {
            frame.remove();
        }

        let success = true;

        if (sessionStorage.status !== 'finish' && _self.rules.apply.reload){
            success = false;
        }

        //add flush success div
        if (_self.rules['controls']['success']){
            let successDiv = document.querySelector(_self.rules['controls']['success']);
            if (successDiv){
                let flush_coupon_success_div = successDiv.querySelector("#flush_coupon_success_div");
                if (flush_coupon_success_div){
                    flush_coupon_success_div.remove();
                }

                flush_coupon_success_div = document.createElement("div");
                flush_coupon_success_div.setAttribute("id", "flush_coupon_success_div");
                successDiv.appendChild(flush_coupon_success_div);
            }
        }
        if (_self.rules['controls']['successPrice']){
            let successPriceDiv = document.querySelector(_self.rules['controls']['successPrice']);
            if (successPriceDiv){
                let flush_coupon_successPrice_div = successPriceDiv.querySelector("#flush_coupon_successPrice_div");
                if (flush_coupon_successPrice_div){
                    flush_coupon_successPrice_div.remove();
                }

                flush_coupon_successPrice_div = document.createElement("div");
                flush_coupon_successPrice_div.setAttribute("id", "flush_coupon_successPrice_div");
                successPriceDiv.appendChild(flush_coupon_successPrice_div);
            }
        }
        //	clearStorage();
        _self['finishing']();
        _self.nextState = 'finish';
        sessionStorage.status = _self.nextState;

        // Callback function on the moment when applying finished and results can be displayed.
        success && _options['success'] && _options['success'](_self);
    }

    function parseTotal(data, textStatus, xhr) {
        if (_self.rules['apply']['response']) {
            switch (_self.rules['apply']['response']['type']) {
                case 'string':
                    if (_self.rules['apply']['response']['discount']) {
                        _coupons[_i_couponIndex].discount = parse_price(getAmount({
                            'rx': _self.rules['apply']['response']['discount']
                        }, xhr.responseText));
                        _coupons[_i_couponIndex].total = _price - _coupons[_i_couponIndex].discount;
                    }
                    else {
                        _coupons[_i_couponIndex].total = parse_price(getAmount({
                            'rx': _self.rules['apply']['response']['total']
                        }, xhr.responseText));
                    }
                    break;
                case 'json':
                    if (_self.rules['apply']['response']['discount']) {
                        _coupons[_i_couponIndex].discount = parse_price(getAmount({
                            'path': _self.rules['apply']['response']['discount']
                        }, xhr.responseText));
                        _coupons[_i_couponIndex].total = _price - _coupons[_i_couponIndex].discount;
                    }
                    else {
                        _coupons[_i_couponIndex].total = parse_price(getAmount({
                            'path': _self.rules['apply']['response']['total']
                        }, xhr.responseText));
                    }
                    break;
                case 'html':
                    if (_self.rules['apply']['response']['discount']) {
                        _coupons[_i_couponIndex].discount = _coupons[_i_couponIndex].total = parse_price(getAmount(_self.rules['apply']['response']['discount'], data));
                        _coupons[_i_couponIndex].total = _price - _coupons[_i_couponIndex].discount;
                    }
                    else {
                        _coupons[_i_couponIndex].total = parse_price(getAmount(_self.rules['apply']['response']['total'], data));
                    }
                    break;
            }
        }
        // else {
        // _coupons[_i_couponIndex].total = parse_price(getAmount(_self.rules['controls']['total'], data));
        // }
        // if (_self.rules['apply']['response'] && _self.rules['apply']['response']['type'] == 'string') {
        // _coupons[_i_couponIndex].total = parse_price(getAmount({
        // 'rx': _self.rules['apply']['response']['total']
        // }, xhr.responseText));
        // } else if (_self.rules['apply']['response'] && _self.rules['apply']['response']['type'] === 'json') {
        // _coupons[_i_couponIndex].total = parse_price(getAmount({
        // 'path': _self.rules['apply']['response']['total']
        // }, xhr.responseText));
        // } else if (_self.rules['apply']['response'] && _self.rules['apply']['response']['type'] === 'html') {
        // _coupons[_i_couponIndex].total = parse_price(getAmount(_self.rules['apply']['response']['total'], data));
        // } else {
        // _coupons[_i_couponIndex].total = parse_price(getAmount(_self.rules['controls']['total'], data));
        // }
        // console.warn(_coupons[_i_couponIndex].total);
        // sessionStorage.coupons = _coupons;
    }

    // This function apply the _coupons that has a promo code. Applying method depends from the _configuration object for the current website
    function apply_coupon(_coupon, bFinish) {
        if (_coupon && _coupon['code']) {

            if (_self.nextState == 'parse') {
                return check_coupon();
            }

            // Fill the promo field
            let input;
            if (_iframe) {
                input = document.querySelector(_iframeSelector).querySelector(_self.rules['controls']['promo']);
            } else {
                input = document.querySelector(_self.rules['controls']['promo']);
            }
            if (input) {
                input.focus();
                dispatch(['focus'], input);
                input.value = (_coupon['code']);
                dispatch(['change', 'input', 'keyup'], input);
            }else if(_self.rules['remove']=== undefined){
                //needed fields where gone, e.g. because a voucher was entered and the voucher input field disappears
                if (!bFinish) {
                    _couponApplianceDone();
                }
                return;
            }
            if (!bFinish) {
                _self.nextState = 'parse';
                sessionStorage.status = _self.nextState;
            }

            if (_self.rules.popup && _self.rules.popup.click  && (!input || input.offsetParent === null)) {
                simulatedClick(_iframe ? document.querySelector(_iframeSelector).querySelector(_self.rules.popup.click) : document.querySelector(_self.rules.popup.click));
            }

            switch (_self.rules['apply']['type']) {
                case 'click':
                    //if there are several submit options for this shop
                    if (Array.isArray(_self.rules['apply']['submit'])) {
                        _self.rules['apply']['submit'].forEach(function (item) {
                            simulatedClick(_iframe ? document.querySelector(_iframeSelector).querySelector(item) : document.querySelector(item));
                        });

                    } else {
                        //only one submit option for this shop
                        simulatedClick(_iframe ? document.querySelector(_iframeSelector).querySelector(_self.rules['apply']['submit']) : document.querySelector(_self.rules['apply']['submit']));
                    }

                    if (!bFinish && !_self.rules.apply.reload) {

                        if (_self.rules.apply.doReload){
                            _timeoutApply = window.setTimeout(() => { window.location.reload() }, _self.rules['apply']['timeout'] || _defaultTimeout);
                        } else {
                            _timeoutApply = window.setTimeout(check_coupon, _self.rules['apply']['timeout'] || _defaultTimeout);
                        }
                    }

                    break;
                case 'js':
                // executeInlineJavaScript(_self.rules['apply']['js']);
                // if (!bFinish) {
                // _timeoutApply = window.setTimeout(check_coupon, _self.rules['apply']['timeout'] || _defaultTimeout);
                // }
                // break;
                case 'submit':
                    /*					if (bFinish) {
                                            simulatedClick(document.querySelector(_self.rules['apply']['submit']));
                                        } else {
                                            if (typeof _self.rules['apply']['form'] == 'string') {
                                                var form = document.querySelector(_self.rules['apply']['form']);
                                            } else if (typeof _self.rules['apply']['form'] == 'object') {
                                                var form = document.querySelector(_self.rules['apply']['form']['selector']);
                                            }
                                            var data = form.querySelector('input[name][value][type!=\'radio\'][type!=\'checkbox\'][type!=\'submit\'][type!=\'image\']')
                                                .add('input[name][value][type=\'radio\']:checked')
                                                .add('input[name][value][type=\'checkbox\']:checked')
                                                .add('select[name]')
                                                .add(_self.rules['apply']['submit'])
                                                .map(function () {
                                                    if (this.getAttribute('name')) {
                                                        var name = this.getAttribute('name');
                                                        if (_self.rules['apply']['data'] && typeof _self.rules['apply']['data'] == 'object') {
                                                            if (_self.rules['apply']['data'][name]) {
                                                                var val = encodeURIComponent(substitute(_self.rules['apply']['data'][name]));
                                                                delete _self.rules['apply']['data'][name];
                                                                return name + '=' + val;
                                                            } else if (_self.rules['apply']['data'][name] === null) {
                                                                return null;
                                                            }
                                                        }
                                                        return name + '=' + encodeURIComponent(this.value);
                                                    }
                                                    return null;
                                                }).get().join('&');

                                            if (_self.rules['apply']['data']) {
                                                if (typeof _self.rules['apply']['data'] == 'string') {
                                                    data += '&' + substitute(_self.rules['apply']['data']);
                                                } else if (typeof _self.rules['apply']['data'] == 'object') {
                                                    data += ('&' + $.map(_self.rules['apply']['data'], function (val, name) {
                                                        return val ? name + '=' + substitute(val) : null;
                                                    }).join('&'));
                                                }
                                            }
                                            $.support.cors = true;
                                            $.ajax({
                                                'type': form.attr('method') || 'POST',
                                                'url': _self.rules['apply']['form']['url'] || form.attr('action'),
                                                'data': data,
                                                'success': function (data, textStatus, xhr) {
                                                    if (!_stopped) {
                                                        if (_self.rules['apply']['response']['url']) {
                                                            $.ajax({
                                                                'type': _self.rules['apply']['response']['method'] || 'GET',
                                                                'url': _self.rules['apply']['response']['url'],
                                                                'success': function (data, textStatus, xhr) {
                                                                    if (!_stopped) {
                                                                        parseTotal(data, textStatus, xhr);
                                                                        revoke_coupon();
                                                                    }
                                                                }
                                                            });
                                                        } else {
                                                            parseTotal(data, textStatus, xhr);
                                                            revoke_coupon();
                                                        }
                                                    }
                                                },
                                                'error': function (data) {
                                                    if (!_stopped) {
                                                        _i_couponIndex++;
                                                        sessionStorage._i_couponIndex = _i_couponIndex;
                                                        apply_coupons();
                                                    }
                                                }
                                            });
                                        }*/
                    break;
                case 'post':
                case 'get':
                    /*					if (bFinish) {
                                            simulatedClick($(_self.rules['apply']['submit']).get(0));
                                        } else {
                                            $.support.cors = true;
                                            $.ajax({
                                                'type': _self.rules['apply']['type'],
                                                'url': _self.rules['apply']['url'].replace('%promo', _coupon['code']),
                                                'data': substitute(_self.rules['apply']['data']),
                                                'contentType': _self.rules['apply']['contentType'],
                                                'dataType': _self.rules['apply']['response'] ? _self.rules['apply']['response']['type'] : null,
                                                'processData': _self.rules['apply']['response']['processData'] || true,
                                                'success': function (data, textStatus, xhr) {
                                                    if (!_stopped) {
                                                        if (_self.rules['apply']['response']) {
                                                            if (_self.rules['apply']['response']['url']) {
                                                                $.ajax({
                                                                    'type': _self.rules['apply']['response']['method'] || 'GET',
                                                                    'url': _self.rules['apply']['response']['url'],
                                                                    'success': function (data, textStatus, xhr) {
                                                                        if (!_stopped) {
                                                                            parseTotal(data, textStatus, xhr);
                                                                            revoke_coupon();
                                                                        }
                                                                    }
                                                                });
                                                            } else {
                                                                parseTotal(data, textStatus, xhr);
                                                                revoke_coupon();
                                                            }
                                                        } else {
                                                            // _coupons[_i_couponIndex].total = parse_price(getAmount(_self.rules['controls']['total'], data));
                                                            // revoke_coupon();
                                                            check_coupon();
                                                        }
                                                    }
                                                },
                                                'error': function (data) {
                                                    if (!_stopped) {
                                                        _i_couponIndex++;
                                                        sessionStorage._i_couponIndex = _i_couponIndex;
                                                        apply_coupons();
                                                    }
                                                }
                                            });
                                        }*/
                    break;
            }
        } else {
            _i_couponIndex++;
            sessionStorage._i_couponIndex = _i_couponIndex;
            apply_coupons();
        }
    }

    // Function for cases 'js' and 'click' to check if there is no errors on page at the _coupon apply process, e.g. some fields on checkout page required to be with text
    function check_coupon() {
        console.log("Check coupon");
        var err = !!_self.rules['controls']['error'] ? document.querySelector(_self.rules['controls']['error']) : null;
        if (err && err.length) {





            document.querySelector(_self.rules['controls']['promo']).value = '';
            stop();
            document.querySelector(_self.rules['controls']['error']).focus();
            return;
        }
        var total = parse_price(getAmount(_self.rules['controls']['total']));
        console.log( "Gor new total " + total);
        if (_self.rules['apply']['response'] && _self.rules['apply']['response']['type'] === 'discount') {
            _coupons[_i_couponIndex].discount = parse_price(getAmount(_self.rules['controls']['discount']));
            if (_coupons[_i_couponIndex].discount !== 0) {
                _coupons[_i_couponIndex].total = _price - _coupons[_i_couponIndex].discount;
            }
            else {
                _coupons[_i_couponIndex].total = total;
                _coupons[_i_couponIndex].discount = parseFloat((_price - total).toFixed(2));
            }
        }
        else {
            _coupons[_i_couponIndex].total = total;
            _coupons[_i_couponIndex].discount = parseFloat((_price - total).toFixed(2));
        }

        if (sessionStorage.currentDiscount < _coupons[_i_couponIndex].discount) {
            sessionStorage.currentDiscount = _coupons[_i_couponIndex].discount;
        }


        _options['updateVoucherUsage'] &&
        _options['updateVoucherUsage'](_coupons[_i_couponIndex].code, _coupons[_i_couponIndex].discount != 0 ? 1 : 0);

        // _coupons[_i_couponIndex].total = parse_price(getAmount(_self.rules['controls']['total']));
        sessionStorage.coupons = JSON.stringify(_coupons);
        revoke_coupon();
    }

    // One some merchants to apply new _coupon code, previous should be removed
    function revoke_coupon(opt_iRevokeStep) {
        _self.nextState = 'revoke';
        sessionStorage.status = _self.nextState;

        if (_self.rules['remove']) {

            // -- If there's no incoming parameter we assume it's first step;
            let iRevokeStep = opt_iRevokeStep || 0;

            // -- by defalut we have 1-step revoke flow but we must support multisteps revoking
            _self.rules['remove'] = [].concat(_self.rules['remove']);

            let removeTarget = _iframe ? document.querySelector(_iframeSelector).contentDocument.querySelector(_self.rules['remove'][iRevokeStep]['submit']) : document.querySelector(_self.rules['remove'][iRevokeStep]['submit']);

            if (!removeTarget){
                apply_coupons();
                return;
            }

            if (!_self.rules['remove'][iRevokeStep]['reload']) {
                _timeoutRevoke = window.setTimeout(function () {

                    // -- If we are on the last step of revokin
                    if (iRevokeStep == _self.rules['remove'].length - 1 || !Array.isArray(_self.rules['remove'])) {
                        //_i_couponIndex++;
                        //sessionStorage._i_couponIndex = _i_couponIndex;
                        apply_coupons();
                    } else {
                        revoke_coupon(iRevokeStep + 1);
                    }
                }, _self.rules['remove'][iRevokeStep]['timeout'] || _defaultTimeout);
            } else {
                _i_couponIndex++;
                sessionStorage._i_couponIndex = _i_couponIndex;
                sessionStorage.status = "apply";
            }
            switch (_self.rules['remove'][iRevokeStep]['type']) {
                case 'click':
                    simulatedClick(removeTarget);
                    break;
                case 'js':
                    // executeInlineJavaScript(substitute(_self.rules['remove'][iRevokeStep]['js']));
                    break;
                case 'get':
                case 'post':
                    /*					$.support.cors = true;
                                        $.ajax({
                                            'type': _self.rules['remove'][iRevokeStep]['type'],
                                            'url': substitute(_self.rules['remove'][iRevokeStep]['url']),
                                            'data': substitute(_self.rules['remove'][iRevokeStep]['data']),
                                            'contentType': _self.rules['remove'][iRevokeStep]['contentType'],
                                            'dataType': _self.rules['remove'] ? _self.rules['remove'][iRevokeStep]['dataType'] : null
                                        });*/
                    break;
                case 'submit':
                    /*					if (typeof _self.rules['remove'][iRevokeStep]['form'] == 'string') {
                                            var form = $(_self.rules['remove'][iRevokeStep]['form']);
                                        } else if (typeof _self.rules['remove'][iRevokeStep]['form'] == 'object') {
                                            var form = $(_self.rules['remove'][iRevokeStep]['form']['selector']);
                                        }
                                        var data = form.find('input[name][value][type!=\'radio\'][type!=\'checkbox\'][type!=\'submit\'][type!=\'image\']')
                                            .add('input[name][value][type=\'radio\']:checked')
                                            .add('input[name][value][type=\'checkbox\']:checked')
                                            .add('select[name]')
                                            .add(_self.rules['remove'][iRevokeStep]['submit'])
                                            .map(function () {
                                                if (this.getAttribute('name')) {
                                                    var name = this.getAttribute('name');
                                                    if (_self.rules['remove']['data'] && typeof _self.rules['remove']['data'] == 'object') {
                                                        if (_self.rules['remove']['data'][name]) {
                                                            var val = encodeURIComponent(substitute(_self.rules['remove']['data'][name]));
                                                            delete _self.rules['remove']['data'][name];
                                                            return name + '=' + val;
                                                        } else if (_self.rules['remove']['data'][name] === null) {
                                                            return null;
                                                        }
                                                    }
                                                    return name + '=' + encodeURIComponent(this.value);
                                                }
                                                return null;
                                            }).get().join('&');
                                        if (_self.rules['remove'][iRevokeStep]['data']) {
                                            if (typeof _self.rules['remove'][iRevokeStep]['data'] == 'string') {
                                                data += '&' + substitute(_self.rules['remove'][iRevokeStep]['data']);
                                            } else if (typeof _self.rules['remove'][iRevokeStep]['data'] == 'object') {
                                                data += ('&' + $.map(_self.rules['remove'][iRevokeStep]['data'], function (val, name) {
                                                    return val ? name + '=' + substitute(val) : null;
                                                }).join('&'));
                                            }
                                        }
                                        $.support.cors = true;
                                        $.ajax({
                                            'type': form.attr('method') || 'POST',
                                            'url': form.attr('action'),
                                            'data': data
                                        });*/
                    break;
            }
        } else {
            apply_coupons();
        }
    }

    // Function one by one applies _coupons
    function apply_coupons() {
        if (_i_couponIndex >= _coupons.length) {
            return;
        }
        if (!_price) {
            // Set total _price before _coupon is applied to compare it with prise-discount
            _price = _price || (_self.rules['controls']['total'] && parse_price(getAmount(_self.rules['controls']['total'])));
            sessionStorage.price = _price;
        }
        apply_internal();
    }

    function apply_internal() {
        if (_self.nextState == 'revoke') {
            _self.nextState = 'apply';
            _i_couponIndex++;
            sessionStorage._i_couponIndex = _i_couponIndex;
            sessionStorage.status = _self.nextState;
        }

        if (!_i_couponIndex) {
            sessionStorage._i_couponIndex = _i_couponIndex;
        }

        _self.index = parseInt(sessionStorage._i_couponIndex);
        _self._coupons = _coupons;

        // Callback function on the moment when starts the applying process e.g. button clicked. Can be used to display applying process.
        _options['progress'] && _options['progress'](_self);
        var err = !!_self.rules['controls']['error'] ? $(_self.rules['controls']['error']) : null;
        if (!err || !err.length || _i_couponIndex === 0) {
            if (_i_couponIndex < _coupons.length) {
                if (_iframe && document.querySelector(_iframeSelector).contentDocument.querySelector(_self.rules['apply']['submit']).length <= 0) {
                    setTimeout(apply_coupons, 100);
                } else {
                    apply_coupon(_coupons[_i_couponIndex]);
                }
            } else {
                // All _coupons checked now should to be choose and applied one the best
                _couponApplianceDone();
            }
        } else {
            document.querySelector(_self.rules['controls']['promo']).focus().value = '';
            stop();
        }
    }

    // Function stops applying processes.
    function stop() {
        _stopped = true;
        _timeoutRevoke && window.clearTimeout(_timeoutRevoke);
        _timeoutApply && window.clearTimeout(_timeoutApply);
    }

    // Check if the field for promotional code is available and can be used
    function checkPromoField() {
        /*		if (!_self.fieldsChecked) {
                    _self.fieldsChecked = true;
                    if (!sessionStorage.status && $(_self.rules['controls']['promo']).length && $(_self.rules['coupon']).is(':visible')) {
                        //coupon already applied
                        _options['sendState']('Already applied');
                    }

                    if (!sessionStorage.status && _self.rules['controls']['total'] && !(parse_price(getAmount(_self.rules['controls']['total'])) > 0)) {
                        //no total field found
                        _options['sendState']('No total');
                        return;
                    }

                       if (_self.rules.popup && _self.rules.popup.click) {
                simulatedClick(_iframe ? document.querySelector(_iframeSelector).querySelector(_self.rules.popup.click) : document.querySelector(_self.rules.popup.click));
            }
                }*/


        if (

            _skipPromoFieldSearch === true ||

            (
                (
                    document.querySelector(_self.rules['controls']['promo']) && !_checkPromoFieldFound &&
                    (
                        !_self.rules['coupon'] || _self.rules['coupon'] && !document.querySelector(_self.rules['coupon']) || document.querySelector(_self.rules['coupon']) && getComputedStyle(document.querySelector(_self.rules['coupon'])).display === 'none'
                    )
                ) && (document.querySelector(_self.rules['apply']['submit']) && document.querySelector(_self.rules['apply']['submit']).offsetParent != null &&
                    document.querySelector(_self.rules['controls']['promo']) && document.querySelector(_self.rules['controls']['promo']).offsetParent != null &&
                    document.querySelector(_self.rules['controls']['total']) && document.querySelector(_self.rules['controls']['total']).offsetParent != null)
            )

            || sessionStorage.status

        ) {

            _checkPromoFieldFound = true;




            // Stop searching of the promo field
            window.clearInterval(_iTimer);

            if (!_price) {
                // Set total _price before _coupon is applied to compare it with prise-discount
                _self._price = _price || (_self.rules['controls']['total'] && parse_price(getAmount(_self.rules['controls']['total'])));
            }

            // Callback to content function on the moment when promo field was found on the page. Can be used to create and position button on the page.
            _options['init'] && _options['init'](_self);
        } else {
            let promo = document.querySelector(_self.rules['controls']['promo']);
            //if no fields where found, because they were hidden. The popup click, to show the needed fields is tried.
            if (_self.rules.popup && _self.rules.popup.click && (!promo || promo.offsetParent === null)) {
                simulatedClick(_iframe ? document.querySelector(_iframeSelector).querySelector(_self.rules.popup.click) : document.querySelector(_self.rules.popup.click));

            }

        }
    }

    // Function simulates event of mouse click on document element
    function simulatedClick(target) {
        console.log("Simulating Click ");
        console.log(target);
        target && target.focus();
        dispatch(['mouseover', 'mousedown', 'click', 'mouseup', 'focus'], target);
    }

    function extend(destination, source) {
        for (var property in source) {
            destination[property] = source[property];
        }
        return destination;
    }

    function dispatch(type, target_el, value_opt) {
        type = [].concat(type);
        for (let i = 0; i < type.length; i++) {
            _dispatch(type[i], target_el, value_opt);
        }

        function _dispatch(type, target_el, opt_value) {
            if (target_el) {
                let evt;
                switch (type) {
                    case 'click':
                    case 'dblclick':
                    case 'mousedown':
                    case 'mousemove':
                    case 'mouseout':
                    case 'mouseover':
                    case 'mouseup':
                    case 'scroll':
                        target_el.removeAttribute('disabled');

                        evt = document.createEvent("MouseEvent");
                        var initMethod = 'initMouseEvent';
                        evt[initMethod](
                            type, // event type : keydown, keyup, keypress
                            true, // bubbles
                            true, // cancelable
                            window, // view
                            1, // detail
                            0, // screenX
                            0, // screenY
                            0, // clientX
                            0, // clientY
                            false, // ctrlKey
                            false, // altKey
                            false, // shiftKey
                            false, // metaKey
                            0, // button
                            null // relatedTarget
                        );
                        break;
                    case 'keydown':
                    case 'keypress':
                    case 'keyup':
                        evt = new KeyboardEvent(type,{'key':''});
                        break;
                    case 'change':
                    case 'focus':
                    case 'blur':
                    case 'select':
                    case 'submit':
                    case 'input':
                        evt = document.createEvent('HTMLEvents');
                        evt.initEvent(type, true, true);
                        break;
                }
                target_el.dispatchEvent(evt);
            }
        }
    }

    function clearStorage() {
        sessionStorage._i_couponIndex = '';
        sessionStorage.status = '';
        sessionStorage.coupons = '';
        sessionStorage.price = '';
        sessionStorage.nextState = '';
        sessionStorage.currentDiscount = '';
        sessionStorage._coupon = '';
    }

    function getDeepData(data, path) {
        var path = typeof path === 'string' ? path.split('.') : path,
            data = typeof data === 'object' && !Array.isArray(data) ? data[path[0]] : data;
        if (path && path.length > 0 && typeof path === 'object' && typeof data !== 'string') {
            path.splice(0, 1);
            return getDeepData(data, path);
        } else {
            return data;
        }
    }
}