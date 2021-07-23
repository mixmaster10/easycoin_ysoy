import React from 'react';
import { withRouter } from 'react-router-dom';
import Swal from 'sweetalert2'; //https://sweetalert2.github.io
import Loader from 'react-loader-spinner';
import './Registration.scss';
import logo from '../../assets/logo-.svg';
import Utils from '../../utils';
import { myConfig } from '../../config.js';

class Registration extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            referrId: props.referrId ?? '',
            referrAddress: props.referrAddress ?? '',
            referrIdExists: false,
            loader: false,
            useToken: true
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);

        if (this.props.match.params.id != null) {
            this.state.referrId = this.props.match.params.id;
        } else {
            this.state.referrId = 0;
        }

        if (typeof this.props.location !== 'undefined' && typeof this.props.location.state !== 'undefined') {
            this.state.referrId = this.props.location.state.referrId;
        }

        this.checkPaymentStatus = this.checkPaymentStatus.bind(this);

        this.REGISTRATION_COST_ETH = 0;
    }

    async componentDidMount() {
        await Utils.setWeb3(window);
        this.initData();
    }

    async initData() {
        this.getRegistrationCost();
        this.getUseToken();
        this.getUserAddressById(this.state.referrId);
        this.checkPaymentStatus();
    }

    async getRegistrationCost() {
        let registrationCost = await Utils.getRegistrationCost();
        if (registrationCost === null) return;
        this.REGISTRATION_COST_ETH = registrationCost;
    }

    async getUseToken() {
        let useToken = await Utils.getUseToken();
        if (useToken === null) return;
        this.setState({ useToken: useToken });
    }

    async checkPaymentStatus() {
        if (await Utils.isCurrentUserExists()) {
            this.props.history.push({
                pathname: '/dashboard',
                state: {}
            });
            return;
        } else {
            let payment = await Utils.getPaymentStatusForCurrentUser();

            if (payment.isEthPaid && !payment.isTokensPaid) {
                this.props.history.push({
                    pathname: '/regfinish',
                    state: {
                        isEthPaid: true,
                        isEasyPaid: false,
                        referrId: this.state.referrId
                    }
                })
            }
        }
    }

    async getUserAddressById(userId) {
        try {
            var addressInBase58 = await Utils.fetchUserAddressById(userId);
            this.setState({ referrAddress: addressInBase58 });

            if (addressInBase58 === '0x0000000000000000000000000000000000000000') {
                console.log('userAddress is zero, set refer to 0');
                this.setState({ referrId: 0 });
                this.setState({ referrAddress: myConfig.GENESIS_USER });
                this.setState({ referrIdExists: false });
            } else {
                this.setState({ referrAddress: addressInBase58 });
                this.setState({ referrIdExists: true });
            }
        } catch (error) {
            console.error("Error trying getting address:");
            console.error(error);
        }
    }


    handleChange(event) {
        this.setState({ referrId: event.target.value });
        this.getUserAddressById(event.target.value);
    }


    async handleSubmit(event) {
        event.preventDefault();
        this.setState({ loader: true });

        if (this.REGISTRATION_COST_ETH === 0) {
            Swal.fire({
                icon: 'question',
                title: 'Getting registration cost',
                confirmButtonText: 'Ok, I\'ll retry',
                html: 'Trying to get registration cost from smartcontract, please retry'
            });

            return;
        }

        await Utils.registrationInEth(this.state.referrAddress, this.REGISTRATION_COST_ETH)
            .then(
                result => {
                    Swal.fire({
                        title: 'Success',
                        icon: 'success',
                        html: 'Nice! You will be moved to the second step of registration'
                    }).then((result) => {
                        this.setState({ loader: false });
                        if (this.state.useToken) {
                            this.props.history.push({
                                pathname: '/regfinish',
                                state: {
                                    isEthPaid: true,
                                    isEasyPaid: false
                                }
                            })
                        } else {
                            Swal.fire({
                                title: 'Success',
                                icon: 'success',
                                html: 'Welcome to the INFINITY GLOBAL family! <br>You will be redirected to your dashboard'
                            }).then((result) => {
                                this.setState({ loader: false });
                                this.props.history.push('/dashboard');
                            });
                        }
                    });
                },
                error => {
                    Swal.fire({
                        icon: 'error',
                        title: 'Fail',
                        html: error
                    }).then((result) => {
                        console.log("Retry after error");
                        this.setState({ loader: false });
                    });
                }
            ).catch(error => {
                this.setState({ loader: false });
                console.error("INFINITY GLOBAL error");
                console.error(error);
            });
    }

    render() {
        return (
            <div className="super_container login-page">
                <div className="login_container">
                    <img className="logo-login" alt="logo" src={logo} />
                    <p className="confirm-hide" style={{ display: 'none' }}>For access to all the functions of your personal account, use Login:</p>
                    <div id="login-btn-metamask" className="login-btn confirm-hide" style={{ display: 'none' }}>REGISTER/LOGIN</div>
                    <div id="confirm-ref" >
                        <form onSubmit={this.handleSubmit}>

                            <div className="ref-confirm">
                                <p>Your Sponsor ID</p>
                                <div className="form-box">
                                    <input type="number" id="ref-id" value={this.state.referrId} onChange={this.handleChange} />
                                </div>
                                <div className="form-box">
                                    <input type="text" id="ref-wallet" value={this.state.referrAddress} onChange={this.handleChange2} disabled={true} />
                                </div>
                            </div>
                            <input className="login-btn" id="register-btn-confirm" type="submit" value="click to confirm registration" disabled={this.state.loader} style={{ width: '380px' }} />
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

export default withRouter(Registration);