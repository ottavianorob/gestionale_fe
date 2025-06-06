import React, { useState, useEffect, useCallback } from 'react';
import type { Coordinates, WeatherData, WeatherWidgetProps, ActivityLogType } from '../types';
import { SunIcon, CloudIcon, RainIcon, SnowIcon, ThunderstormIcon, PartlyCloudyIcon, FogIcon, WeatherQuestionIcon } from './icons';

// Helper to get OpenWeatherMap API key from environment variables
const getOpenWeatherMapApiKey = (): string | undefined => {
  if (typeof import.meta !== 'undefined' && typeof import.meta.env !== 'undefined') {
    // Access only if import.meta.env is defined
    // console.log('[WeatherWidget] Attempting to read VITE_OPENWEATHERMAP_API_KEY from import.meta.env:', import.meta.env.VITE_OPENWEATHERMAP_API_KEY);
    return import.meta.env.VITE_OPENWEATHERMAP_API_KEY;
  }
  console.warn('[WeatherWidget] import.meta.env is not available. VITE_OPENWEATHERMAP_API_KEY cannot be read.');
  // Fallback for other environments (e.g., Node.js, if this code were run there)
  // This part might not be directly used in a pure Vite frontend but is good practice.
  if (typeof process !== 'undefined' && process.env) {
    console.log('[WeatherWidget] Attempting to read OPENWEATHERMAP_API_KEY from process.env');
    return process.env.OPENWEATHERMAP_API_KEY;
  }
  return undefined;
};


const WeatherIconMap: React.FC<{ code: string; className?: string }> = ({ code, className = "w-10 h-10" }) => {
  // Simplified mapping based on OpenWeatherMap icon codes
  // (https://openweathermap.org/weather-conditions#Weather-Condition-Codes-2)
  if (code.startsWith('01')) return <SunIcon className={className} />; // clear sky
  if (code.startsWith('02')) return <PartlyCloudyIcon className={className} />; // few clouds
  if (code.startsWith('03') || code.startsWith('04')) return <CloudIcon className={className} />; // scattered/broken clouds
  if (code.startsWith('09') || code.startsWith('10')) return <RainIcon className={className} />; // shower rain / rain
  if (code.startsWith('11')) return <ThunderstormIcon className={className} />; // thunderstorm
  if (code.startsWith('13')) return <SnowIcon className={className} />; // snow
  if (code.startsWith('50')) return <FogIcon className={className} />; // mist/fog
  return <WeatherQuestionIcon className={className} />; // default/unknown
};

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ addActivityLogEntry }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const apiKey = getOpenWeatherMapApiKey();

  const fetchWeatherData = useCallback(async (coords: Coordinates) => {
    if (!apiKey) {
      setError("API Key OpenWeatherMap mancante. Configurala nel file .env (VITE_OPENWEATHERMAP_API_KEY).");
      addActivityLogEntry('WEATHER_FETCH' as ActivityLogType, "Errore: API Key OpenWeatherMap non configurata.", { error: "API_KEY_MISSING"});
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${coords.latitude}&lon=${coords.longitude}&appid=${apiKey}&units=metric&lang=it`
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({message: "Errore API sconosciuto"}));
        throw new Error(errorData.message || `Errore API: ${response.status}`);
      }
      const data = await response.json();
      setWeather({
        temperature: Math.round(data.main.temp),
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        cityName: data.name,
      });
      addActivityLogEntry('WEATHER_FETCH' as ActivityLogType, `Meteo recuperato per ${data.name}: ${data.weather[0].description}, ${Math.round(data.main.temp)}°C`);
    } catch (err: any) {
      setError(err.message || "Errore recupero dati meteo.");
      addActivityLogEntry('WEATHER_FETCH' as ActivityLogType, "Fallito recupero dati meteo.", { error: err.message });
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, addActivityLogEntry]);

  const fetchCoordinatesAndWeather = useCallback(() => {
    setIsLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeatherData({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (geoError) => {
          addActivityLogEntry('WEATHER_FETCH' as ActivityLogType, "Geolocalizzazione fallita, tentativo fallback IP.", { error: geoError.message });
          // Fallback to IP-based geolocation
          fetch('https://ip-api.com/json/?fields=status,message,lat,lon,city')
            .then(res => res.json())
            .then(data => {
              if (data.status === 'success' && data.lat && data.lon) {
                fetchWeatherData({ latitude: data.lat, longitude: data.lon });
              } else {
                setError(data.message || "Posizione IP non trovata.");
                addActivityLogEntry('WEATHER_FETCH' as ActivityLogType, "Fallback geolocalizzazione IP fallito.", { error: data.message });
                setIsLoading(false);
              }
            })
            .catch(ipErr => {
              setError("Errore geolocalizzazione IP.");
              addActivityLogEntry('WEATHER_FETCH'as ActivityLogType, "Errore chiamata geolocalizzazione IP.", { error: ipErr.message });
              setIsLoading(false);
            });
        },
        { timeout: 10000 } // 10 seconds timeout for geolocation
      );
    } else {
      setError("Geolocalizzazione non supportata.");
      addActivityLogEntry('WEATHER_FETCH' as ActivityLogType, "Geolocalizzazione browser non supportata.");
      setIsLoading(false);
    }
  }, [fetchWeatherData, addActivityLogEntry]);

  useEffect(() => {
    fetchCoordinatesAndWeather(); // Fetch on mount
    const intervalId = setInterval(fetchCoordinatesAndWeather, 30 * 60 * 1000); // Refresh every 30 minutes
    return () => clearInterval(intervalId);
  }, [fetchCoordinatesAndWeather]);

  const getShortErrorText = () => {
    if (!error) return 'Err';
    const lowerError = error.toLowerCase();
    if (lowerError.includes('api key') || lowerError.includes('apikey') || lowerError.includes('appid')) return 'Key?';
    if (lowerError.includes('posizione') || lowerError.includes('geolocalizzazione') || lowerError.includes('location')) return 'Pos?';
    if (lowerError.includes('api') || lowerError.includes('fetch') || lowerError.includes('network')) return 'API?';
    return 'Err';
  };

  if (isLoading) {
    return <div className="flex items-center text-xs text-content/70 w-20 h-14 justify-center"><svg className="animate-spin h-5 w-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><circle className="opacity-25" cx="12" cy="12" r="10"></circle><path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>;
  }

  if (error) {
    return <div className="flex items-center text-xs text-danger/80 w-20 h-14 justify-center text-center" title={error}><WeatherQuestionIcon className="w-6 h-6 mr-1" /> {getShortErrorText()}</div>;
  }

  if (!weather) {
    return <div className="flex items-center text-xs text-content/70 w-20 h-14 justify-center">N/D</div>;
  }

  return (
    <div className="flex items-center space-x-1.5 sm:space-x-2 text-content/90" title={`${weather.description} a ${weather.cityName}`}>
      <WeatherIconMap code={weather.icon} className="w-10 h-10 sm:w-12 sm:h-12 text-accent flex-shrink-0" />
      <span className="text-base sm:text-lg font-medium">{weather.temperature}°C</span>
    </div>
  );
};