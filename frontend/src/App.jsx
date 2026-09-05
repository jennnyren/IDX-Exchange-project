import { Routes, Route, Link, useLocation } from "react-router-dom";
import ListingsPage from "./components/ListingsPage";
import PropertyDetailPage from "./components/PropertyDetailPage";
import FavoritesPage from "./components/FavoritesPage";
import ErrorBoundary from "./components/ErrorBoundary";
import { useFavorites } from "./hooks/useFavorites";
import "./App.css";

function App() {
  const { count } = useFavorites();
  const location = useLocation();

  return (
    <div className="App">
      <h1>Property Search</h1>
      <nav className="main-nav">
        <Link to="/">Listings</Link>
        <Link to="/favorites">Favorites ({count})</Link>
      </nav>
      <ErrorBoundary key={location.pathname}>
        <Routes>
          <Route path="/" element={<ListingsPage />} />
          <Route path="/property/:id" element={<PropertyDetailPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
        </Routes>
      </ErrorBoundary>
    </div>
  );
}

export default App;
