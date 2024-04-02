import axios from 'axios'

const BASE_URL = import.meta.env.VITE_SERVER_URL
const instance = axios.create({
  baseURL: BASE_URL,
})

export default instance