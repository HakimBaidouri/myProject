import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from '../App';
import Home from '../pages/Home';
import MetreArbo from '../pages/metre/MetreArbo';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'metre', element: <MetreArbo/> }
    ]
  }
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
