import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStoredLanguage, setStoredLanguage } from '../utils/i18n';

const LangContext = createContext();

export function LangProvider({ children }) {
  const [lang, setLang] = useState(getStoredLanguage());

  const changeLanguage = (code) => {
    setLang(code);
    setStoredLanguage(code);
    // Compatibility with existing event listeners if any
    window.dispatchEvent(new CustomEvent('verixa-lang-change', { detail: code }));
  };

  return (
    <LangContext.Provider value={{ lang, changeLanguage }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
