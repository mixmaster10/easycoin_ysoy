import React from 'react';
import { withRouter } from 'react-router-dom';
import logo from '../../assets/logo-.svg';

class Maintenance extends React.Component {
    render() {
        return (
            <div className='super_container text-center home-container'>
                <div className="login_container">
                    <img className="logo-login" alt="logo" src={logo} />
                    <h1 style={{ color: 'white', marginTop: '70px' }}>HPEASY ETH estará de volta em breve!</h1>
                    <div>
                        <p>Desculpe o transtorno, mas estamos realizando uma manutenção no momento. Se precisar, você pode sempre entrar em <a href="https://t.me/joinchat/QaIJxxmKSeZzffo24auyxg">contato conosco</a>, caso contrário, estaremos online em breve!</p>
                        <p>&mdash; A equipe HPEASY ETH</p>
                    </div>
                </div>
            </div>
        )
    }
}


export default withRouter(Maintenance);