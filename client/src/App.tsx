import React from 'react';
import './App.css';

import MainPage from './components/pages/mainpage'
import Login from './components/pages/login'
import Register from './components/pages/register'
import Exit from './components/pages/exit'
import { Route } from './components/router/router'
import { checkAuth, checkNotAuth } from './components/router/middlewares';

function App() {
  	return (
		<>
			<Route path='/' page={<MainPage/>} />
			<Route path='/login' page={<Login/>} mws={[checkNotAuth]}/>
			<Route path='/register' page={<Register />}  mws={[checkNotAuth]}/>
			<Route path='/exit' page={<Exit />}  mws={[checkAuth]}/>
		</>
		
	);
}

export default App;
