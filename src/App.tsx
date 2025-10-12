import { useAuthStore } from './store/authStore';
import Login from './pages/Login';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Bienvenido, {user?.name}
          </h1>
          <p className="text-gray-600 mt-2">Rol: {user?.role}</p>
        </div>
      </div>
    </div>
  );
}

export default App;