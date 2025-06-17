import React, { useEffect, useState } from "react";
// Import Slider component and styles
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import LoadingSpinner from "./LoadingSpinner";
import "slick-carousel/slick/slick-theme.css";
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
        const API_URL =
          import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        const response = await fetch(`${API_URL}/api/products/new-arrivals`);
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

  // Slider settings with different configurations for desktop and mobile
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: true,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          arrows: false,
          dots: true,
        },
      },
    ],
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-100 backdrop-blur-sm flex items-center justify-center z-50">
        <div className=" p-8 rounded-xl ">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-red-200 h-64 flex items-center justify-center">
        <p className="text-red-800 text-xl">
          {t("error_loading_top_products")}
        </p>
      </div>
    );
  }

  return (
    <div className="slick-container w-full">
      <Slider {...settings}>
        {topProducts.map((product) => (
          <div key={product.id} className="relative px-1">
            <Link to={`/products/${product.id}`}>
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full md:h-[400px] h-[200px] object-cover rounded-lg"
                style={{ margin: "0 auto" }}
              />
            </Link>
          </div>
        ))}
      </Slider>
      <style>{`
        .slick-container {
          margin: 0 auto;
          position: relative;
        }

        .slick-container .slick-slide {
          padding: 0 4px;
        }

        .slick-container .slick-prev,
        .slick-container .slick-next {
          z-index: 1;
          width: 40px;
          height: 40px;
        }

        .slick-container .slick-prev {
          left: 10px;
        }

        .slick-container .slick-next {
          right: 10px;
        }

        @media (min-width: 768px) {
          .slick-container {
            width: 100%;
            max-width: 100%;
          }

          .slick-container .slick-slide img {
            width: 100%;
            height: 400px;
            object-fit: cover;
          }
        }
      `}</style>
    </div>
  );
}

export default HeroSlider;
