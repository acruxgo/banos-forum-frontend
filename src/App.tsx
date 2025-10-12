import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import CajaPOS from './pages/CajaPOS';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Login />;
  }

  return <CajaPOS />;
}

export default App;