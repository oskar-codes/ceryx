export default {
  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: 'Ceryx',
    htmlAttrs: {
      lang: 'en'
    },
    bodyAttrs: {
      // class: 'darken',
      // 'vs-theme': 'dark'
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' },
      { name: 'format-detection', content: 'telephone=no' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [
    '@/assets/css/main.css'
  ],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
    { src: '~/plugins/workers.client.js' }
   ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
  ],

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {
    extend (config, { isClient }) {
     if (isClient) {
      config.module.rules.push({
       test: /\.worker\.js$/,
       loader: 'worker-loader',
       exclude: /(node_modules)/
      })
     }
    }
   }
}
