import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import NewsList from './pages/NewsList';
import ArticleDetail from './pages/ArticleDetail';
import WatchList from './pages/WatchList';
import NotificationSettings from './pages/NotificationSettings';
import Admin from './pages/Admin';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="news" element={<NewsList />} />
          <Route path="news/:id" element={<ArticleDetail />} />
          <Route path="watchlist" element={<WatchList />} />
          <Route path="notifications" element={<NotificationSettings />} />
          <Route path="admin" element={<Admin />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
