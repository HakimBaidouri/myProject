import { Link, Outlet } from 'react-router-dom';

export default function App() {
  return (
    <div>
      <nav style={{ padding: '1rem', background: '#f0f0f0' }}>
        <Link to="/" style={{ marginRight: '1rem' }}>🏠 Accueil</Link>
        <Link to="/metre">📐 Métré</Link>
      </nav>
      <main style={{ padding: '1rem' }}>
        <Outlet />
      </main>
    </div>
  );
}
