import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { useCategories } from "../context/CategoryContext"; // Import useCategories

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);
  const { categories } = useCategories(); // Get categories from context

  // State to hold fetched names and loading status for each segment by index
  const [segmentData, setSegmentData] = useState({});

  // Placeholder function to fetch product name by ID
  const fetchProductName = async (id) => {
    // *** Replace this with your actual product data fetching logic ***
    console.log(`Fetching product with ID: ${id}`);
    try {
      const response = await fetch(`http://localhost:5000/api/products/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.name; // Assuming the product object has a 'name' field
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      return `Product ${id}`; // Fallback to ID on error
    }
  };

  // Helper to get category name by id from the context
  const getCategoryName = (id) => {
    if (!categories || categories.length === 0) return `Category ${id}`; // Return ID if categories not loaded
    const category = categories.find((cat) => String(cat.id) === String(id));
    return category ? category.name : `Category ${id}`; // Return name if found, otherwise ID
  };

  useEffect(() => {
    // Initialize state for all segments and fetch data for relevant ones
    const initialSegmentData = {};
    const segmentsToFetch = [];

    pathnames.forEach((name, index) => {
      const previousPathSegment = index > 0 ? pathnames[index - 1] : null;
      const isProduct = previousPathSegment === "products";
      const isCategory = previousPathSegment === "category";
      const isLikelyId = !isNaN(name) && (isProduct || isCategory);

      if (isLikelyId) {
        initialSegmentData[index] = { name: "Loading...", isLoading: true };
        segmentsToFetch.push({
          index,
          type: isProduct ? "products" : "category",
          id: name,
        });
      } else {
        initialSegmentData[index] = {
          name: name.charAt(0).toUpperCase() + name.slice(1),
          isLoading: false,
        };
      }
    });

    setSegmentData(initialSegmentData);

    segmentsToFetch.forEach(async ({ index, type, id }) => {
      let name;
      if (type === "products") {
        name = await fetchProductName(id);
      } else if (type === "category") {
        // Category names are available from the context immediately
        name = getCategoryName(id);
      }

      setSegmentData((prevData) => ({
        ...prevData,
        [index]: { name, isLoading: false },
      }));
    });
  }, [location.pathname, categories]); // Re-run effect when pathname or categories change

  return (
    <nav aria-label="breadcrumb" className="text-gray-700 p-4">
      <ol className="list-none p-0 inline-flex">
        <li className="flex items-center">
          <Link to="/" className="text-black-600 hover:underline">
            Home
          </Link>
        </li>
        {pathnames.map((name, index) => {
          // Determine the route for the current segment
          let routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
          const segmentName = name.charAt(0).toUpperCase() + name.slice(1);

          // Special case: if the segment is 'category' and it's not the last segment,
          // link it to the category listing page.
          if (name === "category" && index < pathnames.length - 1) {
            routeTo = "/categories"; // Link to the new category list page
          }
          // Special case: if the segment is 'products' and it's not the last segment,
          // link it to the product listing page.
          if (name === "products" && index < pathnames.length - 1) {
            routeTo = "/products"; // Link to the product list page
          }

          const isLast = index === pathnames.length - 1;
          const segment = segmentData[index] || {
            name: segmentName,
            isLoading: true,
          }; // Fallback while loading, use capitalized name

          return (
            <li key={index} className="flex items-center">
              <span className="mx-2">/</span>
              {isLast ? (
                <span className="text-gray-500">
                  {segment.isLoading ? "Loading..." : segment.name}
                </span>
              ) : (
                <Link to={routeTo} className="text-black-600 hover:underline">
                  {segment.isLoading ? "Loading..." : segment.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
