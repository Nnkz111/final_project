import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";

const CategoryContext = createContext(null);

// Helper function to build a category tree
const buildCategoryTree = (categories) => {
  const categoryMap = {};
  const rootCategories = [];

  // Create a map of categories by their ID and initialize children array
  categories.forEach((category) => {
    categoryMap[category.id] = { ...category, children: [] };
  });

  // Assign children to their parents
  categories.forEach((category) => {
    if (category.parent_id !== null && categoryMap[category.parent_id]) {
      categoryMap[category.parent_id].children.push(categoryMap[category.id]);
    } else {
      // If no parent_id or parent not found, it's a root category
      rootCategories.push(categoryMap[category.id]);
    }
  });

  return rootCategories;
};

export const CategoryProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [hierarchicalCategories, setHierarchicalCategories] = useState([]); // New state for hierarchical data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/categories`);
        setCategories(response.data); // Store flat list
        setHierarchicalCategories(buildCategoryTree(response.data)); // Build and store hierarchical list
      } catch (err) {
        setError(err);
        console.error("Error fetching categories:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []); // Empty dependency array means this runs once on mount

  // Provide both flat and hierarchical categories, plus loading/error states
  return (
    <CategoryContext.Provider
      value={{ categories, hierarchicalCategories, loading, error }}
    >
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategories = () => useContext(CategoryContext);
