import React from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import ProductList from "./components/ProductList";
import "./App.css"; // Make sure to import the CSS

function App() {
  return (
    <div className="App">
      <Header />
      <div className="container">
        <Sidebar />
        <ProductList />
      </div>
    </div>
  );
}

export default App;
