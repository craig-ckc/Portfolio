import ExperimentsPage from './pages/experiments'
import HomePage from './pages/home-next'
import WritingPage from './pages/writing'

/* Trailing slashes are tolerated so /writing and /writing/ resolve alike. */
const path = () => window.location.pathname.replace(/\/+$/, '') || '/'

export default function App() {
  switch (path()) {
    case '/writing':
      return <WritingPage />
    case '/experiments':
      return <ExperimentsPage />
    default:
      return <HomePage />
  }
}
