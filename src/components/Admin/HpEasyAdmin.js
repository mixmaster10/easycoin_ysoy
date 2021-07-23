import React from 'react';
import Swal from 'sweetalert2'; //https://sweetalert2.github.io
import { myConfig } from '../../config.js';
import Utils from '../../utils';
import './Admin.scss';


class HpEasyAdmin extends React.Component {
    constructor(props) {
        super();

        this.state = {
            balance: 0,
            useToken: true,
            transferAmount: 0,
            transferAddress: '',
            registrationCost: 0,
            registrationCostCandidate: 0,
            bunchCyclesLimit: 0,
            bunchCyclesLimitCandidate: 0,
            owner: '',
            newOwnerCandidate: '',
            lastCycle: '',
            skippedHpEasysOffset: '',
            nextCycleMatrix: '',
            nextCycleHp: '',
            jackpotLoad: [],
        }

        this.initData();
    }

    changeLoader(show) {
        this.props.onLoaderChange(show);
    }

    async initData() {
        this.getRegistrationCost();
        this.getUseToken();
        this.getBunchCyclesLimit();
        this.getCyclesInfo();
        this.getBalance();
    }

    // #region INIT
    async getRegistrationCost() {
        let registrationCost = await Utils.getRegistrationCost();
        if (registrationCost !== null) {
            this.setState({ registrationCost: registrationCost });
        }
    }

    async getUseToken() {
        let useToken = await Utils.getUseToken();
        if (useToken === null) return;
        this.setState({ useToken: useToken });
    }

    async getBunchCyclesLimit() {
        let bunchCyclesLimit = await Utils.getBunchCyclesLimit();
        if (bunchCyclesLimit !== null) {
            this.setState({ bunchCyclesLimit: bunchCyclesLimit });
        }
    }

    async getCyclesInfo() {
        let lastCycle = await Utils.getLastCycle();
        if (lastCycle === null) return;
        this.setState({ lastCycle: lastCycle });

        let skippedHpEasysOffset = await Utils.getSkippedHpsOffset();
        if (skippedHpEasysOffset === null) return;
        this.setState({ skippedHpEasysOffset: skippedHpEasysOffset });

        let nextCycleHPId = lastCycle + skippedHpEasysOffset;
        let nextCycleHp = await Utils.getHpEasy(nextCycleHPId);
        let nextCycleUser = await Utils.getUserByAddressClean(nextCycleHp.owner);

        this.setState({ nextCycleHp: nextCycleHPId });
        this.setState({ nextCycleMatrix: nextCycleHp.matrixId });
        this.setState({ nextCycleUser: nextCycleUser.userId });
    }

    async getBalance() {
        let balance = await Utils.getHpEthBalance();

        if (typeof balance !== 'undefined' && balance !== null && balance > 0) {
            this.setState({ balance: balance / 1000000000000000000 });
        }
    }
    // #endregion

    async showGeneralError(error) {
        if (typeof error !== 'string') console.error(error);

        Swal.fire({
            icon: 'error',
            title: 'Fail',
            html: error
        }).then(result => {
            this.changeLoader(false);
        });
    }

    async showCatchError(error) {
        Swal.fire({
            icon: 'error',
            title: 'Fail',
            html: error
        });
        console.log("Error");
        console.error(error);
    }

    // #region REGISTRATION COST
    handleRegistrationCostValueChange(event) {
        if (event.target.value <= 0) return;

        this.setState({ registrationCostCandidate: parseFloat(event.target.value) });
    }

