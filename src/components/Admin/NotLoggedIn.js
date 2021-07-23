import React from 'react';
import './Admin.scss';

class NotLoggedIn extends React.Component {
    render() {
        return (
            <div className="admin-dummy">
                <h2>Not {this.props.contractName} contract owner</h2>
                <p>Hello! Unfortunately, you are not {this.props.contractName} contract owner. </p>
                <p>Contract owner: <b>{this.props.owner}</b></p>
            </div>
        );
    }
}


export default NotLoggedIn;