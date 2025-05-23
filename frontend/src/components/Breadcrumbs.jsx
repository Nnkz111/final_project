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
      return data; // Return the whole product object
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      return null; // Return null on error
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
      // Check if the current segment is preceded by 'category' or a segment that was identified as a category ID
      const previousSegment = index > 0 ? pathnames[index - 1] : null;
      const isAfterCategoryPath =
        previousSegment === "category" ||
        (index > 1 &&
          !isNaN(previousSegment) &&
          pathnames[index - 2] === "category");

      const isProduct = previousSegment === "products";
      const isCategorySegment = isAfterCategoryPath && !isNaN(name);

      if (isProduct && !isNaN(name)) {
        initialSegmentData[index] = { name: "Loading...", isLoading: true };
        segmentsToFetch.push({
          index,
          type: "products",
          id: name,
        });
      } else if (isCategorySegment) {
        // Category names are available from the context immediately, no async fetch needed
        const categoryName = getCategoryName(name);
        initialSegmentData[index] = { name: categoryName, isLoading: false };
      } else {
        initialSegmentData[index] = {
          name: name.charAt(0).toUpperCase() + name.slice(1),
          isLoading: false,
        };
      }
    });

    setSegmentData(initialSegmentData);

    // For products, we still need to fetch names asynchronously
    segmentsToFetch.forEach(async ({ index, type, id }) => {
      if (type === "products") {
        const product = await fetchProductName(id);
        if (product && product.category_id) {
          const categoryId = product.category_id;
          const productCategory = categories.find(
            (cat) => String(cat.id) === String(categoryId)
          );

          if (productCategory) {
            const hierarchy = [];
            let currentCat = productCategory;
            while (currentCat) {
              hierarchy.unshift(currentCat);
              if (currentCat.parent_id) {
                currentCat = categories.find(
                  (cat) => String(cat.id) === String(currentCat.parent_id)
                );
              } else {
                currentCat = null;
              }
            }

            // Store the full breadcrumb path including categories and product
            setSegmentData((prevData) => ({
              ...prevData,
              [index]: {
                type: "productWithCategory",
                hierarchy: hierarchy.map((cat) => ({
                  name: cat.name,
                  id: cat.id,
                })),
                productName: product.name,
                productId: product.id,
                isLoading: false,
              },
            }));
          } else {
            // Product found, but category not found in context
            setSegmentData((prevData) => ({
              ...prevData,
              [index]: { name: product.name, isLoading: false }, // Fallback to just product name
            }));
          }
        } else if (product) {
          // Product found, but no category ID
          setSegmentData((prevData) => ({
            ...prevData,
            [index]: { name: product.name, isLoading: false }, // Fallback to just product name
          }));
        } else {
          // Product not found or error
          setSegmentData((prevData) => ({
            ...prevData,
            [index]: { name: `Product ${id}`, isLoading: false }, // Fallback to Product ID
          }));
        }
      }
    });
  }, [location.pathname, categories]); // Re-run effect when pathname or categories change

  // Build the breadcrumb items array
  const breadcrumbItems = [];

  // Add Home breadcrumb
  breadcrumbItems.push({
    name: "Home",
    routeTo: "/",
    isLast: false,
    isLoading: false,
  });

  const pathSegments = location.pathname
    .split("/")
    .filter((segment) => segment !== "");

  // Check if the path starts with 'category'
  const isCategoryPath = pathSegments[0] === "category";

  if (isCategoryPath) {
    // Add the base 'Category' breadcrumb
    breadcrumbItems.push({
      name: "Category",
      routeTo: "/categories", // Link to the category list page
      isLast: pathSegments.length === 1, // Is last if only /category
      isLoading: false,
    });

    // Find the current category ID from the path (last numeric segment after 'category')
    const categoryId = pathSegments.findLast(
      (segment) => !isNaN(segment) && segment !== ""
    );

    if (categoryId) {
      let currentCategory = categories.find(
        (cat) => String(cat.id) === String(categoryId)
      );

      const hierarchy = [];
      while (currentCategory) {
        hierarchy.unshift(currentCategory); // Add to the beginning of the array
        if (currentCategory.parent_id) {
          currentCategory = categories.find(
            (cat) => String(cat.id) === String(currentCategory.parent_id)
          );
        } else {
          currentCategory = null; // Reached the top level
        }
      }

      // Add categories from the traced hierarchy to breadcrumbs (excluding the first one if it's the target of the base /categories link)
      let cumulativeCategoryPath = "/category";
      hierarchy.forEach((cat, index) => {
        // Construct the route incrementally based on the hierarchy IDs
        cumulativeCategoryPath += `/${cat.id}`;

        const isLast =
          index === hierarchy.length - 1 &&
          pathSegments.indexOf(String(cat.id)) === pathSegments.length - 1; // Check if this is the last category in the hierarchy and the last segment in the original path

        breadcrumbItems.push({
          name: cat.name,
          routeTo: cumulativeCategoryPath, // Hierarchical route
          isLast: isLast,
          isLoading: false, // Assuming category names from context are not async loaded here
        });
      });
    }

    // Handle any segments *after* the category path (shouldn't happen with current routing, but for robustness)
    const lastCategorySegmentIndex = pathSegments.findLastIndex(
      (segment) => !isNaN(segment) && segment !== ""
    );
    if (
      lastCategorySegmentIndex !== -1 &&
      lastCategorySegmentIndex < pathSegments.length - 1
    ) {
      let subsequentPath =
        "/category" +
        pathSegments.slice(1, lastCategorySegmentIndex + 1).join("/"); // Start path from /category/last-category-id
      for (let i = lastCategorySegmentIndex + 1; i < pathSegments.length; i++) {
        subsequentPath += `/${pathSegments[i]}`;
        const segmentName =
          pathSegments[i].charAt(0).toUpperCase() + pathSegments[i].slice(1);
        const isLast = i === pathSegments.length - 1;
        // Determine if it's a product segment if needed

        breadcrumbItems.push({
          name: segmentName,
          routeTo: subsequentPath,
          isLast: isLast,
          isLoading: false, // Adjust if these segments require async name fetching
        });
      }
    }
  } else if (pathSegments[0] === "products") {
    // Handle paths starting with /products
    breadcrumbItems.push({
      name: "Products",
      routeTo: "/products",
      isLast: pathSegments.length === 1,
      isLoading: false,
    });

    // Check if we have detailed product data with category hierarchy
    const productSegmentData = segmentData[1]; // Assuming product ID is always the second segment

    if (productSegmentData?.type === "productWithCategory") {
      // Add category hierarchy breadcrumbs
      let cumulativeCategoryPath = "/category";
      productSegmentData.hierarchy.forEach((cat, index) => {
        cumulativeCategoryPath += `/${cat.id}`;
        breadcrumbItems.push({
          name: cat.name,
          routeTo: cumulativeCategoryPath,
          isLast: false, // Not the last item yet
          isLoading: false,
        });
      });

      // Add the product breadcrumb
      const productRoute = `/products/${productSegmentData.productId}`;
      breadcrumbItems.push({
        name: productSegmentData.productName,
        routeTo: productRoute,
        isLast: true, // This is the last item
        isLoading: false,
      });
    } else if (pathSegments.length > 1 && !isNaN(pathSegments[1])) {
      // Fallback to just product name if detailed data not available or loading
      const productId = pathSegments[1];
      const productRoute = `/products/${productId}`;
      breadcrumbItems.push({
        name: productSegmentData?.name || `Product ${productId}`, // Use fetched product name or fallback
        routeTo: productRoute,
        isLast: pathSegments.length === 2,
        isLoading: productSegmentData?.isLoading || false,
      });
    }

    // Handle any segments after the product ID (if any) - keep existing logic
    if (pathSegments.length > 2) {
      let productSubsequentPath = `/products/${pathSegments[1]}`;
      for (let i = 2; i < pathSegments.length; i++) {
        productSubsequentPath += `/${pathSegments[i]}`;
        const segmentName =
          pathSegments[i].charAt(0).toUpperCase() + pathSegments[i].slice(1);
        breadcrumbItems.push({
          name: segmentName,
          routeTo: productSubsequentPath,
          isLast: i === pathSegments.length - 1,
          isLoading: false,
        });
      }
    }
  } else {
    // Handle other general paths (e.g., /about, /contact)
    let cumulativePath = "";
    pathSegments.forEach((name, index) => {
      cumulativePath += `/${name}`;
      breadcrumbItems.push({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        routeTo: cumulativePath,
        isLast: index === pathSegments.length - 1,
        isLoading: false,
      });
    });
  }

  // Final pass: ensure the last item is marked as isLast correctly
  if (breadcrumbItems.length > 0) {
    breadcrumbItems[breadcrumbItems.length - 1].isLast = true;
  }

  return (
    <nav aria-label="breadcrumb" className="text-gray-700 p-4">
      <ol className="list-none p-0 inline-flex">
        {breadcrumbItems.map((item, index) => (
          <li key={index} className="flex items-center">
            <span className="mx-2">/</span>
            {item.isLast ? (
              <span className="text-gray-500">
                {item.isLoading ? "Loading..." : item.name}
              </span>
            ) : (
              <Link
                to={item.routeTo}
                className="text-black-600 hover:underline"
              >
                {item.isLoading ? "Loading..." : item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
