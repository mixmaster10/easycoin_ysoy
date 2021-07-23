import React from 'react';
import Loader from 'react-loader-spinner';
import { withRouter } from 'react-router-dom';
import { myConfig } from '../../config.js';
import Utils from '../../utils';
import EasyAdmin from './EasyAdmin';
import AcceptOwnership from './AcceptOwnership';
import NotLoggedIn from './NotLoggedIn';
import HpEasyAdmin from './HpEasyAdmin';
import './Admin.scss';


class Admin extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loader: false,
            isOwnerHpEasy: false,
            isUnaccaptedOwnerHpEasy: false,
            isOwnerEasy: false,
            isUnaccaptedOwnerEasy: false,
            ownerHpEasy: '',
            unaccaptedOwnerHpEasy: '',
            ownerEasy: '',
            unaccaptedOwnerEasy: '',
            pageIsReady: false,
        }

        this.onLoaderChange = this.onLoaderChange.bind(this)
    }

    async componentDidMount() {
        await Utils.setWeb3(window);
        
        this.setState({ pageIsReady: true });
        this.initData();
    }

    onLoaderChange(isShow) {
        if (typeof isShow === 'boolean' && isShow !== null)
            this.setState({ loader: isShow });
        else
            this.setState({ loader: !this.state.loader });
    }

    async initData() {
        let currentAddress = Utils.getCurrentUserAddress().toLowerCase();

        this.initisOwnerHpEasy(currentAddress);
        this.initIsHpEasyUnacceptedOwner(currentAddress);
        this.initisOwnerEasy(currentAddress);
        this.initIsEasyUnacceptedOwner(currentAddress);
    }

    async initisOwnerHpEasy(currentAddress) {
        let ownerHpEasy = await Utils.getHpEasyOwner();

        if (ownerHpEasy !== null) {
            this.setState({ ownerHpEasy: ownerHpEasy });

            if (currentAddress === ownerHpEasy.toLowerCase()) {
                this.setState({ isOwnerHpEasy: true });
            }
        }
    }

    async initIsHpEasyUnacceptedOwner(currentAddress) {
        let unacceptedHpEasyOwner = await Utils.getUnacceptedOwnerHpEasy();

        if (unacceptedHpEasyOwner !== null && unacceptedHpEasyOwner !== '0x0000000000000000000000000000000000000000') {
            this.setState({ unaccaptedOwnerHpEasy: unacceptedHpEasyOwner });

            if (currentAddress === unacceptedHpEasyOwner.toLowerCase()) {
                this.setState({ isUnaccaptedOwnerHpEasy: true });
            }
        }
    }

    async initisOwnerEasy(currentAddress) {
        let ownerEasy = await Utils.getEasyOwner();

        if (ownerEasy !== null) {
            this.setState({ ownerEasy: ownerEasy });

            if (currentAddress === ownerEasy.toLowerCase()) {
                this.setState({ isOwnerEasy: true });
            }
        }
    }

    async initIsEasyUnacceptedOwner(currentAddress) {
        let unacceptedEasyOwner = await Utils.getUnacceptedOwnerEasy();
        
        if (unacceptedEasyOwner !== null && unacceptedEasyOwner !== '0x0000000000000000000000000000000000000000') {
            this.setState({ unaccaptedOwnerEasy: unacceptedEasyOwner });
            
            if (currentAddress === unacceptedEasyOwner.toLowerCase()) {
                this.setState({ isUnaccaptedOwnerEasy: true });
            }

        }
    }

    async getUnacceptedOwner() {
        let unacceptedOwner = await Utils.getUnacceptedOwnerHpEasy();
        console.log(unacceptedOwner);

        if (unacceptedOwner !== '0x0000000000000000000000000000000000000000')
            this.setState({ unacceptedOwner: unacceptedOwner });
    }

    render() {
        return (
            <div className="admin-container">
                {this.state.isOwnerHpEasy
                    ? <HpEasyAdmin
                        pageIsReady={this.state.pageIsReady}
                        isAdmin={this.state.isOwnerHpEasy}
                        owner={this.state.ownerHpEasy}
                        unaccaptedOwner={this.state.unaccaptedOwnerHpEasy}
                        onLoaderChange={this.onLoaderChange.bind(this)} />
                    : this.state.isUnaccaptedOwnerHpEasy
                        ? <AcceptOwnership
                            contractName="HPEASY ETH"
                            contractAddress={myConfig.CONTRACT_ADDRESS_HPEASY}
                            owner={this.state.ownerHpEasy}
                            unaccaptedOwner={this.state.unaccaptedOwnerHpEasy}
                            onLoaderChange={this.onLoaderChange.bind(this)} />
                        : <NotLoggedIn
                            owner={this.state.ownerHpEasy}
                            contractName="HPEASY ETH" />
                }
                <div className="separator"> </div>

                {this.state.isOwnerEasy
                    ? <EasyAdmin
                        pageIsReady={this.state.pageIsReady}
                        isAdmin={this.state.isOwnerEasy}
                        owner={this.state.ownerEasy}
                        unaccaptedOwner={this.state.unaccaptedOwnerEasy}
                        onLoaderChange={this.onLoaderChange.bind(this)} />
                    : this.state.isUnaccaptedOwnerEasy
                        ? <AcceptOwnership
                            contractName="EASY COIN" 
                            contractAddress={myConfig.CONTRACT_ADDRESS_EASYCOIN}
                            owner={this.state.ownerEasy}
                            unaccaptedOwner={this.state.unaccaptedOwnerEasy}
                            onLoaderChange={this.onLoaderChange.bind(this)} />
                        : <NotLoggedIn
                            owner={this.state.ownerEasy}
                            contractName="EASY COIN" />
                }
                <div className="darkener" style={{ display: this.state.loader ? 'block' : 'none' }}></div>
                <Loader
                    className="loader"
                    type="Oval"
                    color="#00BFFF"
                    height={100}
                    width={100}
                    visible={this.state.loader}
                />

                <div className="separator"> </div>
            </div>
        );
    }
}


export default withRouter(Admin);