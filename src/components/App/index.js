import React from 'react';
import Registration from '../Registration';
import Home from './Home';
import Admin from '../Admin';
import Dashboard from '../Dashboard';
import SecondRegistrationStep from '../SecondRegistrationStep';
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
//import Maintenance from './Maintenance';

import './App.scss';

class App extends React.Component {

    async componentDidMount() { 
    }

    render() {
        return (
            <Router>
                <Switch>
                    <Route path="/register/:id" component={Registration}></Route>
                    <Route path="/register" component={Registration}></Route>
                    <Route path="/dashboard/:id" component={Dashboard}></Route>
                    <Route path="/dashboard/" component={Dashboard}></Route> 
                    <Route path="/regfinish" component={SecondRegistrationStep}></Route>
                    <Route path="/admin" component={Admin}></Route>
                    <Route path="/:id" component={Home}></Route>
                    <Route path="/" component={Home}></Route>
                    {/* <Route path="/:id" component={Maintenance}></Route>
                    <Route path="/" component={Maintenance}></Route> */}
                    {/* <Route path="/" exact component={Root}></Route> */}
                </Switch>
            </Router>
        );
    }
}

export default App;
