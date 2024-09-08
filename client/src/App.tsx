import React from 'react';
import './App.css';

import MainPage from './components/pages/mainpage'
import Login from './components/pages/auth/login'
import Register from './components/pages/auth/register';
import Exit from './components/pages/auth/exit'
import GamePage from './components/pages/gameProcess/gamePage';
import GameListPage from './components/pages/gameListPage';
import { Route } from './components/router/router'
import { checkAuth, checkNotAuth } from './components/router/middlewares';

function App() {
  	return (
		<>
			<Route path='/' page={MainPage} />

			<>
				<Route path='/login' page={Login} mws={[checkNotAuth]}/>
				<Route path='/register' page={Register}  mws={[checkNotAuth]}/>
				<Route path='/exit' page={Exit}  mws={[checkAuth]}/>
			</>

			<>
				<Route path='/getGame' page={GameListPage} mws={[checkAuth]}/>
				<Route path='/game/:id' page={GamePage} mws={[checkAuth]}/>
			</>
		</>
		
	);
}

export default App;
