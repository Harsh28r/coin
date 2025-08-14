# Language Translation System

This document explains how to use the language translation system implemented in your news application.

## Overview

The language translation system allows users to switch between English and Hindi throughout the application. It includes:

- **Language Context**: Manages the current language state
- **Translation Keys**: Predefined translations for UI elements
- **Language Selector**: A dropdown component in the footer
- **Translation Utilities**: Helper functions for translating content

## Features

### ✅ Implemented
- Language switching between English (en) and Hindi (hi)
- Footer translations (company info, links, subscription form)
- Common UI element translations
- Language preference persistence in localStorage
- Responsive language selector with flags

### 🔄 Partially Implemented
- News content translation (placeholder system)
- Dynamic content translation utilities

### 📋 To Do
- Integrate with news components
- Add more language options
- Implement AI-powered content translation
- Add translation for dynamic news content

## How to Use

### 1. Basic Translation

```tsx
import { useLanguage } from '../context/LanguageContext';

const MyComponent = () => {
  const { t, currentLanguage } = useLanguage();
  
  return (
    <div>
      <h1>{t('common.title')}</h1>
      <p>Current language: {currentLanguage}</p>
    </div>
  );
};
```

### 2. Language Switching

```tsx
import { useLanguage } from '../context/LanguageContext';

const LanguageSwitcher = () => {
  const { setLanguage, currentLanguage } = useLanguage();
  
  return (
    <div>
      <button onClick={() => setLanguage('en')}>English</button>
      <button onClick={() => setLanguage('hi')}>हिंदी</button>
    </div>
  );
};
```

### 3. Adding New Translations

To add new translation keys, update the `translations` object in `src/context/LanguageContext.tsx`:

```tsx
const translations = {
  en: {
    'new.key': 'English Text',
    // ... more translations
  },
  hi: {
    'new.key': 'हिंदी टेक्स्ट',
    // ... more translations
  }
};
```

### 4. Using Translation Utilities

```tsx
import { translateTerm, formatTimeAgo } from '../utils/translationUtils';

// Translate common terms
const translatedTerm = translateTerm('readMore', currentLanguage);

// Format time with translation
const timeAgo = formatTimeAgo(new Date(), currentLanguage);
```

## File Structure

```
src/
├── context/
│   └── LanguageContext.tsx          # Language context and translations
├── Components/
│   ├── LanguageSelector.tsx         # Language dropdown component
│   └── footer.tsx                   # Updated footer with translations
├── utils/
│   └── translationUtils.ts          # Translation utility functions
└── App.tsx                          # Updated with LanguageProvider
```

## Integration Steps

### 1. Wrap Your App

```tsx
// App.tsx
import { LanguageProvider } from './context/LanguageContext';

function App() {
  return (
    <LanguageProvider>
      {/* Your existing providers and components */}
    </LanguageProvider>
  );
}
```

### 2. Update Components

Replace hardcoded text with translation keys:

```tsx
// Before
<h1>Latest News</h1>

// After
<h1>{t('news.latest')}</h1>
```

### 3. Add Language Selector

The language selector is automatically added to the footer. You can also add it to other components:

```tsx
import LanguageSelector from './LanguageSelector';

// In your component
<LanguageSelector />
```

## Available Translation Keys

### Footer
- `footer.aboutUs` - About Us
- `footer.contactUs` - Contact Us
- `footer.faq` - FAQ
- `footer.privacyPolicy` - Privacy Policy
- `footer.disclaimer` - Disclaimer
- `footer.didYouKnow` - Did You Know
- `footer.learnMore` - Learn More
- `footer.newFeature` - New Feature
- `footer.trending` - Trending
- `footer.events` - Events
- `footer.joinCommunity` - Join Our Community
- `footer.subscribe` - Subscribe
- `footer.enterEmail` - Enter your email
- `footer.subscribing` - Subscribing...
- `footer.subscriptionText` - Subscription description
- `footer.copyright` - Copyright text
- `footer.companyDescription` - Company description

### Common
- `common.loading` - Loading...
- `common.error` - Error
- `common.success` - Success
- `common.submit` - Submit
- `common.cancel` - Cancel
- `common.save` - Save
- `common.delete` - Delete
- `common.edit` - Edit
- `common.view` - View
- `common.search` - Search
- `common.filter` - Filter
- `common.sort` - Sort
- `common.readMore` - Read More
- `common.readLess` - Read Less

### News
- `news.latest` - Latest News
- `news.trending` - Trending News
- `news.exclusive` - Exclusive News
- `news.press` - Press News
- `news.market` - Market News
- `news.crypto` - Cryptocurrency
- `news.blockchain` - Blockchain
- `news.defi` - DeFi
- `news.nft` - NFT
- `news.marketCap` - Market Cap
- `news.price` - Price
- `news.change` - Change
- `news.volume` - Volume
- `news.supply` - Supply

### Navigation
- `nav.home` - Home
- `nav.news` - News
- `nav.blog` - Blog
- `nav.market` - Market
- `nav.about` - About
- `nav.contact` - Contact
- `nav.login` - Login
- `nav.logout` - Logout
- `nav.admin` - Admin
- `nav.dashboard` - Dashboard

### Forms
- `form.email` - Email
- `form.password` - Password
- `form.name` - Name
- `form.message` - Message
- `form.required` - This field is required
- `form.invalidEmail` - Please enter a valid email address
- `form.passwordLength` - Password must be at least 6 characters
- `form.confirmPassword` - Confirm Password
- `form.passwordsNotMatch` - Passwords do not match

### Error Messages
- `error.network` - Network error message
- `error.general` - General error message
- `error.notFound` - Page not found message
- `error.unauthorized` - Unauthorized access message
- `error.server` - Server error message

### Success Messages
- `success.subscription` - Subscription success message
- `success.login` - Login success message
- `success.logout` - Logout success message
- `success.save` - Save success message
- `success.delete` - Delete success message

## Next Steps

1. **Integrate with News Components**: Update news components to use translation keys
2. **Add More Languages**: Extend the system to support more languages
3. **AI Translation**: Integrate with translation APIs for dynamic content
4. **Content Management**: Create admin interface for managing translations
5. **SEO Optimization**: Add language-specific meta tags and URLs

## Troubleshooting

### Common Issues

1. **Translation not working**: Ensure the component is wrapped in `LanguageProvider`
2. **Missing translations**: Check if the translation key exists in the context
3. **Language not persisting**: Verify localStorage is enabled in the browser

### Debug Mode

Add this to see current language state:

```tsx
const { currentLanguage, t } = useLanguage();
console.log('Current language:', currentLanguage);
console.log('Translation test:', t('common.loading'));
```

## Contributing

When adding new features or components:

1. Use translation keys instead of hardcoded text
2. Add new translation keys to the context
3. Test both languages
4. Update this documentation

## Support

For questions or issues with the translation system, check:
1. Browser console for errors
2. React DevTools for context state
3. localStorage for saved preferences
