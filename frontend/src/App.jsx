import React from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import ProductList from "./components/ProductList";
import "./App.css"; // Keep this for any custom styles if needed, or remove if fully using Tailwind

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto flex">
        <Sidebar />
        <ProductList />
      </div>
    </div>
  );
}

export default App;
