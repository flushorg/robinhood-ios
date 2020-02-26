import React from "react"
import _ from 'lodash';

class CouponSuccess extends React.Component {
    constructor(props) {
        super(props);
        this.props = props;
    }

    facebookShareClick() {
        let facebook_appID = '339556879928264'
        let url = "https://www.facebook.com/dialog/share?app_id=" + facebook_appID + "&href=" + encodeURIComponent("http://www.robinhood.club") +
            "&display=popup" +
            "&redirect_uri=https://www.facebook.com";
        window.open(url);
    }

    facebookMessengerShareClick() {
        let facebook_appID = '339556879928264'
        let shareUrl = "http://www.robinhood.club";
        let url = 'fb-messenger://share?link=' + encodeURIComponent(shareUrl) + '&app_id=' + encodeURIComponent(facebook_appID);
        window.open(url);
    }

    twitterShareClick() {
        let shareUrl = "http://www.robinhood.club";
        let hashtags = "robinhood,gutscheine,autogutscheine";
        let url = "https://twitter.com/intent/tweet?url=https%3A%2F%2Fwww.robinhood.club%2F%3Fid%3D3&text=" + encodeURIComponent(shareUrl) + "&via=robinhoodclub&hashtags=" + encodeURIComponent(hashtags);
        window.open(url);
    }


    addVoucherClick() {

    }

    continueButtonClick() {
          this.props.ca.clearStorage();
        delete sessionStorage.rules;
        sessionStorage.translations = '';
        this.hideSlider();
    }


    render() {
        let locale = navigator.language === 'de' || navigator.language === 'de-DE' ? 'de' : 'en';

        let heading = this.props.translations.caa.lot.gptLotHead;
        let desc = this.props.translations.caa.lot.gotLot;

        if (!this.props.lot) {
            let rand = _.sample(this.props.translations.caa.lot.random);
            heading = rand.head;
            desc = rand.desc;
        }

        let getPrice = function(price){
            if (typeof price === 'string' || price instanceof String){
                return parseFloat(price);
            }
            return price;
        };

        let isSpecialShop = false;
        if(this.props.merchant.domain === 'amazon.de'){
            isSpecialShop = true;
        }

        return (
            <div>
                {this.props.ca._coupon && this.props.ca._coupon.discount ? (
                    <div className={"flush-coupon-success " + locale + "-cont"}>
                        <div className="flush-coupon-success__logo"/>
                        <div className={"flush-coupon-success__container " + locale + "-cont" + (!isSpecialShop ? " flush-coupon-success-normal__container " : " flush-coupon-success-special__container ")}>
                            <div className="flush-coupon-success__saved">
                            <span
                                className={"flush-coupon-success__saved__text"}>{this.props.translations.caa.successJustSaved}</span>&nbsp;
                                <span
                                    className={"flush-coupon-success__saved__amount"}>€{this.props.ca._coupon.discount.toFixed(2).replace('.',',')}</span>
                            </div>
                            <hr/>

                            <div className="flush-coupon-success__line">
                                <div
                                    className={"flush-coupon-success__line__left " + locale + "-small"}>{this.props.translations.caa.successWithoutRobinsFairy}</div>
                                <div
                                    className={"flush-coupon-success__line__right " + locale + "-small"}>€{getPrice(this.props.ca._price).toFixed(2).replace('.',',')}</div>
                            </div>
                            <div className="flush-coupon-success__line">
                                <div
                                    className={"flush-coupon-success__line__left " + locale + "-small"}>{this.props.translations.caa.successWithRobinsFairy}</div>
                                <div
                                    className={"flush-coupon-success__line__right flush-coupon-success__line__highlight " + locale + "-small"}>€{this.props.ca._coupon.total.toFixed(2).replace('.',',')}</div>
                            </div>
                            <hr/>
                            <br/>
                            <div className={"flush-coupon-success__continue " + locale + "-button"}
                                 onClick={this.continueButtonClick.bind(this)}>
                                {this.props.translations.caa.successDiscountButtonText}
                            </div>

                        </div>
                        {this.props.ca._coupon && this.props.ca._coupon.discount ?
                            <div className={!isSpecialShop ? 'flush-coupon-success__rating' : 'flush-coupon-success-special__rating'}>
                                <div className="flush-coupon-success__close-btn"
                                     onClick={this.continueButtonClick.bind(this)}></div>
                                <div className={!isSpecialShop ? 'flush-coupon-success__ratingImage' : 'flush-coupon-success-special__ratingImage'}></div>
                                <div
                                    className={!isSpecialShop ? 'flush-coupon-success__recommend' : 'flush-coupon-success-special__recommend'}>{this.props.translations.caa.successYouLikeRobin}</div>
                                <div className="flush-coupon-success__recommendButton"></div>
                                <div className="flush-coupon-success__shareFacebook"
                                     onClick={this.facebookShareClick.bind(this)}></div>
                                <div className="flush-coupon-success__shareTwitter"
                                     onClick={this.twitterShareClick.bind(this)}></div>
                                <div className="flush-coupon-success__shareMessenger"
                                     onClick={this.facebookMessengerShareClick.bind(this)}></div>

                                <a className="flush-coupon-success__help"
                                   href="https://www.robinhood.club/extension-feedback"
                                   target="_blank">{this.props.translations.caa.successProblems}</a>
                            </div>
                            : <div></div>
                        }
                    </div>
                ) : (
                    <div className={"flush-coupon-nosuccess " + locale + "-cont"}>
                        <div className="flush-coupon-success__logo"/>
                        <div className="flush-coupon-nosuccess__container">
                            <div className="flush-coupon-nosuccess__oben">
                                <div
                                    className="flush-coupon-success__noDiscountHeadline">{heading}</div>
                                <div
                                    className="flush-coupon-success__notsaved_text">{desc}</div>
                            </div>
                            <div className="flush-coupon-nosuccess__unten">
                                <div className={"flush-coupon-nosuccess__continue " + locale + "-button"}
                                     onClick={this.continueButtonClick.bind(this)}>
                                    {this.props.translations.caa.noDiscountButtonText}
                                </div>
                                <div className="flush-coupon-success__noDiscountImage"></div>
                                <div
                                    className="flush-coupon-success__noDiscountVoucherShare">{this.props.translations.caa.noDiscountVoucherShare} </div>
                                <div
                                    className="flush-coupon-success__noDiscountVoucherShareButton"
                                    onClick={this.addVoucherClick.bind(this)}>{this.props.translations.caa.noDiscountVoucherShareButton} </div>
                            </div>
                            <div className="flush-coupon-nosuccess__close-btn"
                                 onClick={this.continueButtonClick.bind(this)}></div>
                        </div>
                    </div>
                )}

            </div>
        );
    }

    hideSlider() {
        let caaSuccess = document.querySelector('#flush-coupon-success-wrapper');
        if (caaSuccess) {
            caaSuccess.remove();
        }
    }
}

export default CouponSuccess;