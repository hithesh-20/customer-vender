const express = require('express');
const router = express.Router();
const config = require('../config/config');
const cache = require('../config/redis');
const { sendSuccess, sendError } = require('../utils/response');

// Honest weather integration: only queries live OpenWeatherMap when WEATHER_API_KEY is configured
router.get('/current', async (req, res, next) => {
  try {
    if (!config.weather.enabled) {
      return sendError(
        res,
        'Weather API key (WEATHER_API_KEY) is not configured.',
        503,
        { code: 'WEATHER_NOT_CONFIGURED' }
      );
    }

    const city = (req.query.city || '').toString().trim();
    if (!city) {
      return sendError(res, 'Query parameter city is required', 400);
    }

    const cacheKey = `weather:${city.toLowerCase()}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return sendSuccess(res, cached, 'Weather fetched from cache');
    }

    const url = `${config.weather.baseUrl}/weather?q=${encodeURIComponent(city)},IN&units=metric&appid=${config.weather.apiKey}`;
    const resp = await fetch(url);
    if (!resp.ok) {
      return sendError(res, 'Unable to fetch weather from upstream provider', 502);
    }

    const raw = await resp.json();
    const data = {
      city: raw.name,
      temperatureC: raw.main?.temp ?? null,
      feelsLikeC: raw.main?.feels_like ?? null,
      humidityPercent: raw.main?.humidity ?? null,
      condition: raw.weather?.[0]?.main || null,
      description: raw.weather?.[0]?.description || null,
      updatedAt: new Date().toISOString(),
    };

    await cache.setEx(cacheKey, data, config.weather.cacheTtl);
    return sendSuccess(res, data, 'Weather fetched');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
