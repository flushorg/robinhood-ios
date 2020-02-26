import _ from "lodash"
import md5 from "md5";

export const getMerchantByPattern = (store, url) => {
	var t0 = performance.now();
	let result =  _.find(store.getState().merchants, (merchant) => {
		try {
			let domainRx = new RegExp("^((\\w|\\d)*:\\/\\/)?((\\w|\\d|\\-|\\‒|\\–|\\—|\\―)+\\.)*" + merchant.rxSource, 'g');
			return (url.search(domainRx) !== -1);
		} catch (Exception){
			return false;
		}
	});
	var t1 = performance.now();
	console.log("getMerchantByPattern took " + ((t1 - t0)/1000) + " seconds.")
	return result;
};

export const reloadMerchantVouchers = (currentMerchant, callback) => {
	let timeGetter = new Date();
	if (!currentMerchant){
		callback && callback(currentMerchant);
		return;
	}
	if (!currentMerchant.vouchers || (currentMerchant.lastVouchersUpdate &&
		currentMerchant.lastVouchersUpdate < timeGetter.getTime() - 60 * 60 * 1000)) {
		let voucherLink =''
		voucherLink = "https://cdn.robinhood.club/json/merchants/" + md5(currentMerchant.id)+".json";

		new Promise((resolve, reject) => {
			let xhr = new XMLHttpRequest();
			xhr.open('GET', voucherLink);
			xhr.onload = function () {
				if (xhr.status === 200) {
					let merchantData = JSON.parse(xhr.response);
					currentMerchant.vouchers = merchantData.vouchers;
					currentMerchant.couponCount = merchantData.vouchers.length;
					currentMerchant.lastVouchersUpdate = timeGetter.getTime();


					callback && callback(currentMerchant);
				} else {
					reject(xhr);
				}
			};
			xhr.send();
		});
	} else {
		callback && callback(currentMerchant);
	}
};

export const getMerchantByPatternList = (list, url) => {
	return  _.find(list, (merchant) => {
		try {
			let domainRx = new RegExp("^((\\w|\\d)*:\\/\\/)?((\\w|\\d|\\-|\\‒|\\–|\\—|\\―)+\\.)*" + merchant.rxSource, 'g');
			return (url.search(domainRx) !== -1);
		} catch (Exception){
			return false;
		}
	});
};

export const getMerchantByName = (store, name) => {
	return _.find(store.getState().merchants, (merchant) => {
		let merchToLowerCase = merchant.name.toLowerCase().trim();
		let nameToLowerCase = name.toLowerCase().trim();
		if (merchant.domain.toLowerCase().trim() === nameToLowerCase) return merchant;
		return (nameToLowerCase < merchToLowerCase ?
			merchToLowerCase.indexOf(nameToLowerCase) !== -1 :
			nameToLowerCase.indexOf(merchToLowerCase) !== -1)
	});
};

export const getMerchantByDomain = (store, domain) => {
	return _.find(store.getState().merchants, (merchant) => {
		return (domain === merchant.domain);
	});
};

export const getMerchantById = (store, id) => {
	return _.find(store.getState().merchants, (merchant) => {
		return (id === merchant.id);
	});
};

export const buildActivationLinkFast = (userId, url, domain, title, autoredirect, deeplink = false) => {
	let addonVersion = "app",
		encodedUrl = btoa(url),
		userAgent = btoa(window.navigator.userAgent),
		encodedTitle = encodeURIComponent(title);
	if(!deeplink){
	return 'https://api.robinhood.club/redirectAddonFast.php?data=' + btoa(
		'uid=' + userId +
		'&addonVersion=' + addonVersion +
		'&locale=' + navigator.language +
		'&url=' + encodedUrl +
		'&domain=' + domain +
		'&title=' + encodedTitle +
		'&userAgent=' + userAgent +
		'&autoRedirect=' + autoredirect);
	}else{
		return 'https://api.robinhood.club/redirectAddonFast.php?data=' + btoa(
			'uid=' + userId +
			'&addonVersion=' + addonVersion +
			'&locale=' + navigator.language +
			'&url=' + encodedUrl +
			'&domain=' + domain +
			'&title=' + encodedTitle +
			'&userAgent=' + userAgent +
			'&deeplink=true' +
			'&autoRedirect=' + autoredirect);
	}
};


export const buildActivationLink = (userId, url, domain, title, autoredirect) => {
	let addonVersion = "app",
		encodedUrl = btoa(url),
		userAgent = btoa(window.navigator.userAgent),
		encodedTitle = encodeURIComponent(title);
	return 'https://api.robinhood.club/redirectAddon.php?data=' + btoa(
		'uid=' + userId +
		'&addonVersion=' + addonVersion +
		'&locale=' + navigator.language +
		'&url=' + encodedUrl +
		'&domain=' + domain +
		'&title=' + encodedTitle +
		'&userAgent=' + userAgent +
		'&autoRedirect=' + autoredirect);
};

export const buildRedirectUrl = (link) => {
	return new Promise((resolve, reject) => {
		let xhr = new XMLHttpRequest();
		xhr.open('GET', link);
		xhr.withCredentials = true;
		xhr.onload = function () {
			if (xhr.status === 200) {
				let resObj = JSON.parse(xhr.response);
				resolve(resObj);
			} else {
				reject(xhr);
			}
		};
		xhr.send();
	});
};