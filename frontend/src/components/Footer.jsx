import React from "react";
// Assuming you have react-icons installed: npm install react-icons
// Import the necessary icons, e.g., from 'react-icons/fa' for Font Awesome
import { FaFacebook, FaTiktok, FaWhatsapp } from "react-icons/fa6"; // Import the necessary icons
import { MdEmail } from "react-icons/md"; // Import Email icon
import { useTranslation } from "react-i18next";
const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="bg-gray-800 text-white text-center p-8 mt-8">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Contact Us Section */}
        <div>
          <h3 className="text-xl font-semibold mb-4">
            {t("footer.contact_us")}
          </h3>
          <div className="flex items-center mb-2">
            <MdEmail className="mr-2 text-2xl" /> {/* Email Icon */}
            <a
              href="mailto:mrit.laos@gmail.com"
              className="text-white hover:underline"
            >
              mrit.laos@gmail.com
            </a>
          </div>
          <div className="flex items-center mb-2">
            <FaWhatsapp className="mr-2 text-2xl" /> {/* WhatsApp Icon */}
            <a
              href="https://wa.me/8562059450123"
              className="text-white hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              020 59 450 123
            </a>{" "}
          </div>
          <p>{t("footer.address")}</p>
        </div>

        {/* Follow Us Section */}
        <div>
          <h3 className="text-xl font-semibold mb-4">
            {t("footer.follow_us")}
          </h3>
          <div className="flex justify-center space-x-4">
            {/* Replace text with icons */}
            <a
              href="https://www.facebook.com/mritlao/"
              target="_blank"
              className="text-white hover:text-gray-400 text-2xl"
              aria-label="Facebook"
            >
              <FaFacebook /> {/* Facebook Icon */}
            </a>
            <a
              href="https://www.tiktok.com/@mrit36"
              target="_blank"
              className="text-white hover:text-gray-400 text-2xl"
              aria-label="TikTok"
            >
              <FaTiktok /> {/* TikTok Icon */}
            </a>
          </div>
        </div>

        {/* Location Section */}
        <div>
          <h3 className="text-xl font-semibold mb-4">{t("footer.location")}</h3>
          {/* Embedded map */}
          <div className="w-full h-32 rounded-md overflow-hidden">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d1876.0275160342421!2d102.1477135!3d19.879898!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x312f2bd47df810bd%3A0x9201f6de08ca0e31!2sMA%20studio!5e0!3m2!1sen!2sla!4v1748934915191!5m2!1sen!2sla"
              width="400"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </div>

      <div className="mt-8 border-t border-gray-700 pt-4">
        <p>&copy; 2025 {t("footer.copyright")}. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
