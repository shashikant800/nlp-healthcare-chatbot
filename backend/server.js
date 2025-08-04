// server.js - Simplified working version
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const compromise = require('compromise');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY');

// Medical Knowledge Base
const medicalKnowledge = {
  symptoms: {
    'fever': {
      keywords: ['fever', 'temperature', 'hot', 'chills', 'sweating', 'pyrexia'],
      severity: 'medium',
      possibleConditions: ['viral infection', 'bacterial infection', 'covid-19', 'flu'],
      questions: [
        'What is your current temperature?',
        'How long have you had the fever?',
        'Do you have any other symptoms like cough or body aches?'
      ]
    },
    'chest_pain': {
      keywords: ['chest pain', 'chest hurt', 'heart pain', 'chest pressure', 'angina'],
      severity: 'high',
      possibleConditions: ['heart attack', 'angina', 'acid reflux', 'muscle strain'],
      questions: [
        'Is the pain sharp, dull, or crushing?',
        'Does it radiate to your arm or jaw?',
        'Does it worsen with physical activity?',
        'Are you experiencing shortness of breath?'
      ]
    },
    'headache': {
      keywords: ['headache', 'head pain', 'migraine', 'head hurt'],
      severity: 'low',
      possibleConditions: ['tension headache', 'migraine', 'cluster headache', 'sinusitis'],
      questions: [
        'Where exactly is the pain located?',
        'Is it throbbing or constant?',
        'Are you sensitive to light or sound?',
        'How long have you had this headache?'
      ]
    },
    'breathing_difficulty': {
      keywords: ['shortness of breath', 'breathing', 'breathless', 'wheezing', 'asthma', 'dyspnea'],
      severity: 'high',
      possibleConditions: ['asthma', 'pneumonia', 'covid-19', 'heart failure'],
      questions: [
        'When did the breathing difficulty start?',
        'Is it worse during physical activity?',
        'Do you have a cough?',
        'Any chest tightness?'
      ]
    },
    'stomach_pain': {
      keywords: ['stomach pain', 'abdominal pain', 'belly hurt', 'cramps', 'gastric'],
      severity: 'medium',
      possibleConditions: ['gastritis', 'appendicitis', 'food poisoning', 'ulcer'],
      questions: [
        'Where exactly is the pain?',
        'Is it sharp or cramping?',
        'Any nausea or vomiting?',
        'When did you last eat?'
      ]
    },
    'cough': {
      keywords: ['cough', 'coughing', 'hack', 'tussis'],
      severity: 'low',
      possibleConditions: ['common cold', 'flu', 'bronchitis', 'pneumonia'],
      questions: [
        'Is it a dry cough or productive?',
        'How long have you had the cough?',
        'Any fever or other symptoms?'
      ]
    }
  },
  
  treatments: {
    'fever': [
      'Rest and stay well-hydrated',
      'Take acetaminophen or ibuprofen as directed',
      'Use cool compresses',
      'Seek medical attention if fever exceeds 103°F (39.4°C)'
    ],
    'headache': [
      'Apply ice or heat to head/neck',
      'Practice relaxation techniques',
      'Stay hydrated',
      'Rest in a quiet, dark room'
    ],
    'chest_pain': [
      '🚨 SEEK IMMEDIATE MEDICAL ATTENTION',
      'Call emergency services if severe',
      'Sit upright and try to stay calm',
      'Chew aspirin if available and not allergic'
    ],
    'cough': [
      'Stay hydrated with warm liquids',
      'Use honey to soothe throat',
      'Use a humidifier',
      'Rest and avoid irritants'
    ]
  }
};

// Simplified NLP Processor
class SimpleHealthNLPProcessor {
  extractSymptoms(text) {
    const normalizedText = text.toLowerCase();
    const symptoms = [];

    Object.keys(medicalKnowledge.symptoms).forEach(symptomKey => {
      const symptomData = medicalKnowledge.symptoms[symptomKey];
      let confidence = 0;
      let matchedKeywords = [];

      symptomData.keywords.forEach(keyword => {
        if (normalizedText.includes(keyword.toLowerCase())) {
          confidence += 1;
          matchedKeywords.push(keyword);
        }
      });

      if (confidence > 0) {
        symptoms.push({
          name: symptomKey,
          confidence: confidence / symptomData.keywords.length,
          severity: symptomData.severity,
          matchedKeywords: matchedKeywords,
          data: symptomData
        });
      }
    });

    return symptoms.sort((a, b) => b.confidence - a.confidence);
  }

