import React, { useEffect, useState } from "react";
// Import Slider component and styles
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "../slick-theme.css"; // Corrected import path
import { Link } from "react-router-dom"; // Import Link
import { useTranslation } from "react-i18next"; // Import useTranslation

function HeroSlider() {
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation(); // Get the t function

  useEffect(() => {
    const fetchTopProducts = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/products/new-arrivals"
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setTopProducts(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching top selling products:", err);
        setError("Failed to load top products.");
        setLoading(false);
      }
    };

    fetchTopProducts();
  }, []); // Empty dependency array means this effect runs once on mount

  // Slider settings
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    arrows: false,
    fade: true,
    pauseOnHover: false,
    // Add more settings as needed (e.g., arrows, fade)
  };

  if (loading) {
    return (
      <div className="hero-banner w-full md:w-3/4 lg:w-4/5 bg-gray-200 h-64 flex items-center justify-center">
        <p className="text-gray-600 text-xl">{t("loading_top_products")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="hero-banner w-full md:w-3/4 lg:w-4/5 bg-red-200 h-64 flex items-center justify-center">
        <p className="text-red-800 text-xl">
          {t("error_loading_top_products")}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full md:w-11/12 lg:w-5/6 mx-auto">
      <Slider {...settings}>
        {topProducts.map((product) => (
          <div
            key={product.id}
            className="hero-slide"
            style={{ textAlign: "center", cursor: "pointer" }}
          >
            <Link to={`/products/${product.id}`}>
              <img
                src={product.image_url}
                alt={product.name}
                style={{
                  width: "100%",
                  maxWidth: "1050px",
                  maxHeight: "300px",
                  objectFit: "contain",
                  margin: "0 auto",
                }}
              />
            </Link>
            {/* <h3 style={{ marginTop: "10px" }}>{product.name}</h3> */}
            {/* <p>Price: ${parseFloat(product.price).toFixed(2)}</p> */}
            {/* Add a link to the product page if you have one */}
            {/* <a href={\`/products/${product.id}\`}>View Product</a> */}
          </div>
        ))}
      </Slider>
    </div>
  );
}

export default HeroSlider;
