import React from 'react';
import Swal from 'sweetalert2'; //https://sweetalert2.github.io
import { withRouter } from 'react-router-dom';
import Utils from '../../utils';


class BuyHpEasy extends React.Component {
    constructor(props) {
        super();

        this.state = {
        }
    }

    async componentDidUpdate(prevProps) {
        if (((this.props.pageIsReady !== prevProps.pageIsReady) && this.props.isRegistered && this.props.easyBalance !== -1)
            || ((this.props.isRegistered !== prevProps.isRegistered) && this.props.pageIsReady && this.props.easyBalance !== -1)
            || ((this.props.easyBalance !== prevProps.easyBalance) && this.props.isRegistered && this.props.pageIsReady)) {

            let payment = await Utils.getPaymentStatusForCurrentUser();
            this.secondPaymentStep(payment);
        }
    }

    changeLoader(showLoader) {
        this.props.onLoaderChange(showLoader);
    }

    async handleBuyHpEasy() {
        if (!this.props.isRegistered) {
            Swal.fire({
                icon: 'warning',
                title: 'Not logged in',
                showCancelButton: true,
                cancelButtonText: 'Got it',
                confirmButtonText: 'Ok, let\'s login/register',
                html: "<p>To purchase HPEASY you need to login to your dashboard</p><p>If you want to login to your dashboard, please go to home page and press 'LOGIN/REGISTER' button</p>"
            }).then((result) => {
                if (result.isConfirmed) {
                    this.props.history.push('/');
                }
            });;
            return;
        }

        if (!this.props.isRenew && this.props.hpeasyCooldownTime * 1000 >= (new Date() - 86400 * 1000) && this.props.hpeasyCooldownNum >= 3) {
            Swal.fire({
                icon: 'warning',
                title: 'Reached 24h limit',
                confirmButtonText: 'Ok, I\'ll try later',
                html: "<p>You have reached 24h purchase limit</p><p>Please retry later</p>"
            });
            return;
        }
        else if (!this.props.isRenew) {
            this.buyHpEasy();
        } else {
            this.renew();
        }
    }

    async buyHpEasy() {
        let payment = await Utils.getPaymentStatusForCurrentUser();

        if (!payment.isEthPaid && !payment.isTokensPaid) {
            this.payEthForPurchase(this.props.useToken);
        } else {
            this.secondPaymentStep(payment, "purchase");
        }
    }

    async renew() {
        let payment = await Utils.getPaymentStatusForCurrentUser();

        if (!payment.isEthPaid && !payment.isTokensPaid) {
            this.payEthForRenew(this.props.useToken);
        } else {
            this.secondPaymentStep(payment, "renew");
        }
    }

    async secondPaymentStep(payment, actionName) {
        if (!actionName) actionName = payment.isRenew ? "renew" : "purchase";

        if (!payment.isEthPaid && payment.isTokensPaid) {
            Swal.fire({
                title: 'One step left',
                icon: 'info',
                html: "<p>We have noticed that you've already paid " + this.props.PURCHASE_COST_ETH / 1000000000000000000 + "&nbsp;EASY. </p><p> To finish your " + actionName + " please pay " + this.props.PURCHASE_COST_ETH / 1000000000000000000 + "&nbsp;ETH</p>",
                showCancelButton: true,
                confirmButtonText: 'Ok, let\'s do it',
                cancelButtonText: 'I\'ll do it later',
            }).then((result) => {
                if (result.isConfirmed) {
                    console.log(payment);
                    console.log(payment.matrixToRenew);
                    if (payment.matrixToRenew === "0") {
                        console.log("purchase")
                        this.payEthForPurchase(false);
                    } else {
                        console.log("renew")
                        this.payEthForRenew(false);
                    }
                }
            });
        } else if (payment.isEthPaid && !payment.isTokensPaid) {
            let isExtraTokensNeeded = this.props.easyBalance - this.props.PURCHASE_COST_ETH / 1000000000000000000 < 0;
            let html = "<p>We have noticed that you've already paid " + this.props.PURCHASE_COST_ETH / 1000000000000000000 + "&nbsp;ETH. </p>";
            html += "<p> To finish your " + actionName + " please pay <b>" + this.props.PURCHASE_COST_ETH / 1000000000000000000 + "&nbsp;EASY</b><br>" + (isExtraTokensNeeded
                ? "<i>(it costs just <b>" + this.props.PURCHASE_COST_EASY_ETH_EQUIVALENT / 1000000000000000000 + "&nbsp;ETH</i></b>)</p>"
                : "<i>(it will be withdrawn from your&nbsp;EASY balance)</i>");

            Swal.fire({
                title: 'One step left',
                icon: 'info',
                html: html,
                showCancelButton: true,
                confirmButtonText: 'Ok, let\'s do it',
                cancelButtonText: 'I\'ll do it later',
            }).then((result) => {
                if (result.isConfirmed) {
                    this.payEasy(false, payment.matrix_to_renew > 0, isExtraTokensNeeded);
                }
            });
        }
    }

