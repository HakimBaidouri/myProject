import { Link, Outlet } from 'react-router-dom';

export default function App() {
  return (
    <div>
      <nav className="print:hidden" style={{ padding: '1rem', background: '#f0f0f0' }}>
        <Link to="/" style={{ marginRight: '1rem' }}>🏠 Accueil</Link>
        <Link to="/metre" style={{ marginRight: '1rem' }}>📐 Métré</Link>
        <Link to="/sandbox-editor" style={{ marginRight: '1rem' }}>📝 Text Editor</Link>
        <Link to="/summary">📊 Récapitulatif</Link>
      </nav>
      <main style={{ padding: '1rem' }}>
        <Outlet />
      </main>
    </div>
  );
}
