import { Routes, Route } from "react-router-dom";
import ListingsPage from "./components/ListingsPage";
import PropertyDetailPage from "./components/PropertyDetailPage";
import "./App.css";

function App() {
  return (
    <div className="App">
      <h1>Property Search</h1>
      <Routes>
        <Route path="/" element={<ListingsPage />} />
        <Route path="/property/:id" element={<PropertyDetailPage />} />
      </Routes>
    </div>
  );
}

export default App;
