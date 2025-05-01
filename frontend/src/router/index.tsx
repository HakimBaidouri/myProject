import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from '../App';
import Home from '../pages/Home';
import MetreArbo from '../pages/metre/MetreArbo';
import ChapterEditorSandbox from '../pages/textEditor/ChapterEditorSandbox';
import Summary from '../pages/Summary';


const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'metre', element: <MetreArbo/> },
      { path: 'sandbox-editor', element: <ChapterEditorSandbox /> },
      { path: 'summary', element: <Summary /> }
    ]
  }
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
