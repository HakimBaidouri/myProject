import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from '../App';
import Metre from '../pages/Metre';
import Home from '../pages/Home';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'metre', element: <Metre /> }
    ]
  }
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