    async handleChageRegistrationCost() {
        if (typeof this.state.registrationCostCandidate === 'undefined' || this.state.registrationCostCandidate === null || this.state.registrationCostCandidate === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Not correct value',
                text: 'New registration cost should be greater then 0'
            })
            return;
        }

        this.changeLoader(true);

        Swal.fire({
            icon: 'question',
            title: 'Confirm registration cost change',
            showCancelButton: true,
            html: 'Are you sure you want to change registration price to <b>' + this.state.registrationCostCandidate + " BNB/IGL</b> <br>(old registration cost is <i><b>" + this.state.registrationCost / 1000000000000000000 + "BNB/IGL</b></i>)"
        }).then((result) => {
            if (result.isConfirmed) {
                this.chageRegistrationCost();
            } else {
                this.changeLoader(false);
            }
        });
    }

    async chageRegistrationCost() {
        await Utils.changeRegistrationCost((this.state.registrationCostCandidate * 1000000).toString() + "000000000000")
            .then(
                result => {
                    console.log(result);
                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        html: 'Nice! Registration cost has been changed to ' + this.state.registrationCostCandidate + ' BNB/IGL. <br>Current page will be reloaded'
                    }).then(result => {
                        this.changeLoader(false);
                        window.location.reload();
                    });
                },
                error => {
                    this.showGeneralError(error);
                }
            ).catch(error => {
                this.showCatchError(error);
            });;
    }
    // #endregion

    // #region BUNCH CYCLES
    handleBunchCyclesValueChange(event) {
        if (event.target.value <= 0) return;

        this.setState({ bunchCyclesLimitCandidate: parseInt(event.target.value) });
    }

    async handleChageBunchCycles() {
        if (typeof this.state.bunchCyclesLimitCandidate === 'undefined' || this.state.bunchCyclesLimitCandidate === null || this.state.bunchCyclesLimitCandidate === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Not correct value',
                text: 'Bunch cycles limit should be greater then 0'
            })
            return;
        }

        this.changeLoader(true);

        Swal.fire({
            icon: 'question',
            title: 'Confirm bunch cycles limit change',
            showCancelButton: true,
            html: 'Are you sure you want to change bunch cycles limit to <b>' + this.state.bunchCyclesLimitCandidate + "</b> <br>(old bunch cycles limit is <i><b>" + this.state.bunchCyclesLimit + "</b></i>)"
        }).then((result) => {
            if (result.isConfirmed) {
                this.changeBunchCyclesLimit();
            } else {
                this.changeLoader(false);
            }
        });
    }

    async changeBunchCyclesLimit() {
        await Utils.changeBunchCyclesLimit(this.state.bunchCyclesLimitCandidate)
            .then(
                result => {
                    console.log(result);
                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        html: 'Nice! Bunch cycles limit has been changed to ' + this.state.bunchCyclesLimitCandidate + '. <br>Current page will be reloaded'
                    }).then(result => {
                        this.changeLoader(false);
                        window.location.reload();
                    });
                },
                error => {
                    this.showGeneralError(error);
                }
            ).catch(error => {
                this.showCatchError(error);
            });;
    }
    // #endregion

    // #region TRANSFER
    handleTransferAmountChange(event) {
        let transferAmount = event.target.value;

        if (transferAmount <= 0) return;

        if (transferAmount > this.state.balance) {
            Swal.fire({
                icon: 'warning',
                title: 'Not enough funds',
                text: 'Contract balance is <b>' + this.state.balance + ' BNB</b>, and it\'s less than the entered transfer amount ' + transferAmount + ' ETH'
            })
            return;
        } else {
            this.setState({ transferAmount: parseFloat(event.target.value) });
        }
    }

    async handleTransferAddressChange(event) {
        let transferAddress = event.target.value;

        if (await Utils.isValidAddress(transferAddress)) {
            this.setState({ transferAddress: transferAddress });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Not valid address',
                html: 'Sorry, but provided input data <b>' + transferAddress + "</b> is not a valid ETHEREUM address"
            });
        }
    }

    async handleTransfer() {
        if (this.state.transferAmount > this.state.balance) {
            Swal.fire({
                icon: 'warning',
                title: 'Not enough funds',
                text: 'Contract balance is less than the entered transfer amount'
            })
            return;
        }

        if (!this.state.transferAddress) {
            Swal.fire({
                icon: 'warning',
                title: 'Not correct address',
                text: 'Not valid recipient ETHEREUM address'
            })
            return;
        }

        this.changeLoader(true);

        Swal.fire({
            icon: 'question',
            title: 'Confirm transfer funds',
            showCancelButton: true,
            html: 'Are you sure you want to transfer <b>' + this.state.transferAmount + " ETH</b> from <b>IGL&nbsp;smartcontract</b> to <b>" + this.state.transferAddress + "</b> address? This action is irreversible!"
        }).then((result) => {
            if (result.isConfirmed) {
                this.transferFunds();
            } else {
                this.changeLoader(false);
            }
        });
    }

    async transferFunds() {
        await Utils.transferFundsFromHpEasy(this.state.transferAddress, (this.state.transferAmount * 1000000).toString() + "000000000000")
            .then(
                result => {
                    console.log(result);
                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        html: 'Nice! <b>' + this.state.transferAmount + 'BNB</b>s were transfered to <b>' + this.state.transferAddress + '</b>. '
                    }).then(result => {
                        this.changeLoader(false);
                    });
                },
                error => {
                    Swal.fire({
                        icon: 'error',
                        title: 'Fail',
                        html: error
                    }).then(result => {
                        this.changeLoader(false);
                    });
                }
            ).catch(error => {
                Swal.fire({
                    icon: 'error',
                    title: 'Fail',
                    html: error
                }).then(result => {
                    this.changeLoader(false);
                });
                console.log("Error");
                console.error(error);
            });
    }
    // #endregion

    // #region NEW OWNER

    async handleChageUseToken(event) {
        Swal.fire({
            icon: 'question',
            title: 'Confirm token use change police',
            showCancelButton: true,
            html: 'Are you sure you want to change token use policy? <br></i>(current token policy is <b>' + (this.state.useToken ?  '' : 'not') + ' to use</b> IGL COIN as payment method</i>)'
        }).then((result) => {
            if (result.isConfirmed) {
                this.chageUseToken();
            } else {
                this.changeLoader(false);
            }
        });
    }

    async chageUseToken() {
        await Utils.changeUseToken()
            .then(
                result => {
                    console.log(result);
                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        html: 'Nice! IGL COIN use policy has been changed!<br>Current page will be reloaded'
                    }).then(result => {
                        this.changeLoader(false);
                        window.location.reload();
                    });
                },
                error => {
                    this.showGeneralError(error);
                }
            ).catch(error => {
                this.showCatchError(error);
            });;
    }
    // #endregion

    // #region NEW OWNER
    async handleNewOwnerValueChange(event) {
        let address = event.target.value;
        if (await Utils.isValidAddress(address)) {
            this.setState({ newOwnerCandidate: address });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Not valid address',
                html: 'Sorry, but provided input data <b>' + address + "</b> is not a valid ETHEREUM address"
            });
        }
    }

    async handleChangeOwner() {
        if (!this.state.newOwnerCandidate) {
            Swal.fire({
                icon: 'warning',
                title: 'Not correct value',
                text: 'Not valid ETHEREUM address'
            })
            return;
        }

        this.changeLoader(true);

        Swal.fire({
            icon: 'question',
            title: 'Confirm owner change',
            showCancelButton: true,
            html: 'Are you sure you want to change <b>INFINITY GLOBAL contract</b> owner to <b>' + this.state.newOwnerCandidate + "</b> <br>(current contract owner is <i>" + this.props.owner + "</i>)"
        }).then((result) => {
            if (result.isConfirmed) {
                this.chageOwner();
            } else {
                this.changeLoader(false);
            }
        });
    }

    async chageOwner() {
        await Utils.changeOwner(this.state.newOwnerCandidate, myConfig.CONTRACT_ADDRESS_HPEASY)
            .then(
                result => {
                    console.log(result);
                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        html: 'Nice! INFINITY GLOBAL contract ownership has been transfered to <b>' + this.state.newOwnerCandidate + '</b>. <br>New contract owner must login to this page and accept ownership, meanwhile <b>' + this.props.owner + '</b> will stay the contract owner<br>Current page will be reloaded'
                    }).then(result => {
                        this.changeLoader(false);
                        window.location.reload();
                    });
                },
                error => {
                    this.showGeneralError(error);
                }
            ).catch(error => {
                this.showCatchError(error);
            });;
    }
    // #endregion


    render() {
        return (
            <div className="admin-sub-block">
                <h1>INFINITY GLOBAL ADMIN</h1>
                <p>Contract address:
                    <a target="_blank" rel="noopener noreferrer" href={myConfig.ETHERSCAN_DOMAIN + "address/" + myConfig.CONTRACT_ADDRESS_HPEASY}>{myConfig.CONTRACT_ADDRESS_HPEASY}</a>
                </p>

                <h3>Registration cost</h3>
                <div className="data-change-container">
                    <div className="subDiv">
                        <label>
                            CURRENT REGISTRATION COST:
                        </label>
                        <div className="num-value">
                            {this.state.registrationCost / 1000000000000000000} BNB/IGL
                        </div>
                    </div>
                    <div className="subDiv">
                        <label>
                            NEW REGISTRATION COST:
                        </label>
                        <input type="number" className="numberInput" onChange={this.handleRegistrationCostValueChange.bind(this)} />
                        <div> BNB</div>
                        <div className="confirm-button" onClick={this.handleChageRegistrationCost.bind(this)}>Change</div>
                    </div>
                </div>

                <h3>Bunch cycles limit</h3>
                <div className="data-change-container">
                    <div className="subDiv">
                        <label>
                            CURRENT BUNCH CYCLES LIMIT:
                        </label>
                        <div className="num-value">
                            {this.state.bunchCyclesLimit}
                        </div>
                    </div>
                    <div className="subDiv">
                        <label>
                            NEW BUNCH CYCLES LIMIT:
                        </label>
                        <input type="number" className="numberInput" onChange={this.handleBunchCyclesValueChange.bind(this)} />
                        <div> BNB</div>
                        <div className="confirm-button" onClick={this.handleChageBunchCycles.bind(this)}>Change</div>
                    </div>
                </div>

                <h3>Use token payment</h3>
                <div className="data-change-container">
                    <div className="subDiv">
                        <label>
                            USE TOKEN PAYMENT:
                        </label>
                        <div className="num-value">
                            {this.state.useToken.toString()}
                        </div>
                        <div className="confirm-button" onClick={this.handleChageUseToken.bind(this)}>Change</div>
                    </div>
                </div>

                <h3>Cycles statistics</h3>
                <div className="data-change-container">
                    <div className="subDiv">
                        <label>
                            CURRENT CYCLE:
                        </label>
                        <div className="num-value">
                            {this.state.lastCycle}
                        </div>
                    </div>
                    <div className="subDiv">
                        <label>
                            SKIPPED HPs:
                        </label>
                        <div className="num-value">
                            {this.state.skippedHpEasysOffset}
                        </div>
                    </div>
                    <div className="subDiv">
                        <label>
                            NEXT CYCLE INFO (if allowed):<br />
                            Matrix / User / HP
                        </label>
                        <div className="num-value">
                            {this.state.nextCycleMatrix} / {this.state.nextCycleUser} / {this.state.nextCycleHp}
                        </div>
                    </div>
                </div>

                <h3>INFINITY GLOBAL contract funds</h3>
                <div className="data-change-container">
                    <div className="subDiv">
                        <label>
                            TOTAL INFINITY GLOBAL BALANCE:
                        </label>
                        <div className="num-value">
                            {this.state.balance} BNB
                        </div>
                    </div>
                    <div className="subDiv">
                        <label>
                            TRANSFER AMOUNT:
                        </label>
                        <input type="number" className="numberInput" onChange={this.handleTransferAmountChange.bind(this)} />
                        <div> BNB</div>
                    </div>
                    <div className="subDiv">
                        <label className="short">
                            TRANSFER TO:
                        </label>
                        <input type="text" className="numberInput long" value={this.state.transferAddress} onChange={this.handleTransferAddressChange.bind(this)} />
                        <div className="confirm-button" onClick={this.handleTransfer.bind(this)}>Transfer</div>
                    </div>
                </div>

                <h3>INFINITY GLOBAL smartcontract owner</h3>
                <div className="data-change-container">
                    <div className="subDiv">
                        <label className="short">
                            CURRENT OWNER:
                        </label>
                        <div className="num-value">
                            {this.props.owner}
                        </div>
                    </div>
                    <div className="subDiv" style={{ display: this.props.unaccaptedOwner ? 'flex' : 'none' }}>
                        <label className="short">
                            UNACCAPTED NEW OWNER:
                        </label>
                        <div className="num-value">
                            {this.props.unaccaptedOwner}
                        </div>
                    </div>
                    <div className="subDiv">
                        <label className="short">
                            NEW OWNER:
                        </label>
                        <input type="text" className="numberInput long" onChange={this.handleNewOwnerValueChange.bind(this)} />
                        <div className="confirm-button" onClick={this.handleChangeOwner.bind(this)}>Change</div>
                    </div>
                </div>
            </div>
        );
    }
}


export default HpEasyAdmin;