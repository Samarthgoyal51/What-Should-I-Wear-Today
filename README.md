# What-Should-I-Wear-Today
🌤️ A responsive web app that gives you personalized outfit suggestions based on real-time weather at your location. Built with HTML, CSS, and vanilla JS. Just open and dress smart! 👕🧥🌂

## 🌐 Live Demo

👉 [Try the Website](https://what-should-i-wear-today-inky.vercel.app/)

---

## 🧠 Features

- 🌍 **Automatic Location Detection** – Uses GPS or IP fallback to get your current location.
- 🌦️ **Real-time Weather Data** – Integrates with [Open-Meteo](https://open-meteo.com) to get current conditions and hourly data.
- 🧥 **Smart Outfit Suggestions** – Personalized recommendations for:
  - Top
  - Bottom
  - Outer layer
  - Shoes
- 🌙 **Dark/Light Theme Toggle** – Smooth theme transitions with persistent settings.
- 🔁 **Refresh & Retry Support** – Easily re-fetch weather or handle errors gracefully.
- 📤 **Share or Copy Info** – Share your weather and outfit via Web Share API or clipboard fallback.
- 📱 **Responsive Design** – Fully optimized for mobile and desktop experiences.

---

## 🛠️ Built With

- **HTML5** – Semantic and accessible markup.
- **CSS3** – Modular custom properties, responsive layout, dark mode.
- **JavaScript (Vanilla)** – Fully functional front-end logic.
- **Geolocation API** – Accurate location-based services.
- **Open-Meteo API** – Free and reliable weather data provider.

---

## 📁 File Structure

📦 project-root
├── index.html # Main HTML structure
├── style.css # Theming, layout, responsiveness
├── app.js # JavaScript logic and interactivity
└── README.md # You're here!

yaml
Copy
Edit

---

## ⚙️ Getting Started

To run this project locally:

1. **Clone the repository:**

```bash
git clone https://github.com/Samarthgoyal51/What-Should-I-Wear-Today.git
cd What-Should-I-Wear-Today
Open index.html in your browser:

No server setup required – this is a purely frontend app.

📦 Dependencies
Open-Meteo API – Free weather API with no authentication required.

IPAPI.co – Used as a fallback for approximate location when geolocation fails.

Inter Font (Google Fonts) – Clean, modern typography.

🔐 Privacy Consideration
This app uses your browser’s Geolocation API or IP-based lookup only for weather detection. No location data is stored or shared externally.

✨ Customization Ideas
Add a map display of the location.

Provide outfit image previews.

Include settings for unit preferences (Celsius/Fahrenheit).

Integrate a wardrobe planner.

📣 Credits
Weather data by Open-Meteo

UI design and development by Samarth Goyal