  extractMedicalEntities(text) {
    const doc = compromise(text);
    
    const bodyParts = ['head', 'chest', 'stomach', 'heart', 'lungs', 'throat', 'back', 'leg', 'arm'];
    const intensityWords = ['severe', 'mild', 'sharp', 'dull', 'throbbing', 'burning', 'aching'];
    const medications = ['aspirin', 'tylenol', 'ibuprofen', 'acetaminophen', 'advil'];
    
    return {
      bodyParts: bodyParts.filter(part => text.toLowerCase().includes(part)),
      timeExpressions: doc.match('#Date, #Time, #Duration').out('array'),
      intensityWords: intensityWords.filter(word => text.toLowerCase().includes(word)),
      medications: medications.filter(med => text.toLowerCase().includes(med))
    };
  }

  analyzeSentiment(text) {
    const positiveWords = ['better', 'improving', 'fine', 'okay', 'good', 'comfortable'];
    const negativeWords = ['pain', 'hurt', 'bad', 'terrible', 'awful', 'worse', 'sick'];
    const urgentWords = ['emergency', 'severe', 'blood', 'unconscious', 'can\'t breathe'];
    
    const normalizedText = text.toLowerCase();
    let score = 0;
    let urgencyBoost = 0;
    
    positiveWords.forEach(word => {
      if (normalizedText.includes(word)) score += 0.1;
    });
    
    negativeWords.forEach(word => {
      if (normalizedText.includes(word)) score -= 0.2;
    });
    
    urgentWords.forEach(word => {
      if (normalizedText.includes(word)) {
        score -= 0.3;
        urgencyBoost += 1;
      }
    });
    
    const urgency = urgencyBoost > 0 ? 'high' : score < -0.3 ? 'high' : score < 0 ? 'medium' : 'low';
    
    return { score, urgency };
  }

  detectEmergencyKeywords(text) {
    const emergencyKeywords = [
      'chest pain', 'heart attack', 'can\'t breathe', 'difficulty breathing',
      'unconscious', 'blood', 'severe pain', 'crushing pain'
    ];
    
    const normalizedText = text.toLowerCase();
    return emergencyKeywords.filter(keyword => 
      normalizedText.includes(keyword)
    );
  }
}

const nlpProcessor = new SimpleHealthNLPProcessor();

// Gemini AI Integration
async function generateHealthResponse(userMessage, symptoms, conversationHistory) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const symptomsContext = symptoms.map(s => 
      `${s.name} (${s.severity} severity)`
    ).join(', ');

    const prompt = `
    You are a compassionate AI healthcare assistant. 
    
    User's message: "${userMessage}"
    Detected symptoms: ${symptomsContext || 'none detected'}
    
    Please provide:
    1. An empathetic response to their concern
    2. Relevant follow-up questions to better understand their condition
    3. General health guidance (not diagnosis)
    4. Appropriate recommendations for next steps
    5. Always remind them to consult healthcare professionals for serious concerns
    
    Keep your response helpful, caring, and medically responsible.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API Error:', error);
    return "I'm having trouble connecting to my AI services right now. Please try again, or if this is urgent, please consult with a healthcare professional immediately.";
  }
}

// Risk Assessment
function assessRisk(symptoms, userMessage) {
  let riskScore = 0;
  let riskFactors = [];
  
  const emergencyKeywords = nlpProcessor.detectEmergencyKeywords(userMessage);
  if (emergencyKeywords.length > 0) {
    riskScore += 8;
    riskFactors.push(`Emergency indicators: ${emergencyKeywords.join(', ')}`);
  }

  symptoms.forEach(symptom => {
    if (symptom.severity === 'high') {
      riskScore += 5;
      riskFactors.push(`High severity: ${symptom.name}`);
    } else if (symptom.severity === 'medium') {
      riskScore += 3;
      riskFactors.push(`Medium severity: ${symptom.name}`);
    } else {
      riskScore += 1;
    }
  });

  const riskLevel = riskScore >= 8 ? 'emergency' : 
                   riskScore >= 6 ? 'urgent' : 
                   riskScore >= 3 ? 'moderate' : 'low';

  return {
    score: riskScore,
    level: riskLevel,
    factors: riskFactors
  };
}

// Generate Follow-up Questions
function generateFollowUpQuestions(symptoms) {
  const questions = new Set();
  
  symptoms.forEach(symptom => {
    if (symptom.data.questions) {
      symptom.data.questions.forEach(q => questions.add(q));
    }
  });

  return Array.from(questions).slice(0, 3);
}

// Main Chat Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationHistory, currentStep } = req.body;
    
    console.log('Processing message:', message);
    
    // Process message with NLP
    const symptoms = nlpProcessor.extractSymptoms(message);
    const entities = nlpProcessor.extractMedicalEntities(message);
    const sentiment = nlpProcessor.analyzeSentiment(message);
    const riskAssessment = assessRisk(symptoms, message);
    
    console.log('Symptoms detected:', symptoms.map(s => s.name));
    console.log('Risk level:', riskAssessment.level);
    
    // Generate AI response
    const aiResponse = await generateHealthResponse(message, symptoms, conversationHistory);
    
    // Generate suggestions
    const suggestions = [];
    symptoms.forEach(symptom => {
      if (medicalKnowledge.treatments[symptom.name]) {
        suggestions.push(...medicalKnowledge.treatments[symptom.name]);
      }
    });
    
    // Generate follow-up questions
    const followUpQuestions = generateFollowUpQuestions(symptoms);
    
    // Determine next step
    let nextStep = 'continue';
    if (riskAssessment.level === 'emergency') {
      nextStep = 'emergency';
    } else if (symptoms.length > 0 && currentStep === 'initial') {
      nextStep = 'symptom_analysis';
    }

    // Construct final response
    let finalResponse = aiResponse;
    
    if (riskAssessment.level === 'emergency') {
      finalResponse = `🚨 EMERGENCY ALERT: Your symptoms suggest you need immediate medical attention. Please call emergency services or go to the nearest emergency room.\n\n${aiResponse}`;
    }
    
    if (followUpQuestions.length > 0 && riskAssessment.level !== 'emergency') {
      finalResponse += `\n\nTo better assist you, could you please tell me:\n${followUpQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
    }

    res.json({
      success: true,
      response: finalResponse,
      analysis: {
        symptoms: symptoms.map(s => ({ 
          name: s.name, 
          confidence: Math.round(s.confidence * 100), 
          severity: s.severity 
        })),
        entities: entities,
        sentiment: sentiment,
        riskLevel: riskAssessment.level,
        riskFactors: riskAssessment.factors
      },
      suggestions: [...new Set(suggestions)].slice(0, 5),
      severity: riskAssessment.level,
      nextStep: nextStep,
      followUpQuestions: followUpQuestions
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      response: 'I apologize, but I encountered an error processing your request. Please try again or consult with a healthcare professional if this is urgent.'
    });
  }
});

