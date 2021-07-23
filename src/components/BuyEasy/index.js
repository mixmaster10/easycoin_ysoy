import React from 'react';
import Swal from 'sweetalert2'; //https://sweetalert2.github.io
import { myConfig } from '../../config.js';
import Utils from '../../utils';


class BuyEasy extends React.Component {
    async componentDidUpdate(prevProps) {
    }

    changeLoader(showLoader) {
        this.props.onLoaderChange(showLoader);
    }


    async handleBuyEasy() {
        if (!this.props.viewerAddress) {
            Swal.fire({
                title: 'Connection problem',
                icon: 'warning',
                html: "<p>Sorry, can't connect to ETHEREUM network.</p> <p>Please connect your Web3 provider <br><i>(<a href='" + myConfig.METAMASK_URL + "' target='_blank' rel='noopener noreferrer'>MetaMask</a> or other wallets that support online operations)</i></p>"
            })
            return;
        }

        const { value: easyAmount } = await Swal.fire({
            //icon: 'info',
            title: 'Buy IGL',
            input: 'number',
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value) {
                    return 'Entered value is empty or incorrect'
                }
            },
            html: 'Current exchange rate:<br>1 BNB&nbsp;=&nbsp;<b>' + this.props.ETH_TO_EASY + '&nbsp;IGL</b>. <p>How many IGL do you want to purchase</p>'
        })

        if (easyAmount) {
            let ethAmount = easyAmount / this.props.ETH_TO_EASY;
            Swal.fire({
                title: 'Buy IGL',
                showCancelButton: true,
                confirmButtonText: "Yes, purchase",
                html: '<p>Are you sure you want to purchase <b>' + easyAmount + '&nbsp;IGL</b>?<p>It will cost ' + ethAmount + '&nbsp;BNB</p>'
            }).then(result => {
                if (result.isConfirmed)
                    this.buyEasy(easyAmount, ethAmount);
            });
        }
    }

    async buyEasy(easyAmount, ethAmount) {
        this.changeLoader(true);

        await Utils.buyEasy((ethAmount * 1000000).toString() + "000000000000")
            .then(
                result => {
                    Swal.fire({
                        title: 'Success',
                        icon: 'success',
                        confirmButtonText: 'Great',
                        html: "Congradulation! You have purchased <b>" + easyAmount + "&nbsp;IGL</b>!<p>Add IGL smartcontract address <b>" + myConfig.CONTRACT_ADDRESS_EASYCOIN + "</b> to&nbsp;your ETHEREUM wallet</p><p>Current page will be reloaded</p>"
                    }).then((result) => {
                        this.changeLoader(false);
                        window.location.reload();
                    });
                },
                error => {
                    this.handleErroredTransaction(error, 'Ok, I\'ll check the result manually', true);
                }
            ).catch(err => {
                this.changeLoader(false);
                console.error("Error");
                console.error(err);
            });
    }

    handleErroredTransaction(error, okButtonText, doReload = true) {
        Swal.fire({
            icon: 'error',
            title: 'Fail',
            html: error
        }).then((result) => {
            console.log("General error");
            this.changeLoader(false);
        });
    }

    render() {
        return (
            <div className="easy-info">
                <div className="easy-balance-label">{this.props.isRegistered ? "YOUR" : "ACCOUNT"} BALANCE</div>
                <div className="easy-balance">{this.props.isRegistered
                    ? (this.props.easyBalance !== -1
                        ? (this.props.easyBalance < 1000000
                            ? this.props.easyBalance.toFixed(2) : (this.props.easyBalance / 1000000).toFixed(2) + "M")
                        : 0)
                    : (this.props.easyAccountBalance !== -1
                        ? (this.props.easyAccountBalance < 1000000
                            ? this.props.easyAccountBalance.toFixed(2) : (this.props.easyAccountBalance / 1000000).toFixed(2) + "M")
                        : 0)}<span>IGL</span></div>
                <div className="buy-easy" onClick={this.handleBuyEasy.bind(this)}>BUY IGL</div>
            </div>
        )
    }
}

export default BuyEasy;