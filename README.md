# Wedding Invitation - Henry 💒

A beautiful, responsive web application for displaying a wedding invitation PDF with background music. Designed to work seamlessly across all devices including iPhone, Android, and desktop computers.

## ✨ Features

- **📱 Cross-Platform Compatibility**: Works on iPhone, Android, tablets, and desktop computers
- **🎵 Background Music**: Automatic music playback with volume controls
- **📄 PDF Viewer**: Built-in PDF rendering with navigation controls
- **📱 Touch-Friendly**: Swipe gestures for mobile navigation
- **🎨 Elegant Design**: Beautiful, wedding-themed UI with modern styling
- **⚡ Fast Loading**: Optimized for quick loading on all devices
- **🌙 Dark Mode Support**: Automatic dark mode detection
- **♿ Accessibility**: Keyboard navigation and screen reader friendly
- **📱 Responsive**: Adapts to any screen size

## 🚀 Live Demo

The application will be deployed on Vercel for easy access from any device.

## 🛠️ Technologies Used

- **HTML5**: Semantic markup and modern web standards
- **CSS3**: Advanced styling with flexbox, grid, and animations
- **JavaScript (ES6+)**: Modern JavaScript with classes and async/await
- **PDF.js**: Mozilla's PDF rendering library
- **Web Audio API**: For music playback and controls
- **Touch Events**: Mobile gesture support
- **Service Workers**: Offline support (optional)

## 📁 Project Structure

```
wedding-henry/
├── index.html          # Main HTML file
├── styles.css          # CSS styles and responsive design
├── script.js           # JavaScript functionality
├── wedding-song.mp3    # Background music file
├── wedding-invitation.pdf # Wedding invitation PDF
└── README.md           # Project documentation
```

## 🎯 Key Features Explained

### PDF Rendering
- Uses PDF.js for client-side PDF rendering
- Automatic scaling based on device screen size
- Navigation controls for multi-page PDFs
- Fallback download link for compatibility

### Audio Controls
- Background music with play/pause functionality
- Volume control slider
- Loop playback for continuous music
- Mobile-optimized audio handling

### Mobile Optimization
- Touch gestures (swipe left/right for navigation)
- Responsive design for all screen sizes
- Orientation change handling
- Touch-friendly button sizes

### Cross-Device Compatibility
- Works on iOS Safari, Chrome, Firefox
- Android Chrome and other mobile browsers
- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Tablet optimization

## 🔧 Setup and Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/jdsalasca/wedding-henry.git
   cd wedding-henry
   ```

2. **Serve locally** (optional):
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```

3. **Open in browser**:
   Navigate to `http://localhost:8000` or open `index.html` directly

## 🌐 Deployment

### Vercel Deployment
1. Push code to GitHub repository
2. Connect repository to Vercel
3. Deploy automatically with zero configuration

### Alternative Deployment Options
- **Netlify**: Drag and drop deployment
- **GitHub Pages**: Free hosting for static sites
- **Firebase Hosting**: Google's hosting solution

## 📱 Browser Support

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ iOS Safari 12+
- ✅ Chrome Mobile 60+

## 🎨 Customization

### Changing Colors
Edit the CSS variables in `styles.css`:
```css
:root {
  --primary-color: #8b5a3c;
  --secondary-color: #667eea;
  --accent-color: #ffc107;
}
```

### Adding More Pages
The PDF viewer automatically handles multi-page documents. Simply replace `wedding-invitation.pdf` with your multi-page PDF.

### Changing Music
Replace `wedding-song.mp3` with your preferred audio file. Supported formats:
- MP3 (recommended)
- WAV
- OGG
- M4A

## 🐛 Troubleshooting

### PDF Not Loading
- Ensure the PDF file is in the same directory
- Check browser console for errors
- Try refreshing the page

### Audio Not Playing
- Some browsers require user interaction before playing audio
- Check if audio file exists and is accessible
- Verify audio format compatibility

### Mobile Issues
- Ensure viewport meta tag is present
- Test on actual devices, not just browser dev tools
- Check for touch event conflicts

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 💝 Acknowledgments

- PDF.js library by Mozilla
- Google Fonts for typography
- Modern CSS techniques for responsive design

---

Made with ❤️ for Henry's special day