// Health Analytics Endpoint
app.get('/api/analytics', (req, res) => {
  res.json({
    success: true,
    data: {
      symptoms_database: Object.keys(medicalKnowledge.symptoms).length,
      treatments_available: Object.keys(medicalKnowledge.treatments).length,
      nlp_features: [
        'Symptom keyword detection',
        'Medical entity extraction',
        'Sentiment analysis',
        'Risk assessment',
        'Emergency detection',
        'Follow-up question generation'
      ],
      supported_symptoms: Object.keys(medicalKnowledge.symptoms)
    }
  });
});

// Health Tips Endpoint
app.get('/api/health-tips', (req, res) => {
  const tips = [
    '💧 Stay hydrated by drinking at least 8 glasses of water daily',
    '😴 Get 7-9 hours of quality sleep each night',
    '🏃‍♂️ Exercise for at least 30 minutes, 5 days a week',
    '🥗 Eat a balanced diet rich in fruits and vegetables',
    '🧘‍♀️ Practice stress management techniques like meditation',
    '👩‍⚕️ Schedule regular check-ups with your healthcare provider',
    '🧼 Wash your hands frequently to prevent infections',
    '🚭 Limit alcohol consumption and avoid smoking',
    '⚖️ Maintain a healthy weight for your body type',
    '👀 Take breaks from screen time to rest your eyes'
  ];
  
  const randomTips = tips.sort(() => 0.5 - Math.random()).slice(0, 3);
  res.json({ 
    success: true,
    tips: randomTips 
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      nlp: 'active',
      gemini_ai: process.env.GEMINI_API_KEY ? 'configured' : 'not_configured',
      database: 'in_memory'
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: 'Something went wrong on our end. Please try again.'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: 'The requested endpoint does not exist.'
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log('\n🏥 Healthcare Chatbot Server Started Successfully!');
  console.log(`🌐 Server running on port ${PORT}`);
  console.log(`🔗 Backend URL: http://localhost:${PORT}`);
  console.log(`🔑 Gemini AI: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log('\n📋 Available Features:');
  console.log('  ✅ Advanced symptom detection');
  console.log('  ✅ Medical entity extraction');  
  console.log('  ✅ Risk assessment algorithm');
  console.log('  ✅ Emergency detection');
  console.log('  ✅ AI-powered responses');
  console.log('  ✅ Follow-up question generation');
  console.log('\n🔗 API Endpoints:');
  console.log(`  POST http://localhost:${PORT}/api/chat - Main chat interface`);
  console.log(`  GET  http://localhost:${PORT}/api/health-tips - Daily health tips`);
  console.log(`  GET  http://localhost:${PORT}/api/analytics - System analytics`);
  console.log(`  GET  http://localhost:${PORT}/api/health - Health check`);
  console.log('\n📱 Ready to receive requests from frontend!');
});

module.exports = app;