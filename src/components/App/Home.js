import React from 'react';
import Swal from 'sweetalert2'; //https://sweetalert2.github.io
import Loader from 'react-loader-spinner';
import { withRouter } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { myConfig } from '../../config.js';
import BuyEasy from './../BuyEasy'; 
import logo from '../../assets/nlogo.png';
import Utils from '../../utils';
import './Home.scss';



class Home extends React.Component {
    _isMounted = false;

    constructor(props) {
        super(props);
        this.state = {
            viewId: -1,
            isAddressExist: true,
            referrId: 0,
            loader: false,
            isRegistered: true,
            viewerAddress: '',
            easyAccountBalance: 0,
            easyBalance: 0
        };

        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.goToLoginRegister = this.goToLoginRegister.bind(this);

        if (typeof this.props !== 'undefined' && typeof this.props.match !== 'undefined' && typeof this.props.match.params !== 'undefined' && typeof this.props.match.params.id && this.props.match.params.id != null) {
            this.state.referrId = this.props.match.params.id;
            console.log("Referr id: " + this.props.match.params.id);
        } else {
            this.state.referrId = 0;
            console.log("Referr id not defined");
        }
    }

    async componentDidMount() {
        await Utils.setWeb3(window);

        this.initData();
    }

    async initData() {
        this.setState({viewerAddress : Utils.getCurrentUserAddress() });

        this.initEthToEasyExchangeRate();
        this.initEasyBalance();
    }

    async initEthToEasyExchangeRate() {
        let rate = await Utils.getExchangeRate();

        if (rate !== null) {
            this.setState({ ETH_TO_EASY: rate });
        }
    }

    async initEasyBalance() {
        let easyBalance = await Utils.getEasyBalanceByUser();
        if (easyBalance === null) return;
        this.setState({ easyBalance: easyBalance });
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    async handleInputChange(event) {
        let input = event.target.value;

        if (!input) {
            this.setState({ viewId: -1 });
        } else if (!isNaN(parseInt(input))) {
            if (await Utils.getUserAddressById(input) !== '410000000000000000000000000000000000000000') {
                this.setState({ viewId: input });
            } else {
                this.setState({ viewId: '' });
            }
        } else {
            let user = await Utils.getCleanUser(input);
            if (user !== null && user.userId !== 0) {
                this.setState({ viewId: user.userId });
            } else {
                this.setState({ viewId: '' });
            }
        }

    }

    async handleSubmit(event) {
        event.preventDefault();

        if (this.state.viewId && this.state.viewId !== -1) {
            window.location.replace('/dashboard/' + this.state.viewId);
        }
    }

    async goToLoginRegister(event) {
        event.preventDefault();

        if (await Utils.isCurrentUserExists()) {
            this.props.history.push({
                pathname: '/dashboard',
                state: {}
            })
        } else {
            let payment = await Utils.getPaymentStatusForCurrentUser();

            if (payment == null) {
                Swal.fire({
                    title: 'Connection problem',
                    icon: 'error',
                    html: "<p>Sorry, can't connect to ETHEREUM network.</p> <p>Please connect your Web3 provider <br><i>(<a href='" + myConfig.METAMASK_URL + "' target='_blank' rel='noopener noreferrer'>MetaMask</a> or other wallets that support online operations)</i></p>"
                })
                return;
            }

            if (!payment.isEthPaid && !payment.isTokensPaid) {
                this.props.history.push({
                    pathname: '/register',
                    state: {
                        isEthPaid: false,
                        isEasyPaid: false,
                        referrId: this.state.referrId
                    }
                })
            } else if (!payment.isEthPaid && payment.isTokensPaid) {
                console.log("Go to first step, but with paid tokens");
                this.props.history.push({
                    pathname: '/register',
                    state: {
                        isEthPaid: false,
                        isEasyPaid: true,
                        referrId: this.state.referrId
                    }
                })
            } else if (payment.isEthPaid && !payment.isTokensPaid) {
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

    onLoaderChange(showLoader) {
        if (typeof showLoader === 'boolean' && showLoader !== null) {
            this.setState({ loader: showLoader });
        } else {
            this.setState({ loader: !this.state.loader });
        }
    }

    render() {
        return (
            <div className='super_container text-center home-container'>
                <BuyEasy
                    onLoaderChange={this.onLoaderChange.bind(this)}
                    isRegistered={this.state.isRegistered}
                    viewerAddress={this.state.viewerAddress}
                    easyAccountBalance={this.state.easyAccountBalance}
                    easyBalance={this.state.easyBalance}
                    ETH_TO_EASY={this.state.ETH_TO_EASY}
                />
                <div className="login_container">
                    <img className="logo-login" alt="logo" src={logo} />
                    <p className="confirm-hide">For access to all the functions of your personal account, use Login:</p>
                    <div id="login-btn-metamask" className="login-btn confirm-hide" onClick={this.goToLoginRegister}>REGISTER/LOGIN</div>

                    <form className="confirm-hide" onSubmit={this.handleSubmit}>
                        <label>For viewing mode enter ID or wallet</label>
                        <input type="text" id="view-id" onChange={this.handleInputChange} />
                        <p className="error" style={{ display: this.state.viewId ? 'none' : 'block' }} >No user or incorrect input</p>
                        <input className={"blueButton" + (this.state.viewId && this.state.viewId !== -1 ? "" : " disabled")} id="view-dashboard" type="submit" value="VIEWING" />
                    </form>
                </div>
                <Link to={'/admin'} className="admin-link">Admin Panel</Link>
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


export default withRouter(Home);