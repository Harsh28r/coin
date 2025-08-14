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
  
  // Create a stable signature for items to avoid effect loops due to new array refs
  const itemsSignature = JSON.stringify(
    (newsItems || []).map((item) => `${item['article_id'] || ''}|${item.title || ''}|${item['link'] || ''}`)
  );

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

  // Effect to translate news when language or content changes
  useEffect(() => {
    let isCancelled = false;
    
    const run = async () => {
      if (!newsItems || newsItems.length === 0) {
        // Clear translations when no items
        setTranslatedItems([]);
        setIsTranslating(false);
        return;
      }
      
      // For English, show original items without triggering translation churn
      if (currentLanguage === 'en') {
        setTranslatedItems([]);
        setIsTranslating(false);
        return;
      }
      
      setIsTranslating(true);
      try {
        const translated = await Promise.all(
          newsItems.map(item => translateNewsItem(item, currentLanguage))
        );
        if (!isCancelled) {
          setTranslatedItems(translated);
        }
      } catch (e) {
        if (!isCancelled) {
          setTranslatedItems(newsItems);
        }
      } finally {
        if (!isCancelled) {
          setIsTranslating(false);
        }
      }
    };
    
    run();
    return () => { isCancelled = true; };
  }, [currentLanguage, itemsSignature]);

  // Use translated news items for display
  const displayItems = translatedItems.length > 0 ? translatedItems : newsItems;

  return {
    displayItems,
    isTranslating,
    currentLanguage
  };
};
