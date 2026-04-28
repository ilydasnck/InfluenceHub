import { useState } from 'react';
import { Dashboard, Login, Register } from '../screens';

export type ScreenName = 'login' | 'register' | 'dashboard';

export default function AppNavigator() {
  const [screen, setScreen] = useState<ScreenName>('login');

  if (screen === 'login') {
    return (
      <Login
        onSuccess={() => setScreen('dashboard')}
        onGoToRegister={() => setScreen('register')}
      />
    );
  }

  if (screen === 'register') {
    return (
      <Register
        onSuccess={() => setScreen('dashboard')}
        onGoToLogin={() => setScreen('login')}
      />
    );
  }

  return <Dashboard onLogout={() => setScreen('login')} />;
}
