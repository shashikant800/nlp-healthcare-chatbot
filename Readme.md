# Healthcare Chatbot - Complete Setup Guide

## 🏥 AI-Powered Healthcare Assistant with Advanced NLP

This is a comprehensive healthcare chatbot application that uses advanced NLP techniques and Google's Gemini AI to provide intelligent health guidance and symptom analysis.

## 🚀 Features

### Frontend (React + Tailwind CSS)
- **Responsive Design**: Works perfectly on all devices
- **Real-time Chat Interface**: Smooth, modern chat experience
- **Quick Action Buttons**: Fast access to common symptoms
- **Severity Indicators**: Visual risk assessment display
- **Health Tips Sidebar**: Daily health recommendations
- **Loading States**: Smooth user experience with loading indicators

### Backend (Node.js + Advanced NLP)
- **Gemini AI Integration**: Powered by Google's latest AI model
- **Advanced NLP Processing**: 
  - Symptom extraction using keyword matching
  - Medical entity recognition (body parts, medications, time expressions)
  - Sentiment analysis with fallback lexicon approach
  - Risk assessment algorithm
- **Medical Knowledge Base**: Comprehensive symptom and treatment database
- **Follow-up Questions**: Intelligent questioning based on symptoms
- **Emergency Detection**: Automatic emergency situation identification

## 📋 Prerequisites

- Node.js 16+ installed
- npm or yarn package manager
- Google AI (Gemini) API key
- Basic knowledge of React and Node.js

## 🛠️ Installation Steps

### 1. Backend Setup

```bash
# Create backend directory
mkdir healthcare-chatbot-backend
cd healthcare-chatbot-backend

# Initialize npm and install dependencies
npm init -y
npm install @google/generative-ai express cors natural compromise dotenv helmet express-rate-limit winston

# Install development dependencies
npm install --save-dev nodemon jest supertest

# Create the server file (copy the backend code provided)
# Create .env file for environment variables
```

Create a `.env` file in the backend directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
NODE_ENV=development
```

### 2. Frontend Setup

The frontend is a React component that can be used in any React application. To set it up:

```bash
# Create React app (if you don't have one)
npx create-react-app healthcare-chatbot-frontend
cd healthcare-chatbot-frontend

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install Lucide React for icons
npm install lucide-react
```

Configure Tailwind CSS by updating `tailwind.config.js`:
```javascript
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Add Tailwind directives to your `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 3. Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the API key and add it to your `.env` file

## 🚀 Running the Application

### Start the Backend Server
```bash
cd healthcare-chatbot-backend
npm run dev  # or npm start for production
```
Server will run on `http://localhost:3001`

### Start the Frontend
```bash
cd healthcare-chatbot-frontend
npm start
```
Frontend will run on `http://localhost:3000`

## 🧠 NLP Features Explained

### 1. Symptom Extraction
- Uses keyword matching and natural language processing
- Identifies medical symptoms from user input
- Calculates confidence scores for each symptom

### 2. Medical Entity Recognition
- Extracts body parts, medications, time expressions
- Uses the Compromise.js library for NLP parsing
- Identifies intensity words (severe, mild, sharp, etc.)

### 3. Sentiment Analysis
- Multi-layered approach with fallback mechanisms
- Lexicon-based sentiment calculation
- Urgency detection based on keyword analysis

### 4. Risk Assessment
- Scoring algorithm based on symptom severity
- Emergency keyword detection
- Automated risk level classification (low, moderate, urgent, emergency)

### 5. Follow-up Questions
- Dynamic question generation based on detected symptoms
- Medical knowledge base integration
- Contextual questioning for better diagnosis

## 📊 API Endpoints

### `POST /api/chat`
Main chat endpoint for processing user messages
- **Input**: User message, conversation history, current step
- **Output**: AI response, symptom analysis, suggestions, risk assessment

### `GET /api/analytics`
Healthcare analytics and system information
- **Output**: System statistics and available features

### `GET /api/health-tips`
Daily health tips and recommendations
- **Output**: Random health tips array

## 🔒 Security Features

- CORS protection
- Rate limiting
- Input validation
- Error handling middleware
- Helmet.js security headers

## 🎯 Advanced Features

### 1. Emergency Detection
Automatically detects emergency situations and provides immediate guidance:
- Chest pain detection
- Breathing difficulty alerts
- Severe symptom identification

### 2. Conversation Context
Maintains conversation context for better responses:
- Previous symptoms tracking
- Follow-up question generation
- Progressive symptom analysis

### 3. Medical Knowledge Base
Comprehensive database including:
- 5+ major symptom categories
- Treatment recommendations
- Follow-up questions
- Risk assessment criteria

## 📱 Mobile Responsiveness

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones
- Various screen sizes

## 🔧 Customization Options

### Adding New Symptoms
1. Update the `medicalKnowledge.symptoms` object in the backend
2. Add keywords, severity levels, and associated questions
3. Include treatment recommendations

### Modifying AI Responses
1. Customize the Gemini AI prompts in the `generateHealthResponse` function
2. Adjust the response format and tone
3. Add specialized medical knowledge

### UI Customization
1. Modify Tailwind classes for different styling
2. Add new components or layouts
3. Customize colors and themes

## ⚠️ Important Disclaimers

- This is an AI assistant for informational purposes only
- Always consult healthcare professionals for medical advice
- Emergency situations require immediate medical attention
- The system is not a replacement for professional medical diagnosis

## 🧪 Testing

Run backend tests:
```bash
cd healthcare-chatbot-backend
npm test
```

## 🚀 Deployment

### Backend Deployment (Render, Railway, or Heroku)
1. Create a new service
2. Connect your GitHub repository
3. Set environment variables (GEMINI_API_KEY)
4. Deploy

### Frontend Deployment (Vercel, Netlify)
1. Build the React application: `npm run build`
2. Deploy the build folder
3. Update API endpoints to point to your deployed backend

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For issues and questions:
1. Check the console for error messages
2. Verify your Gemini API key is correct
3. Ensure all dependencies are installed
4. Check network connectivity between frontend and backend

## 🔮 Future Enhancements

- Voice input/output capabilities
- Medical image analysis
- Integration with wearable devices
- Multi-language support
- Advanced machine learning models
- Integration with electronic health records
- Telemedicine features

---

**Remember**: This chatbot is designed to assist and inform, not to replace professional medical advice. Always consult healthcare professionals for serious medical concerns.