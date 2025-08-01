module.exports = {
  i18n: {
    defaultLocale: 'it',
    locales: ['it', 'en', 'es', 'fr', 'de'],
    localeDetection: true,
  },
  localePath: './public/locales',
  reloadOnPrerender: process.env.NODE_ENV === 'development'
}
