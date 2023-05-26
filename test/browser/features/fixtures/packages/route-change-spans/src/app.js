import React from "react";
import { createRoot } from 'react-dom/client';
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Link
} from "react-router-dom";

function Navigation() {
    return (
        <div>
            <nav>
                <li>
                    <Link to="/route-change-spans">Home</Link>
                </li>
                <li>
                    <Link to="/new-route" id="change-route">Change Route</Link>
                </li>
            </nav>
        </div>
    )
}

export default function App() {
    return (
        <Router>
            <Navigation />
            <Switch>
                <Route path="/route-change-spans">
                    <Home />
                </Route>
                <Route path="/new-route">
                    <About />
                </Route>
            </Switch>
        </Router>
    );
}

function Home() {
    return (
        <div>
            <h2>RouteChange Spans</h2>
            <a href="#anchor-link" id="go-to-anchor">Anchor Link</a>
            <h3 id="anchor-link">Anchor</h3>
        </div>
    );
}

function About() {
    return (
        <h2>New Route</h2>
    );
}

const container = document.getElementById('app');
const root = createRoot(container);
root.render(<App />);
