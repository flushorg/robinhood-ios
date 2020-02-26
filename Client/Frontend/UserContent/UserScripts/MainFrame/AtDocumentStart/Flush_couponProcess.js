import React from "react"


/**
 * <br />
 * Show Gutschein-Code
 Code {this.props.ca._coupons[this.props.ca.index].code}
 *
 * */
class CouponProcess extends React.Component {
    constructor(props) {
        super(props);
        this.props = props;
        this.state = {
            alreadySaved: 0.00
        };
    }

    closeButtonClick(event) {
          if (this.props.ca.couponApplianceDone) {
            this.props.ca.couponApplianceDone();
        } else {
            sessionStorage._i_couponIndex = '';
            sessionStorage.status = '';
            sessionStorage.coupons = '';
            sessionStorage.price = '';
            sessionStorage.nextState = '';
            sessionStorage.currentDiscount = '';
            sessionStorage._coupon = '';
        }
        this.hideSlider();
    }

    setProgress() {
        let count = this.props.ca.index + 1;
        let leftPosition = (count - 1) / this.props.ca._coupons.length * 100 + '%';
        document.querySelector('#flushCouponProcessProgressbar').style.width = leftPosition;
        document.querySelector('#flushCouponProcessCircles').style.left = leftPosition;
    }

    componentDidUpdate() {
        this.setProgress();
    }

    componentDidMount() {
        this.setProgress();
    }

    render() {
        let count = Math.min(this.props.ca.index + 1, this.props.ca._coupons.length);

        if (this.props.ca.index > 0) {
            if (this.props.ca._coupons[this.props.ca.index - 1].discount > 0) {

                if (this.props.ca._coupons[this.props.ca.index - 1].discount > this.state.alreadySaved) {
                    this.setState({alreadySaved: this.props.ca._coupons[this.props.ca.index - 1].discount})
                }
            }
        }

        if (this.props.merchantDomain == 'amazon.de') {
            return (
                <div className="flush-coupon-process-special">
                    <div className="flush-coupon-process__logo"/>
                    <div className="flush-coupon-process-special__robin"/>
                    <div className="flush-coupon-process__container">
                        {this.props.merchant.hasSpecialOffer == true ? (
                            <div
                                className="flush-coupon-process-special__text">{this.props.translations.processSpecial}</div>
                        ) : (
                            <div
                                className="flush-coupon-process-special__text">{this.props.translations.process}</div>
                        )}

                        <div
                            className="flush-coupon-process__bottom">
                            <div className="flush-coupon-process__progressbar">
                                <div className="process-progressbar__line" id="flushCouponProcessProgressbar"/>
                                <div className="process-progressbar__circles" id="flushCouponProcessCircles">
                                    <div className="process-progressbar__circle-1"/>
                                    <div className="process-progressbar__circle-2"/>
                                    <div className="process-progressbar__circle-3"/>
                                    <div className="process-progressbar__circle-4"/>
                                </div>

                            </div>
                            {this.props.translations.tryingSpecial.replace("[specialdomain]", this.props.merchantDomain)}

                        </div>
                    </div>
                    <div className="flush-coupon-process__close-btn" onClick={this.closeButtonClick.bind(this)}></div>
                </div>
            );
        } else {
            return (
                <div className="flush-coupon-process">
                    <div className="flush-coupon-process__logo"/>
                    <div className="flush-coupon-process__fairy"/>
                    <div className="flush-coupon-process__container">
                        <div className="flush-coupon-process__text">{this.props.translations.process}

                        </div>
                        <div className="flush-coupon-process__progressbar">
                            <div className="process-progressbar__line" id="flushCouponProcessProgressbar"/>
                            <div className="process-progressbar__circles" id="flushCouponProcessCircles">
                                <div className="process-progressbar__circle-1"/>
                                <div className="process-progressbar__circle-2"/>
                                <div className="process-progressbar__circle-3"/>
                                <div className="process-progressbar__circle-4"/>
                            </div>

                        </div>
                        <div
                            className="flush-coupon-process__bottom">{this.props.translations.trying} {count} {this.props.translations.of} {this.props.ca._coupons.length}



                            {sessionStorage.currentDiscount > 0 ? (
                                <span className="flush-coupon-process__alreadySaved">
                                    - 💰 {this.props.translations.alreadySavedPre} {sessionStorage.currentDiscount.replace('.',',')} Euro {this.props.translations.alreadySavedAfter}
                                </span>
                            ) : (
                                this.state.alreadySaved > 0 ? (
                                    <span className="flush-coupon-process__alreadySaved">
                                    - 💰 {this.props.translations.alreadySavedPre} {this.state.alreadySaved.toFixed(2).replace('.',',')} Euro {this.props.translations.alreadySavedAfter}
                                </span>
                                ):(<span></span>)

                            )}

                        </div>
                    </div>
                    <div className="flush-coupon-process__close-btn" onClick={this.closeButtonClick.bind(this)}></div>
                </div>
            );
        }
    }

    hideSlider() {
        let caaProcess = document.querySelector('#flush-coupon-process-wrapper');
        if (caaProcess) {
            caaProcess.remove();
        }
    }
}

export default CouponProcess