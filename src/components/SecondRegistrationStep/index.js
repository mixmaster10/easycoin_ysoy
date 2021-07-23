import React from 'react';
import Swal from 'sweetalert2'; //https://sweetalert2.github.io
import Loader from 'react-loader-spinner'; //https://www.npmjs.com/package/react-loader-spinner
import '../Registration/Registration.scss';
import './SecondRegistrationStep.scss';
import logo from '../../assets/logo-.svg';
import progressIcon from '../../assets/2nd_registration_step1.svg';
import Utils from '../../utils';


class SecondRegistrationStep extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            userAddress: props.referrAddress ?? '',
            loader: false,
            isEthPaid: false,
            isEasyPaid: false,
            REGISTRATION_COST_ETH_FULL: 0,
            REGISTRATION_COST_ETH: 0,
            REGISTRATION_COST_EASY_ETH_EQUIVALENT: 0,
            easyBalance: 0,
            isExtraTokenNeeded: true
        };

        if (typeof this.props.location.state !== 'undefined' && this.props.location.state.isEthPaid !== 'undefined' && this.props.location.state.isEasyPaid !== 'undefined') {
            this.state.isEthPaid = this.props.location.state.isEthPaid;
            this.state.isEasyPaid = this.props.location.state.isEasyPaid;
        }

        this.handleSubmit = this.handleSubmit.bind(this);
    }

    async componentDidMount() {
        await Utils.setWeb3(window);

        this.initData();
    }

    componentWillUnmount() {
        console.log("In unmount");
        this._isMounted = false;
    }

    async initData() {
        this.getRegistrationCost();
        this.checkPaymentStatus();
        this.initEasyBalance();
    }

    async getRegistrationCost() {
        let registrationCostEth = await Utils.getRegistrationCost();
        if (registrationCostEth === null) return;
        this.setState({ REGISTRATION_COST_ETH_FULL: registrationCostEth });
        this.setState({ REGISTRATION_COST_ETH: registrationCostEth / 1000000000000000000 });

        let registrationCostEasy = await Utils.getRegistrationCostEasyInEthEquivalent(registrationCostEth);
        if (registrationCostEasy === null) return;
        this.setState({ REGISTRATION_COST_EASY_ETH_EQUIVALENT: registrationCostEasy });

        if (this.state.easyBalance >= this.state.REGISTRATION_COST_ETH) {
            this.setState({ isExtraTokenNeeded: false });
        } else {
            this.setState({ isExtraTokenNeeded: true });
        }
    }

    async checkPaymentStatus() {
        if (await Utils.isCurrentUserExists()) {
            this.props.history.push('/dashboard');
            return;
        } else {
            let payment = await Utils.getPaymentStatusForCurrentUser();

            if (payment.isEthPaid && !payment.isTokensPaid) {
                this.state.isEthPaid = true;
                this.state.isEasyPaid = false;
            } else if (!payment.isEthPaid) {
                this.props.history.push({
                    pathname: '/register',
                    state: {
                        isEthPaid: true,
                        isEasyPaid: false,
                        referrId: this.state.referrId
                    }
                });
            }
        }
    }

    async initEasyBalance() {
        let easyBalance = await Utils.getEasyBalanceByUser();
        if (easyBalance === null) return;
        this.setState({ easyBalance: easyBalance });

        if (easyBalance >= this.state.REGISTRATION_COST_ETH) {
            this.setState({ isExtraTokenNeeded: false });
        } else {
            this.setState({ isExtraTokenNeeded: true });
        }
    }


    async handleSubmit(event) {
        event.preventDefault();
        this.setState({ loader: true });

        if (this.state.REGISTRATION_COST_EASY_ETH_EQUIVALENT === 0 && this.state.isExtraTokenNeeded) {
            Swal.fire({
                icon: 'question',
                title: 'Getting registration cost',
                confirmButtonText: 'Ok, I\'ll retry',
                html: 'Trying to get registration cost from smartcontract, please retry'
            }).then((result) => {
                this.setState({ loader: false });
            });

            return;
        }

        if (this.state.isExtraTokenNeeded) {
            await Utils.payAndSendEasy(this.state.REGISTRATION_COST_EASY_ETH_EQUIVALENT)
                .then(
                    result => this.handleSuccessfulSubmit(result),
                    error => this.handleErroredSubmit(error))
                .catch(
                    error => {
                        this.setState({ loader: false });
                        console.error("HPEASY ETH error");
                        console.error(error);
                        this.setState({ loader: false });
                    });
            console.log("Smartcontract operation is finished");
        } else {
            await Utils.sendEasy(this.state.REGISTRATION_COST_ETH_FULL)
                .then(
                    result => this.handleSuccessfulSubmit(result),
                    error => this.handleErroredSubmit(error))
                .catch(
                    error => {
                        this.setState({ loader: false });
                        console.error("HPEASY ETH error");
                        console.error(error);
                        this.setState({ loader: false });
                    });
            console.log("Smartcontract operation is finished");
        }
    }

    async handleSuccessfulSubmit(result) {
        Swal.fire({
            title: 'Success',
            icon: 'success',
            html: 'Welcome to the HPEASY ETH family! <br>You will be redirected to your dashboard'
        }).then((result) => {
            this.setState({ loader: false });
            this.props.history.push('/dashboard');
        });
    }

    async handleErroredSubmit(error) {
        Swal.fire({
            icon: 'error',
            title: 'Fail',
            html: error
        }).then(result => {
            this.setState({ loader: false });
        });
    }


    render() {
        let text = 'To complete your registration you need to ' + (this.state.isExtraTokenNeeded ? 'purchase ' + this.state.REGISTRATION_COST_ETH + ' EASY (cost ' + this.state.REGISTRATION_COST_EASY_ETH_EQUIVALENT / 1000000000000000000 + ' ETH) and send the to the HPEASY ETH smartcontract' : 'send ' + this.state.REGISTRATION_COST_ETH + ' EASY COIN to the HPEASY ETH smartcontract')
        if (!this.state.isEthPaid && this.state.isEasyPaid) {
            text = this.state.REGISTRATION_COST_ETH + ' EASY COIN is paid. Nice! To complete your registration you need to go to registration page and trasfer ' + this.state.REGISTRATION_COST_ETH + ' ETH to the HPEASY ETH smartcontract'
        }

        return (
            <div className="super_container registration-2nd-page">
                <div className="login_container">
                    <img className="logo-login" alt="logo" src={logo} />
                    <img className="progressIcon" alt="progressIcon" src={progressIcon} />

                    <p className="confirm-hide" style={{ display: 'none' }}>For access to all the functions of your personal account, use Login:</p>
                    <div id="login-btn-metamask" className="login-btn confirm-hide" style={{ display: 'none' }}>REGISTER 2n STEP</div>
                    <div id="confirm-ref" >
                        <p>{text}</p>

                        <form onSubmit={this.handleSubmit}>
                            <input className="login-btn" id="register-btn-confirm" type="submit" value={this.state.isExtraTokenNeeded ? "purchase and send" : "send"} disabled={this.state.loader} style={{ width: '380px' }} />
                        </form>
                    </div>
                </div>
                <div className="darkener" style={{ display: this.state.loader ? 'block' : 'none' }}></div>
                <Loader
                    className="loader"
                    type="Oval"
                    color="#00BFFF"
                    height={100}
                    width={100}
                    visible={this.state.loader}
                />
            </div>
        );
    }
}

export default SecondRegistrationStep;
