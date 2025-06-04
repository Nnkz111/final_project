import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { useCategories } from "../context/CategoryContext"; // Import useCategories
import { useTranslation } from "react-i18next";

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);
  const { categories } = useCategories(); // Get categories from context
  const { t } = useTranslation(); // Initialize useTranslation

  // State to hold fetched names and loading status for each segment by index
  const [segmentData, setSegmentData] = useState({});

  // Placeholder function to fetch product name by ID
  const fetchProductName = async (id) => {
    // *** Replace this with your actual product data fetching logic ***

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
    if (!categories || categories.length === 0) return t(`Category ${id}`); // Return translated ID fallback if categories not loaded
    const category = categories.find((cat) => String(cat.id) === String(id));
    // Return the raw category name here, translation will be applied based on position in breadcrumbItems
    return category ? category.name : `Category ${id}`;
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
        // Category names are available from the context immediately
        // Store raw name; translation will be applied in breadcrumbItems generation based on position
        const categoryName = getCategoryName(name);
        initialSegmentData[index] = { name: categoryName, isLoading: false };
      } else {
        initialSegmentData[index] = {
          name: t(name.charAt(0).toUpperCase() + name.slice(1)), // Translate capitalized segment
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
                // Store raw category names; translation will be applied in breadcrumbItems generation
                hierarchy: hierarchy.map((cat) => ({
                  name: cat.name,
                  id: cat.id,
                })),
                productName: product.name, // Keep raw product name for fetching
                productId: product.id,
                isLoading: false,
              },
            }));
          } else {
            // Product found, but category not found in context
            setSegmentData((prevData) => ({
              ...prevData,
              [index]: { name: product.name, isLoading: false }, // Fallback to just raw product name
            }));
          }
        } else if (product) {
          // Product found, but no category ID
          setSegmentData((prevData) => ({
            ...prevData,
            [index]: { name: product.name, isLoading: false }, // Fallback to just raw product name
          }));
        } else {
          // Product not found or error
          setSegmentData((prevData) => ({
            ...prevData,
            [index]: { name: `Product ${id}`, isLoading: false }, // Fallback to raw Product ID
          }));
        }
      }
    });
  }, [location.pathname, categories, t]); // Added t as a dependency

  // Build the breadcrumb items array
  const breadcrumbItems = [];

  // Add Home breadcrumb (always translated)
  breadcrumbItems.push({
    name: t("Home"),
    routeTo: "/",
    isLast: false,
    isLoading: false,
  });

  const pathSegments = location.pathname
    .split("/")
    .filter((segment) => segment !== "");

  // Explicitly handle /checkout path
  if (location.pathname === "/checkout") {
    breadcrumbItems.push({
      name: t("Cart"),
      routeTo: "/cart",
      isLast: false,
      isLoading: false,
    });
    breadcrumbItems.push({
      name: t("Checkout"),
      routeTo: "/checkout",
      isLast: true,
      isLoading: false,
    });
  } else if (pathSegments[0] === "category") {
    // Handle paths starting with 'category'
    breadcrumbItems.push({
      name: t("Category"), // Translate the base "Category" link
      routeTo: "/categories",
      isLast: pathSegments.length === 1,
      isLoading: false,
    });

    // Find the current category ID from the path
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
          currentCategory = null;
        }
      }

      // Add categories from the traced hierarchy to breadcrumbs
      let cumulativeCategoryPath = "/category";
      hierarchy.forEach((cat, index) => {
        cumulativeCategoryPath += `/${cat.id}`;

        const isLast =
          index === hierarchy.length - 1 &&
          pathSegments.indexOf(String(cat.id)) === pathSegments.length - 1;

        // Translate only the direct child of the base 'Category' link (index 0 in hierarchy)
        const categoryDisplayName =
          index === 0 ? t(`category_${cat.name}`) : cat.name;

        breadcrumbItems.push({
          name: categoryDisplayName, // Use conditionally translated name
          routeTo: cumulativeCategoryPath,
          isLast: isLast,
          isLoading: false,
        });
      });
    }

    // Handle any segments *after* the category path (shouldn't happen with current routing)
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
        const segmentName = t(
          pathSegments[i].charAt(0).toUpperCase() + pathSegments[i].slice(1)
        ); // Translate capitalized segment
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
      name: t("Products"), // Translate "Products"
      routeTo: "/products",
      isLast: pathSegments.length === 1,
      isLoading: false,
    });

    // Check if we have detailed product data with category hierarchy
    const productSegmentData = segmentData[1]; // Assuming product ID is always the second segment

    if (productSegmentData?.type === "productWithCategory") {
      // Add category hierarchy breadcrumbs
      let cumulativeCategoryPath = "/category";
      productSegmentData.hierarchy.forEach((cat, index, arr) => {
        cumulativeCategoryPath += `/${cat.id}`;
        // Translate all categories in the product hierarchy using the category_<name> format
        const categoryDisplayName = t(`category_${cat.name}`);

        breadcrumbItems.push({
          name: categoryDisplayName, // Use translated category name
          routeTo: cumulativeCategoryPath,
          isLast: false, // Not the last item yet
          isLoading: false,
        });
      });

      // Add the product breadcrumb (always translated)
      const productRoute = `/products/${productSegmentData.productId}`;
      breadcrumbItems.push({
        name: t(productSegmentData.productName), // Translate product name
        routeTo: productRoute,
        isLast: true,
        isLoading: false,
      });
    } else if (pathSegments.length > 1 && !isNaN(pathSegments[1])) {
      // Fallback to just product name if detailed data not available or loading
      const productId = pathSegments[1];
      const productRoute = `/products/${productId}`;
      breadcrumbItems.push({
        name: t(productSegmentData?.name) || t(`Product ${productId}`), // Use fetched product name or fallback, translated
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
        const segmentName = t(
          pathSegments[i].charAt(0).toUpperCase() + pathSegments[i].slice(1)
        ); // Translate capitalized segment
        breadcrumbItems.push({
          name: segmentName,
          routeTo: productSubsequentPath,
          isLast: i === pathSegments.length - 1,
          isLoading: false,
        });
      }
    }
  } else if (pathSegments[0] === "cart") {
    // Handle /cart path
    breadcrumbItems.push({
      name: t("Cart"), // Translate "Cart"
      routeTo: "/cart",
      isLast: pathSegments.length === 1, // Is last if only /cart
      isLoading: false,
    });

    // Handle any segments after /cart (e.g., /cart/checkout)
    if (pathSegments.length > 1 && pathSegments[1] === "checkout") {
      breadcrumbItems.push({
        name: t("Checkout"), // Translate "Checkout"
        routeTo: "/cart/checkout", // Link to the checkout page
        isLast: pathSegments.length === 2, // Is last if only /cart/checkout
        isLoading: false,
      });
    }
  } else if (pathSegments.length > 0) {
    // Handle general paths
    let cumulativePath = "";
    pathSegments.forEach((name, index) => {
      cumulativePath += `/${name}`;
      let displayName = name.charAt(0).toUpperCase() + name.slice(1);

      // Customize display name for specific segments (always translated)
      if (name === "cart") {
        displayName = t("Cart");
      } else if (name === "checkout") {
        displayName = t("Checkout");
      } else if (name === "profile") {
        // Added translation for profile
        displayName = t("profile");
      } else if (name === "my-orders") {
        // Added translation for my-orders
        displayName = t("my_orders");
      } else {
        // For other general segments, check if it matches a category name (case-insensitive)
        const potentialCategory = categories.find(
          (cat) => cat.name.toLowerCase() === name.toLowerCase()
        );
        if (potentialCategory) {
          // Translate if it's a category name, but only if it's the first segment after Home
          // This handles cases like /Electronics directly
          displayName =
            index === 0
              ? t(`category_${potentialCategory.name}`)
              : potentialCategory.name;
        } else {
          // Default translation for capitalized segments
          displayName = t(displayName);
        }
      }

      breadcrumbItems.push({
        name: displayName, // Use determined display name (potentially translated)
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
    <nav className="text-sm font-medium text-gray-500">
      <ol className="list-none p-0 inline-flex">
        {breadcrumbItems.map((item, index) => (
          <li
            key={index}
            className={`flex items-center ${
              item.isLast ? "text-gray-700" : ""
            }`}
          >
            {item.isLast ? (
              <span className="text-gray-700">{item.name}</span>
            ) : (
              <Link to={item.routeTo} className="text-blue-600 hover:underline">
                {item.isLoading ? "Loading..." : item.name}
              </Link>
            )}
            {!item.isLast && (
              <svg
                className="fill-current w-3 h-3 mx-3 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 320 512"
              >
                {/* Font Awesome angle-right icon (for separator) */}
                <path d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z" />
              </svg>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
