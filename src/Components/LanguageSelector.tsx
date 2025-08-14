import React from 'react';
import { Dropdown, Button } from 'react-bootstrap';
import { Globe, Check } from 'lucide-react';
import { useLanguage, Language } from '../context/LanguageContext';
import 'bootstrap/dist/css/bootstrap.min.css';

const LanguageSelector: React.FC = () => {
  const { currentLanguage, setLanguage, t } = useLanguage();

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' }
  ];

  const handleLanguageChange = (languageCode: Language) => {
    setLanguage(languageCode);
  };

  return (
    <div className="language-selector">
      <Dropdown>
        <Dropdown.Toggle 
          variant="outline-light" 
          id="language-dropdown"
          className="d-flex align-items-center gap-2"
          style={{
            border: '1px solid rgba(255, 255, 255, 0.3)',
            backgroundColor: 'transparent',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '0.9rem',
            transition: 'all 0.3s ease'
          }}
        >
          <Globe size={16} />
          <span>{languages.find(lang => lang.code === currentLanguage)?.flag}</span>
          <span>{languages.find(lang => lang.code === currentLanguage)?.name}</span>
        </Dropdown.Toggle>

        <Dropdown.Menu 
          style={{
            backgroundColor: '#2c2c2c',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            minWidth: '180px'
          }}
        >
          {languages.map((language) => (
            <Dropdown.Item
              key={language.code}
              onClick={() => handleLanguageChange(language.code as Language)}
              className="d-flex align-items-center justify-content-between py-2 px-3"
              style={{
                color: currentLanguage === language.code ? '#ffc107' : 'white',
                backgroundColor: currentLanguage === language.code ? 'rgba(255, 193, 7, 0.1)' : 'transparent',
                border: 'none',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (currentLanguage !== language.code) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentLanguage !== language.code) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div className="d-flex align-items-center gap-2">
                <span style={{ fontSize: '1.2rem' }}>{language.flag}</span>
                <span style={{ fontSize: '0.9rem' }}>{language.name}</span>
              </div>
              {currentLanguage === language.code && (
                <Check size={16} color="#ffc107" />
              )}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>

      <style>
        {`
          .language-selector .dropdown-toggle:hover {
            background-color: rgba(255, 255, 255, 0.1) !important;
            border-color: rgba(255, 255, 255, 0.5) !important;
          }
          
          .language-selector .dropdown-toggle:focus {
            box-shadow: 0 0 0 0.2rem rgba(255, 193, 7, 0.25) !important;
          }
          
          .language-selector .dropdown-item:active {
            background-color: rgba(255, 193, 7, 0.2) !important;
          }
          
          .language-selector .dropdown-menu {
            margin-top: 8px;
          }
          
          @media (max-width: 768px) {
            .language-selector .dropdown-toggle {
              font-size: 0.8rem;
              padding: 6px 12px;
            }
          }
        `}
      </style>
    </div>
  );
};

export default LanguageSelector;
