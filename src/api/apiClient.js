import axios from "axios";

// Direct connection to CMS backend
// const baseURL = process.env.NODE_ENV === 'production'
//   ? 'https://cms.wininvoice.vn/api'  
//   : 'http://localhost:44344/api';     

//Test thì mở ra - dưới local
const baseURL = '';

const api = axios.create({
  baseURL,
  headers: { 
    "Content-Type": "application/json",
  },
});

export default api;
