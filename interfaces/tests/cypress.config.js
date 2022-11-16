module.exports = {
  'baseUrl-PA': 'http://localhost:8008',
  'baseUrl-AW': 'http://localhost:8080',
  'baseUrl-HO': 'http://localhost:8888',
  'baseUrl-server': 'http://localhost:3000/api',
  e2e: {
    setupNodeEvents(on, config) {
      require('dotenv').config({ path: '../../services/.env' })
      if (process.env.NODE_ENV === 'development') {
        config.env.RESET_SECRET = process.env.RESET_SECRET
      }
      return config
    },
  },
}
