import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from "i18next-http-backend";

i18n
  .use(Backend)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    lng: "lo", // default language
    supportedLngs: ["en", "lo"],
    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json", // Path to your translation files
    },
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
