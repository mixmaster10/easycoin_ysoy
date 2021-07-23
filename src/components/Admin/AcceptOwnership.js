import React from 'react';
import Swal from 'sweetalert2'; //https://sweetalert2.github.io
import { myConfig } from '../../config.js';
import Utils from '../../utils';
import './Admin.scss';

class AcceptOwnership extends React.Component {
    changeLoader(show) {
        this.props.onLoaderChange(show);
    }

    async handleAcceptOwnership() {
        this.changeLoader(true);

        Swal.fire({
            icon: 'question',
            title: 'Confirm ownership acceptance',
            showCancelButton: true,
            html: 'Are you sure you want to accept the ownership of the <b>' + this.props.contractName + ' smartcontract</b> <br>(address <i>' + this.props.contractAddress + "</i>)?"
        }).then((result) => {
            if (result.isConfirmed) {
                this.acceptOwnership();
            } else {
                this.changeLoader(false);
            }
        });
    }

    async acceptOwnership() {
        await Utils.acceptOwnership(this.props.contractAddress)
            .then(
                result => {
                    console.log(result);
                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        html: 'Nice! Ownership of the ' + this.props.contractName + ' smartcontract (address <i>' + this.props.contractAddress + "</i>) has been approved. <br>Current page will be reloaded"
                    }).then(result => {
                        this.changeLoader(false);
                        window.location.reload();
                    });
                },
                error => {
                    console.error(error);
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
                }).then(result => { this.changeLoader(false); });
                console.log("Error");
                console.error(error);

            });;
    }

    render() {
        return (
            <div className="admin-sub-block">
                <h3>{this.props.contractName} ownership acceptance</h3>
                <p>Contract address:
                    <a target="_blank" rel="noopener noreferrer" href={myConfig.ETHERSCAN_DOMAIN + "address/" + this.props.contractAddress}>{this.props.contractAddress}</a>
                </p>
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
                        <p>Hello! Previous <b>{this.props.contractName} smartcontract</b> owner <i>{this.props.owner}</i>    transferred ownership of this smartcontract to you. If you want to accept it just click "Accept ownership" button</p>
                        <div className="confirm-button" onClick={this.handleAcceptOwnership.bind(this)}>Accept ownership</div>
                    </div>
                </div>
            </div>
        );
    }
}


export default AcceptOwnership;