import HomePage from './pages/home-next'
import PlaygroundItemPage from './pages/playground-item'
import PlaygroundPage from './pages/playground'
import { getPlaygroundItem } from './content/playground'
import { playgroundComponents } from './content/playground-components'

export default function App() {
  if (window.location.pathname.startsWith('/playground/')) {
    const slug = window.location.pathname.replace('/playground/', '').replace(/\/$/, '')
    const item = getPlaygroundItem(slug)

    if (item) {
      const Injected = playgroundComponents[item.slug]
      return <PlaygroundItemPage item={item}>{Injected ? <Injected /> : null}</PlaygroundItemPage>
    }
  }

  if (window.location.pathname === '/playground') {
    return <PlaygroundPage />
  }

  return <HomePage />
}