    async payEthForRenew(isTokenPaymentNeeded) {
        this.changeLoader(true);

        await Utils.renewInEth(this.props.PURCHASE_COST_ETH, this.props.matrixToRenew)
            .then(
                result => {
                    let isExtraTokensNeeded = this.props.easyBalance - this.props.PURCHASE_COST_ETH / 1000000000000000000 < 0;
                    let html = !isTokenPaymentNeeded
                        ? "Congradulation! You have renewed your position for current HP"
                        : "Nice, " + this.props.PURCHASE_COST_ETH / 1000000000000000000 + "&nbsp;ETH is paid! <p>  Now you need to pay <b>" + this.props.PURCHASE_COST_ETH / 1000000000000000000 + "&nbsp;EASY</b><br>" + (isExtraTokensNeeded
                            ? "<i>(it costs just <b>" + this.props.PURCHASE_COST_EASY_ETH_EQUIVALENT / 1000000000000000000 + "&nbsp;ETH</i></b>)</p>"
                            : "<i>(it will be withdrawn from your EASY balance)</i></p>");

                    Swal.fire({
                        icon: isTokenPaymentNeeded ? 'info' : 'success',
                        title: isTokenPaymentNeeded ? 'Second step' : 'Success',
                        showCancelButton: isTokenPaymentNeeded,
                        confirmButtonText: isTokenPaymentNeeded ? 'Pay EASY' : 'Great',
                        cancelButtonText: 'I\'ll do it later',
                        html: html
                    }).then((result) => {
                        if (result.isConfirmed && isTokenPaymentNeeded) {
                            this.payEasy(false, true, isExtraTokensNeeded);
                        } else if (result.isConfirmed && !isTokenPaymentNeeded) {
                            window.location.reload();
                        }
                        this.changeLoader(false);
                    });
                },
                error => {
                    this.handleUnsuccessfulPayment(error, 'Ok, I\'ll check result manually')
                }
            ).catch(err => {
                this.changeLoader(false);
                console.error("Error");
                console.error(err);
            });
    }

    async payEthForPurchase(isTokenPaymentNeeded) {
        this.changeLoader(true);

        await Utils.purchaseInEth(this.props.PURCHASE_COST_ETH)
            .then(
                result => {
                    let isExtraTokensNeeded = this.props.easyBalance - this.props.PURCHASE_COST_ETH / 1000000000000000000 < 0;
                    let html = !isTokenPaymentNeeded
                        ? "Congradulation! You have purchased one more HPEASY"
                        : "Nice, " + this.props.PURCHASE_COST_ETH / 1000000000000000000 + "&nbsp;ETH is paid! <br>  <p>Now you need to pay <b>" + this.props.PURCHASE_COST_ETH / 1000000000000000000 + "&nbsp;EASY</b><br>" + (isExtraTokensNeeded
                            ? "<i>(it costs just <b>" + this.props.PURCHASE_COST_EASY_ETH_EQUIVALENT / 1000000000000000000 + "&nbsp;ETH</i></b>)</p>"
                            : "<i>(it will be withdrawn from your EASY balance)</i></p>");
                    Swal.fire({
                        icon: isTokenPaymentNeeded ? 'info' : 'success',
                        title: isTokenPaymentNeeded ? 'Second step' : 'Success',
                        showCancelButton: isTokenPaymentNeeded,
                        confirmButtonText: isTokenPaymentNeeded ? 'Pay EASY' : 'Great',
                        cancelButtonText: 'I\'ll do it later',
                        html: html
                    }).then((result) => {
                        if (result.isConfirmed && isTokenPaymentNeeded) {
                            this.payEasy(false, false, isExtraTokensNeeded);
                        } else if (result.isConfirmed && !isTokenPaymentNeeded) {
                            window.location.reload();
                        } else {
                            this.changeLoader(false);
                        }
                    });
                },
                error => {
                    this.handleUnsuccessfulPayment(error, 'Ok, let\'s reload and check result');
                }
            ).catch(err => {
                this.changeLoader(false);
                console.error("Error");
                console.error(err);
            });
    }

