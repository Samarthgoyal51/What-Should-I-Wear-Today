
(function () {
  const MIN_STATUS_DURATION = 800;
  let currentTheme = localStorage.getItem('theme') || 'light';

  
  document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    initializeEventListeners();
    runFlow();
  });

  function initializeTheme() {
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon();
  }

  function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    updateThemeIcon();
    showToast('Theme switched to ' + currentTheme + ' mode', 'info');
  }

  function updateThemeIcon() {
    const themeIcon = document.querySelector('.theme-icon');
    themeIcon.textContent = currentTheme === 'light' ? '🌙' : '☀️';
  }

  
  function initializeEventListeners() {
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    document.getElementById('refresh').addEventListener('click', runFlow);
    document.getElementById('share').addEventListener('click', shareWeather);
  }

  function runFlow() {
    showStatus('🌍 Detecting your location…');
    hideError();

    if (!('geolocation' in navigator)) {
      return approximateLocation('Geolocation is not supported by this browser.');
    }

    const requestStarted = Date.now();

    navigator.geolocation.getCurrentPosition(
      pos => holdMinimum(() => {
        const { latitude, longitude } = pos.coords;
        fetchWeather(latitude, longitude);
      }, requestStarted),
      err => holdMinimum(() => handleLocationError(err), requestStarted),
      {
        enableHighAccuracy: true,
        maximumAge: 300000, 
        timeout: 15000     
      }
    );
  }

  // Status Management
  function showStatus(text) {
    const statusSection = document.getElementById('status');
    const statusText = statusSection.querySelector('.status-text');
    
    statusText.textContent = text;
    statusSection.style.display = 'block';
    document.getElementById('weather').style.display = 'none';
  }

  function hideStatus() {
    document.getElementById('status').style.display = 'none';
  }

  function showError(message) {
    const errorSection = document.getElementById('error-section');
    const errorMessage = document.getElementById('error-message');
    
    errorMessage.textContent = message;
    errorSection.style.display = 'block';
    document.getElementById('weather').style.display = 'none';
    hideStatus();

    // Bind error action buttons
    document.getElementById('retry-btn').onclick = runFlow;
    document.getElementById('approx-btn').onclick = () => approximateLocation();
  }

  function hideError() {
    document.getElementById('error-section').style.display = 'none';
  }

  function holdMinimum(fn, start) {
    const elapsed = Date.now() - start;
    const wait = Math.max(0, MIN_STATUS_DURATION - elapsed);
    setTimeout(fn, wait);
  }

  // Location Error Handling
  function handleLocationError(err) {
    let message;
    switch (err.code) {
      case err.PERMISSION_DENIED:
        message = 'Location access was denied. Please enable location services and try again.';
        break;
      case err.POSITION_UNAVAILABLE:
        message = 'Location information is unavailable. Please check your connection.';
        break;
      case err.TIMEOUT:
        message = 'Location request timed out. Please try again.';
        break;
      default:
        message = 'Unable to retrieve your location. Please try again.';
    }
    showError(message);
  }

  // IP-based Location Fallback
  function approximateLocation(preface) {
    if (preface) {
      console.warn(preface);
    }
    showStatus('📍 Determining approximate location…');

    fetch('https://ipapi.co/json/')
      .then(r => {
        if (!r.ok) throw new Error('IP lookup failed');
        return r.json();
      })
      .then(({ latitude, longitude, city, country }) => {
        if (latitude == null || longitude == null) {
          throw new Error('IP lookup returned invalid data');
        }
        showToast(`Using approximate location: ${city}, ${country}`, 'info');
        fetchWeather(latitude, longitude, `${city}, ${country}`);
      })
      .catch(err => {
        console.error(err);
        showError('Unable to determine your location. Please try again later.');
      });
  }

  // Enhanced Weather Fetching
  function fetchWeather(lat, lon, locationName = null) {
    showStatus('🌤️ Fetching the latest weather…');
    const requestStarted = Date.now();

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,visibility&temperature_unit=celsius&windspeed_unit=kmh&timezone=auto`;

    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(json => {
        if (!json.current_weather) throw new Error('No weather data');
        
        // Get additional data from hourly forecast
        const currentHour = new Date().getHours();
        const hourlyData = {
          humidity: json.hourly?.relative_humidity_2m?.[currentHour] || null,
          windSpeed: json.hourly?.wind_speed_10m?.[currentHour] || json.current_weather.windspeed,
          visibility: json.hourly?.visibility?.[currentHour] || null
        };

        holdMinimum(() => {
          renderWeather(json.current_weather, hourlyData, locationName);
          showToast('Weather updated successfully!', 'success');
        }, requestStarted);
      })
      .catch(err => {
        console.error(err);
        showError('Unable to fetch weather data. Please check your connection and try again.');
      });
  }

  // Enhanced Weather Rendering
  function renderWeather(weather, additionalData, locationName) {
    const { temperature, weathercode, windspeed } = weather;
    
    // Update temperature
    document.querySelector('.temp-value').textContent = temperature.toFixed(1);
    
    // Update weather description and icon
    const description = describeCode(weathercode);
    document.querySelector('.weather-desc').textContent = description;
    document.getElementById('weather-icon').textContent = getWeatherIcon(weathercode);
    
    // Update location
    if (locationName) {
      document.getElementById('location-name').textContent = locationName;
    } else {
      document.getElementById('location-name').textContent = 'Current Location';
    }
    
    // Update additional weather details
    document.getElementById('wind-speed').textContent = `${windspeed || additionalData.windSpeed || 0} km/h`;
    document.getElementById('humidity').textContent = additionalData.humidity ? `${additionalData.humidity}%` : '--';
    document.getElementById('visibility').textContent = additionalData.visibility ? `${(additionalData.visibility / 1000).toFixed(1)} km` : '--';
    
    // Generate enhanced outfit suggestions
    const suggestions = generateOutfitSuggestions(temperature, weathercode);
    document.querySelector('.main-suggestion').textContent = suggestions.main;
    document.getElementById('top-suggestion').textContent = suggestions.top;
    document.getElementById('bottom-suggestion').textContent = suggestions.bottom;
    document.getElementById('outer-suggestion').textContent = suggestions.outer;
    document.getElementById('shoes-suggestion').textContent = suggestions.shoes;
    
    // Show weather section
    hideStatus();
    hideError();
    document.getElementById('weather').style.display = 'block';
  }

  // Enhanced Weather Icons
  function getWeatherIcon(code) {
    const icons = {
      0: '☀️',    // Clear
      1: '🌤️',    // Partly cloudy
      2: '⛅',    // Partly cloudy
      3: '☁️',    // Overcast
      45: '🌫️',   // Fog
      48: '🌫️',   // Fog
      51: '🌦️',   // Light drizzle
      53: '🌧️',   // Drizzle
      55: '🌧️',   // Heavy drizzle
      56: '🌨️',   // Light freezing drizzle
      57: '🌨️',   // Freezing drizzle
      61: '🌧️',   // Light rain
      63: '🌧️',   // Rain
      65: '🌧️',   // Heavy rain
      66: '🌨️',   // Light freezing rain
      67: '🌨️',   // Freezing rain
      71: '🌨️',   // Light snow
      73: '❄️',   // Snow
      75: '❄️',   // Heavy snow
      77: '🌨️',   // Snow grains
      80: '🌦️',   // Light rain showers
      81: '🌧️',   // Rain showers
      82: '⛈️',   // Heavy rain showers
      85: '🌨️',   // Light snow showers
      86: '❄️',   // Snow showers
      95: '⛈️',   // Thunderstorm
      96: '⛈️',   // Thunderstorm with hail
      99: '⛈️'    // Heavy thunderstorm with hail
    };
    return icons[code] || '🌤️';
  }

  // Enhanced Weather Descriptions
  function describeCode(code) {
    const codes = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      56: 'Light freezing drizzle',
      57: 'Dense freezing drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      66: 'Light freezing rain',
      67: 'Heavy freezing rain',
      71: 'Slight snow fall',
      73: 'Moderate snow fall',
      75: 'Heavy snow fall',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail'
    };
    return codes[code] || 'Unknown weather';
  }

  // Enhanced Outfit Suggestions
  function generateOutfitSuggestions(temp, code) {
    const isWet = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 85, 86, 95, 96, 99].includes(code);
    const isSnowy = [71, 73, 75, 77, 85, 86].includes(code);
    const isWindy = code === 95 || code === 96 || code === 99;

    let main, top, bottom, outer, shoes;

    // Main suggestion based on weather
    if (isWet) {
      main = "It's wet outside! Don't forget waterproof gear.";
    } else if (isSnowy) {
      main = "Snow expected! Dress warmly and wear appropriate footwear.";
    } else if (isWindy) {
      main = "Stormy weather ahead! Layer up and stay safe.";
    } else if (temp >= 30) {
      main = "It's very hot! Stay cool and hydrated.";
    } else if (temp >= 25) {
      main = "Perfect warm weather for light, comfortable clothing.";
    } else if (temp >= 20) {
      main = "Pleasant temperature - ideal for most activities.";
    } else if (temp >= 15) {
      main = "Mild weather - a light layer should be perfect.";
    } else if (temp >= 10) {
      main = "Cool day - you'll want some warm layers.";
    } else if (temp >= 5) {
      main = "Cold weather - bundle up to stay warm.";
    } else {
      main = "Very cold! Dress in warm layers and protect exposed skin.";
    }

    // Top suggestions
    if (temp >= 28) {
      top = "Tank top or light t-shirt";
    } else if (temp >= 22) {
      top = "T-shirt or light blouse";
    } else if (temp >= 18) {
      top = "Long sleeve shirt";
    } else if (temp >= 12) {
      top = "Sweater or hoodie";
    } else if (temp >= 5) {
      top = "Warm sweater";
    } else {
      top = "Thermal layer + sweater";
    }

    // Bottom suggestions
    if (temp >= 25) {
      bottom = "Shorts or light dress";
    } else if (temp >= 20) {
      bottom = "Light pants or jeans";
    } else if (temp >= 10) {
      bottom = "Jeans or trousers";
    } else {
      bottom = "Warm pants or thermal leggings";
    }

    // Outer layer suggestions
    if (isWet) {
      outer = "Waterproof jacket";
    } else if (isSnowy) {
      outer = "Winter coat";
    } else if (temp >= 25) {
      outer = "None needed";
    } else if (temp >= 20) {
      outer = "Light cardigan";
    } else if (temp >= 15) {
      outer = "Light jacket";
    } else if (temp >= 10) {
      outer = "Warm jacket";
    } else if (temp >= 0) {
      outer = "Heavy coat";
    } else {
      outer = "Winter coat + scarf";
    }

    
    if (isWet && !isSnowy) {
      shoes = "Waterproof boots";
    } else if (isSnowy) {
      shoes = "Winter boots";
    } else if (temp >= 25) {
      shoes = "Sandals or sneakers";
    } else if (temp >= 15) {
      shoes = "Sneakers or casual shoes";
    } else if (temp >= 5) {
      shoes = "Closed shoes or boots";
    } else {
      shoes = "Warm boots";
    }

    return { main, top, bottom, outer, shoes };
  }


  function shareWeather() {
    const temp = document.querySelector('.temp-value').textContent;
    const desc = document.querySelector('.weather-desc').textContent;
    const suggestion = document.querySelector('.main-suggestion').textContent;
    
    const shareText = `Current weather: ${temp}°C, ${desc}\n\nOutfit suggestion: ${suggestion}\n\nGenerated by What Should I Wear Today app`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Weather & Outfit Suggestion',
        text: shareText,
      }).then(() => {
        showToast('Shared successfully!', 'success');
      }).catch(() => {
        fallbackShare(shareText);
      });
    } else {
      fallbackShare(shareText);
    }
  }

  function fallbackShare(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!', 'success');
      }).catch(() => {
        showToast('Unable to share', 'error');
      });
    } else {
      showToast('Sharing not supported', 'error');
    }
  }

 
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    toast.innerHTML = `
      <span style="font-size: 16px;">${icon}</span>
      <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.animation = 'slideInDown 0.3s reverse';
        setTimeout(() => {
          container.removeChild(toast);
        }, 300);
      }
    }, 3000);
  }

})();