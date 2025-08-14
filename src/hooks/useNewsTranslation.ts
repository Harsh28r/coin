import { useState, useEffect } from 'react';
import { useLanguage, Language } from '../context/LanguageContext';
import { translateNewsItem } from '../utils/translationUtils';

interface NewsItem {
  title: string;
  description: string;
  [key: string]: any; // Allow additional properties
}

export const useNewsTranslation = (newsItems: NewsItem[]) => {
  const { currentLanguage } = useLanguage();
  const [translatedItems, setTranslatedItems] = useState<NewsItem[]>([]);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  // Function to translate news items when language changes
  const translateNewsItems = async (items: NewsItem[], targetLanguage: Language) => {
    if (targetLanguage === 'en') {
      setTranslatedItems(items);
      return;
    }

    setIsTranslating(true);
    try {
      const translatedItems = await Promise.all(
        items.map(item => translateNewsItem(item, targetLanguage))
      );
      setTranslatedItems(translatedItems);
    } catch (error) {
      console.warn('Failed to translate news items:', error);
      setTranslatedItems(items); // Fallback to original
    } finally {
      setIsTranslating(false);
    }
  };

  // Effect to translate news when language changes
  useEffect(() => {
    if (newsItems.length > 0) {
      translateNewsItems(newsItems, currentLanguage);
    }
  }, [currentLanguage, newsItems]);

  // Use translated news items for display
  const displayItems = translatedItems.length > 0 ? translatedItems : newsItems;

  return {
    displayItems,
    isTranslating,
    currentLanguage
  };
};