    async payEasy(isEthPaymentNeeded, isRenew, isExtraTokensNeeded) {
        this.changeLoader(true);

        if (isExtraTokensNeeded) {
            await Utils.payAndSendEasy(this.props.PURCHASE_COST_EASY_ETH_EQUIVALENT)
                .then(
                    result => this.handleSuccessfulPayment(isEthPaymentNeeded, isRenew, isExtraTokensNeeded),
                    error => this.handleUnsuccessfulPayment(error, 'Ok, let\'s reload and check result'))
                .catch(
                    err => {
                        this.changeLoader(false);
                        console.error("Error");
                        console.error(err);
                    });
        } else {
            await Utils.sendEasy(this.props.PURCHASE_COST_EASY)
                .then(
                    result => this.handleSuccessfulPayment(isEthPaymentNeeded, isRenew, isExtraTokensNeeded),
                    error => this.handleUnsuccessfulPayment(error, 'Ok, let\'s reload and check result'))
                .catch(
                    err => {
                        console.log("Extra catch log");
                        this.changeLoader(false);
                        console.error("Error");
                        console.error(err);
                    });
        }
    }

    async handleSuccessfulPayment(isEthPaymentNeeded, isRenew, isExtraTokensNeeded) {
        let html = isEthPaymentNeeded ?
            "Nice, " + this.props.PURCHASE_COST_ETH / 1000000000000000000 + "&nbsp;EASY is paid! <p> Now you need to pay" + this.props.PURCHASE_COST_ETH / 1000000000000000000 + "&nbsp;ETH</p>"
            : "Congradulation! You " + (isRenew ? "have renewed your position" : "have purchased one more HPEASY");

        Swal.fire({
            icon: isEthPaymentNeeded ? 'info' : 'success',
            title: isEthPaymentNeeded ? 'Second step' : 'Success',
            showCancelButton: isEthPaymentNeeded,
            confirmButtonText: isEthPaymentNeeded ? 'Pay ' + this.props.PURCHASE_COST_ETH / 1000000000000000000 + '&nbsp;ETH' : 'Great',
            cancelButtonText: 'I\'ll do it later',
            html: html
        }).then((result) => {
            if (result.isConfirmed && isEthPaymentNeeded) {
                if (!isRenew) {
                    this.payEthForPurchase(false);
                } else {
                    this.payEthForRenew(false);
                }

            } else if (result.isConfirmed && !isEthPaymentNeeded) {
                window.location.reload();
            }
            this.changeLoader(false);
        });
    }

    async handleUnsuccessfulPayment(error, okButtonText) {
        Swal.fire({
            icon: 'error',
            title: 'Fail',
            html: error
        }).then(result => {
            this.changeLoader(false);
        });
    }

    render() {

        return (
            <div className={this.props.isRenew ? "hp_button renew readonly" : "hp_button readonly"} id="purchase" onClick={this.handleBuyHpEasy.bind(this)}>
                {!this.props.isRenew
                    ? "Buy HPEASY: " + this.props.PURCHASE_COST_ETH / 1000000000000000000 + " ETH/EASY"
                    : "Renew for " + this.props.PURCHASE_COST_ETH / 1000000000000000000 + " ETH/EASY"}
            </div>
        )
    }
}

export default withRouter(BuyHpEasy);
