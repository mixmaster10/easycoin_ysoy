import React from 'react';
import Home from "./Home";

export class Root extends React.Component {
    render() {
        return (
            <div className='super_container text-center'>
                <h2>ROOT routed</h2>
                <Home />
            </div>
        );
    }
}

export default Root;
