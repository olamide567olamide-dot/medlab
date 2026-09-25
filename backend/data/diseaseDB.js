const diseaseDatabase = [
  {
    topic: 'fever',
    title: 'Fever and Infectious Illness',
    keywords: ['fever', 'temperature', 'chills', 'hot', 'sweat', 'low-grade fever', 'high fever'],
    summary: 'A fever usually indicates the body is fighting an infection. Most fevers are caused by viral or bacterial illnesses.',
    conditions: ['Viral infection', 'Bacterial infection', 'Heat exhaustion', 'Autoimmune inflammation', 'Medication reaction'],
    redFlags: ['Temperature over 39.4°C (103°F)', 'Fever lasting more than 3 days', 'Confusion', 'Seizures', 'Difficulty breathing'],
    selfCare: ['Stay hydrated', 'Rest', 'Use acetaminophen or ibuprofen as directed', 'Cool compresses', 'Avoid overdressing']
  },
  {
    topic: 'cough',
    title: 'Cough and Respiratory Symptoms',
    keywords: ['cough', 'sputum', 'phlegm', 'chest tightness', 'wheeze', 'hoarseness'],
    summary: 'A cough is a reflex designed to clear the airway. Common causes include viruses, allergies, and irritants.',
    conditions: ['Upper respiratory infection', 'Bronchitis', 'Asthma', 'Allergic rhinitis', 'Pneumonia'],
    redFlags: ['Cough lasting more than 3 weeks', 'Blood in sputum', 'High fever', 'Shortness of breath', 'Chest pain'],
    selfCare: ['Hydrate well', 'Use a humidifier', 'Avoid smoke and allergens', 'Rest your voice', 'Take cough suppressants or expectorants when appropriate']
  },
  {
    topic: 'headache',
    title: 'Headache and Migraine',
    keywords: ['headache', 'head pain', 'migraine', 'pressure', 'throbbing', 'optic'],
    summary: 'Headaches are common and range from tension-type discomfort to migraine and serious neurological causes.',
    conditions: ['Tension headache', 'Migraine', 'Sinus headache', 'Medication overuse headache', 'Hypertension-related headache'],
    redFlags: ['Sudden severe headache', 'Neck stiffness', 'Vision changes', 'Weakness', 'Altered mental status'],
    selfCare: ['Rest in a quiet dark room', 'Apply cold or warm compress', 'Stay hydrated', 'Use over-the-counter pain relief as directed']
  },
  {
    topic: 'stomach',
    title: 'Abdominal Pain and Digestive Symptoms',
    keywords: ['stomach', 'abdomen', 'nausea', 'vomit', 'diarrhea', 'bloat', 'cramp'],
    summary: 'Stomach and abdominal symptoms may arise from digestive infections, inflammation, or food-related causes.',
    conditions: ['Gastroenteritis', 'Food poisoning', 'Acid reflux', 'Irritable bowel syndrome', 'Peptic ulcer'],
    redFlags: ['Severe abdominal pain', 'Blood in vomit or stool', 'High fever', 'Persistent vomiting', 'Signs of dehydration'],
    selfCare: ['Use bland foods', 'Stay hydrated', 'Avoid spicy or fatty meals', 'Rest', 'Consider probiotics for diarrhea']
  },
  {
    topic: 'sleep',
    title: 'Sleep and Insomnia',
    keywords: ['sleep', 'insomnia', 'restless', 'tired', 'sleeping', 'wake up', 'night'],
    summary: 'Sleep quality affects physical and mental health. Poor sleep may indicate stress, lifestyle factors, or a sleep disorder.',
    conditions: ['Insomnia', 'Sleep apnea', 'Circadian rhythm disorder', 'Restless legs syndrome', 'Anxiety-related sleep disturbance'],
    redFlags: ['Frequent awakenings', 'Daytime sleepiness', 'Loud snoring', 'Gasps for air during sleep', 'Mood changes'],
    selfCare: ['Keep a regular sleep schedule', 'Limit screens before bed', 'Create a restful environment', 'Avoid caffeine late in the day']
  },
  {
    topic: 'stress',
    title: 'Stress, Anxiety, and Mental Health',
    keywords: ['stress', 'anxiety', 'panic', 'worry', 'overwhelmed', 'nervous'],
    summary: 'Stress is normal, but chronic stress and anxiety may harm mental and physical health.',
    conditions: ['Generalized anxiety', 'Panic disorder', 'Adjustment disorder', 'Depression', 'Acute stress reaction'],
    redFlags: ['Thoughts of self-harm', 'Inability to function', 'Severe panic symptoms', 'Substance misuse', 'Physical symptoms like chest pain'],
    selfCare: ['Practice deep breathing', 'Take breaks', 'Exercise regularly', 'Maintain social support', 'Reach out to a trusted clinician when needed']
  }
];

module.exports = { diseaseDatabase };
