import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const pandascore = axios.create({
  baseURL: process.env.PANDASCOPE_BASE_URL || 'https://api.pandascore.co',
  headers: {
    'Authorization': `Bearer ${process.env.PANDASCOPE_API_TOKEN}`,
    'Accept': 'application/json'
  }
});

export default pandascore;
