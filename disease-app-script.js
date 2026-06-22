/**
 * Disease Diagnosis Application - Main JavaScript
 * ================================================
 * Application logic for medical disease diagnosis form and results display
 * Features: Form handling, disease matching, results display, modal chat interface
 */

// ============================================================================
// DATA INITIALIZATION & STORAGE
// ============================================================================

let diseasesDatabase = [];
let userSymptoms = [];
let currentPatientData = {};

const EMBEDDED_DISEASES = {"diseases":[{
  "diseases": [
    {
      "name": "Abscess",
      "category": "Infectious/Inflammatory",
      "causes": [
        "Bacterial infection (commonly Staphylococcus or Streptococcus)",
        "Blocked glands or hair follicles",
        "Trauma or foreign body"
      ],
      "symptoms": [
        "Localized swelling and redness",
        "Pain and tenderness",
        "Pus formation",
        "Fever in severe cases"
      ],
      "description": "An abscess is a localized collection of pus resulting from infection, which can occur in various tissues such as skin, internal organs, or brain.",
      "first_aid": [
        "Apply warm compresses to promote drainage",
        "Avoid squeezing or puncturing the area",
        "Seek medical attention for incision and drainage if needed"
      ],
      "drugs": [
        "Antibiotics (e.g., cephalexin, clindamycin)",
        "Analgesics for pain (e.g., ibuprofen)"
      ],
      "treatment": [
        "Incision and drainage",
        "Antibiotic therapy",
        "Wound care and hygiene"
      ],
      "severity": "medium",
      "image": "https://source.unsplash.com/400x300/?abscess"
    },
    {
      "name": "Absence seizures",
      "category": "Neurological",
      "causes": [
        "Idiopathic epilepsy",
        "Genetic factors",
        "Abnormal electrical activity in the brain"
      ],
      "symptoms": [
        "Brief staring spells lasting 5–10 seconds",
        "Subtle eye fluttering or lip smacking",
        "Sudden loss of awareness without falling"
      ],
      "description": "Absence seizures are a form of generalized epilepsy characterized by brief episodes of altered consciousness, most common in children.",
      "first_aid": [
        "Ensure safety by guiding the person away from hazards",
        "Do not restrain or shout",
        "Time the episode and seek help if prolonged"
      ],
      "drugs": [
        "Ethosuximide",
        "Valproic acid",
        "Lamotrigine"
      ],
      "treatment": [
        "Antiepileptic medications",
        "EEG monitoring",
        "Lifestyle adjustments to reduce triggers"
      ],
      "severity": "medium",
      "image": "https://source.unsplash.com/400x300/?seizure"
    }
  ]
}};

// Initialize diseases database from embedded data
function initializeDiseases() {
  if (EMBEDDED_DISEASES.diseases && EMBEDDED_DISEASES.diseases[0].diseases) {
    diseasesDatabase = EMBEDDED_DISEASES.diseases[0].diseases;
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  initializeDiseases();
});


// ============================================================================
// FORM HANDLING & SYMPTOM MATCHING
// ============================================================================

/**
 * Handle form submission
 * Collects patient data and symptoms, then displays matching diseases
 */
function handleFormSubmit(event) {
  event.preventDefault();
  currentPatientData = {
    name: document.getElementById('patientName').value,
    age: document.getElementById('patientAge').value,
    gender: document.getElementById('patientGender').value,
    notes: document.getElementById('patientNotes').value,
    duration: document.getElementById('durationDays').value || 'Not specified'
  };
  const symptomsInput = document.getElementById('symptomsInput').value;
  userSymptoms = symptomsInput.split(',').map(s => s.trim()).filter(s => s.length > 0);
  if (userSymptoms.length === 0) {
    alert('Please select at least one symptom');
    return;
  }
  const matchedDiseases = matchSymptomsToDisease();
  displayResults(matchedDiseases);
  showPage('resultsPage');
}

/**
 * Match user symptoms to diseases in database
 * @returns {Array} Array of matched diseases sorted by match percentage
 */
function matchSymptomsToDisease() {
  const matches = [];
  diseasesDatabase.forEach(disease => {
    if (!disease.symptoms) return;
    const matchingSymptoms = userSymptoms.filter(symptom =>
      disease.symptoms.some(diseaseSymptom =>
        diseaseSymptom.toLowerCase().includes(symptom.toLowerCase()) ||
        symptom.toLowerCase().includes(diseaseSymptom.toLowerCase())
      )
    );
    if (matchingSymptoms.length > 0) {
      const matchPercentage = Math.round((matchingSymptoms.length / userSymptoms.length) * 100);
      matches.push({
        ...disease,
        matchCount: matchingSymptoms.length,
        matchPercentage: matchPercentage,
        matchedSymptoms: matchingSymptoms
      });
    }
  });
  return matches.sort((a, b) => {
    if (b.matchPercentage !== a.matchPercentage) return b.matchPercentage - a.matchPercentage;
    return b.matchCount - a.matchCount;
  });
}


// ============================================================================
// RESULTS DISPLAY & RENDERING
// ============================================================================

/**
 * Display matched diseases as results
 * @param {Array} matchedDiseases - Array of disease objects with match data
 */
function displayResults(matchedDiseases) {
  document.getElementById('resultPatientName').textContent = currentPatientData.name;
  document.getElementById('resultPatientAge').textContent = `${currentPatientData.age} years old, ${currentPatientData.gender}`;
  document.getElementById('resultSymptomCount').textContent = `${userSymptoms.length} reported`;
  const resultsContainer = document.getElementById('resultsContainer');
  if (matchedDiseases.length === 0) {
    resultsContainer.innerHTML = '<div style="text-align: center; padding: 60px 40px; background: linear-gradient(135deg, #e3f9ff 0%, #f0f9ff 100%); border-radius: 15px; margin-top: 30px;"><p style="font-size: 1.3em; color: #0d5a7a; margin-bottom: 15px;">❌ No matching diseases found</p><p style="color: #1a5f7a; font-size: 1.05em;"><strong>Please consult with a healthcare professional for proper diagnosis.</strong></p></div>';
    return;
  }
  
  const perfectMatches = matchedDiseases.filter(d => d.matchPercentage === 100);
  const otherMatches = matchedDiseases.filter(d => d.matchPercentage < 100);
  
  let resultsHTML = '';
  
  if (perfectMatches.length > 0) {
    resultsHTML += `<h3 style="color: #047857; font-size: 1.6em; margin-bottom: 30px; font-weight: 700;">✓ 100% Match Found</h3>`;
    perfectMatches.forEach(disease => {
      const severityClass = disease.severity ? disease.severity.toLowerCase() : 'low';
      resultsHTML += `
        <div style="background: white; border: 2px solid #d4e9f2; border-radius: 15px; padding: 25px; margin-bottom: 25px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 5px 15px rgba(48, 233, 254, 0.1);" onclick="showDiseaseDetail('${disease.name.replace(/'/g, "\\'")}')">
          <h3 style="color: #0d5a7a; font-size: 1.3em; font-weight: 700; margin-bottom: 12px;">${disease.name}</h3>
          <div style="display: flex; gap: 12px; margin-bottom: 15px; flex-wrap: wrap;">
            <span style="display: inline-block; background: #e3f9ff; padding: 6px 14px; border-radius: 20px; font-size: 0.85em; color: #0d5a7a; font-weight: 600; border: 1px solid #b3e5fc;">${disease.category || 'Uncategorized'}</span>
            <span class="severity ${severityClass}" style="display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 0.85em; font-weight: 700;">Severity: ${disease.severity || 'Unknown'}</span>
          </div>
          <p style="color: #4a7a95; margin: 15px 0; font-size: 0.95em; line-height: 1.6;">${disease.description || 'No description available'}</p>
          <div style="color: #0da5c0; font-weight: 700; margin-top: 15px; padding-top: 15px; border-top: 2px solid #b3e5fc; font-size: 1em;">
            🎯 Match Score: <span style="font-size: 1.1em; color: #0d5a7a;">${disease.matchPercentage}%</span> (${disease.matchCount}/${userSymptoms.length} symptoms matched)
          </div>
        </div>
      `;
    });
    
    if (otherMatches.length > 0) {
      resultsHTML += `<div style="text-align: center; margin-top: 30px;"><button class="btn-primary" onclick="toggleOtherMatches()" style="padding: 15px 45px; font-size: 1.05em;">👀 View Other Related Matches</button></div>`;
      resultsHTML += `<div id="otherMatchesContainer" style="display: none; margin-top: 40px;">`;
      otherMatches.forEach(disease => {
        const severityClass = disease.severity ? disease.severity.toLowerCase() : 'low';
        resultsHTML += `
          <div style="background: white; border: 2px solid #d4e9f2; border-radius: 15px; padding: 25px; margin-bottom: 25px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 5px 15px rgba(48, 233, 254, 0.1);" onclick="showDiseaseDetail('${disease.name.replace(/'/g, "\\'")}')">
            <h3 style="color: #0d5a7a; font-size: 1.3em; font-weight: 700; margin-bottom: 12px;">${disease.name}</h3>
            <div style="display: flex; gap: 12px; margin-bottom: 15px; flex-wrap: wrap;">
              <span style="display: inline-block; background: #e3f9ff; padding: 6px 14px; border-radius: 20px; font-size: 0.85em; color: #0d5a7a; font-weight: 600; border: 1px solid #b3e5fc;">${disease.category || 'Uncategorized'}</span>
              <span class="severity ${severityClass}" style="display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 0.85em; font-weight: 700;">Severity: ${disease.severity || 'Unknown'}</span>
            </div>
            <p style="color: #4a7a95; margin: 15px 0; font-size: 0.95em; line-height: 1.6;">${disease.description || 'No description available'}</p>
            <div style="color: #0da5c0; font-weight: 700; margin-top: 15px; padding-top: 15px; border-top: 2px solid #b3e5fc; font-size: 1em;">
              🎯 Match Score: <span style="font-size: 1.1em; color: #0d5a7a;">${disease.matchPercentage}%</span> (${disease.matchCount}/${userSymptoms.length} symptoms matched)
            </div>
          </div>
        `;
      });
      resultsHTML += `</div>`;
    }
  } else {
    resultsHTML += `<h3 style="color: #047857; font-size: 1.6em; margin-bottom: 30px; font-weight: 700;">✓ Likely Conditions Found</h3>`;
    matchedDiseases.forEach(disease => {
      const severityClass = disease.severity ? disease.severity.toLowerCase() : 'low';
      resultsHTML += `
        <div style="background: white; border: 2px solid #d4e9f2; border-radius: 15px; padding: 25px; margin-bottom: 25px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 5px 15px rgba(48, 233, 254, 0.1);" onclick="showDiseaseDetail('${disease.name.replace(/'/g, "\\'")}')">
          <h3 style="color: #0d5a7a; font-size: 1.3em; font-weight: 700; margin-bottom: 12px;">${disease.name}</h3>
          <div style="display: flex; gap: 12px; margin-bottom: 15px; flex-wrap: wrap;">
            <span style="display: inline-block; background: #e3f9ff; padding: 6px 14px; border-radius: 20px; font-size: 0.85em; color: #0d5a7a; font-weight: 600; border: 1px solid #b3e5fc;">${disease.category || 'Uncategorized'}</span>
            <span class="severity ${severityClass}" style="display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 0.85em; font-weight: 700;">Severity: ${disease.severity || 'Unknown'}</span>
          </div>
          <p style="color: #4a7a95; margin: 15px 0; font-size: 0.95em; line-height: 1.6;">${disease.description || 'No description available'}</p>
          <div style="color: #0da5c0; font-weight: 700; margin-top: 15px; padding-top: 15px; border-top: 2px solid #b3e5fc; font-size: 1em;">
            🎯 Match Score: <span style="font-size: 1.1em; color: #0d5a7a;">${disease.matchPercentage}%</span> (${disease.matchCount}/${userSymptoms.length} symptoms matched)
          </div>
        </div>
      `;
    });
  }
  
  resultsContainer.innerHTML = resultsHTML;
}

/**
 * Toggle visibility of other matching diseases
 */
function toggleOtherMatches() {
  const otherMatchesContainer = document.getElementById('otherMatchesContainer');
  if (otherMatchesContainer) {
    if (otherMatchesContainer.style.display === 'none') {
      otherMatchesContainer.style.display = 'block';
      event.target.textContent = '👀 Hide Other Related Matches';
    } else {
      otherMatchesContainer.style.display = 'none';
      event.target.textContent = event.target.textContent.replace('Hide', 'View');
    }
  }
}


// ============================================================================
// DISEASE DETAIL PAGE
// ============================================================================

/**
 * Display detailed information about a specific disease
 * @param {string} diseaseName - Name of the disease to display
 */
function showDiseaseDetail(diseaseName) {
  const disease = diseasesDatabase.find(d => d.name === diseaseName);
  if (!disease) return;
  const severityClass = disease.severity ? disease.severity.toLowerCase() : 'low';
  let detailHTML = `<div class="disease-detail">
    <h2 style="color: #0d5a7a; font-size: 2.2em; margin-bottom: 15px; font-weight: 700;">${disease.name}</h2>
    <div style="display: flex; gap: 15px; margin-bottom: 30px; flex-wrap: wrap;">
      <span style="display: inline-block; background: #e3f9ff; padding: 10px 18px; border-radius: 20px; color: #0d5a7a; font-weight: 700; border: 2px solid #b3e5fc;">${disease.category || 'Uncategorized'}</span>
      <span class="severity ${severityClass}" style="display: inline-block; padding: 10px 18px; border-radius: 20px; font-weight: 700; font-size: 1.05em;">Severity: ${disease.severity || 'Unknown'}</span>
    </div>`;
  if (disease.image) detailHTML += `<img src="${disease.image}" alt="${disease.name}" style="width: 100%; max-height: 500px; border-radius: 15px; margin: 25px 0; box-shadow: 0 10px 30px rgba(13, 165, 192, 0.2);">`;
  if (disease.description) detailHTML += `<div class="detail-section"><h3 style="font-size: 1.5em;">📖 Overview</h3><p style="color: #1a5f7a; font-size: 1.05em; line-height: 1.8;">${disease.description}</p></div>`;
  if (disease.causes && disease.causes.length > 0) detailHTML += `<div class="detail-section"><h3 style="font-size: 1.5em;">🔬 Causes</h3><ul>${disease.causes.map(cause => `<li style="font-size: 1.05em;">${cause}</li>`).join('')}</ul></div>`;
  if (disease.symptoms && disease.symptoms.length > 0) detailHTML += `<div class="detail-section"><h3 style="font-size: 1.5em;">🩹 Symptoms</h3><ul>${disease.symptoms.map(symptom => `<li style="font-size: 1.05em;">${symptom}</li>`).join('')}</ul></div>`;
  if (disease.first_aid && disease.first_aid.length > 0) detailHTML += `<div class="detail-section"><h3 style="font-size: 1.5em;">🆘 First Aid</h3><ol>${disease.first_aid.map(aid => `<li style="font-size: 1.05em;">${aid}</li>`).join('')}</ol></div>`;
  if (disease.drugs && disease.drugs.length > 0) detailHTML += `<div class="detail-section"><h3 style="font-size: 1.5em;">💊 Medications</h3><ul>${disease.drugs.map(drug => `<li style="font-size: 1.05em;">${drug}</li>`).join('')}</ul></div>`;
  if (disease.treatment && disease.treatment.length > 0) detailHTML += `<div class="detail-section"><h3 style="font-size: 1.5em;">🏥 Treatment</h3><ol>${disease.treatment.map(treatment => `<li style="font-size: 1.05em;">${treatment}</li>`).join('')}</ol></div>`;
  detailHTML += `<div style="background: linear-gradient(135deg, #fff3cd 0%, #ffe0b2 100%); padding: 25px; border-radius: 15px; margin-top: 40px; border-left: 5px solid #ffc107; box-shadow: 0 5px 15px rgba(255, 193, 7, 0.2);"><strong style="color: #c97000; font-size: 1.1em;">⚠️ Important Medical Disclaimer:</strong><p style="color: #c97000; margin-top: 12px; line-height: 1.8; font-size: 1.05em;">This information is provided for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider for accurate diagnosis and appropriate treatment of any health condition.</p></div></div>`;
  document.getElementById('diseaseDetailContainer').innerHTML = detailHTML;
  showPage('detailPage');
}


// ============================================================================
// PAGE NAVIGATION
// ============================================================================

/**
 * Show/hide specific page and manage page transitions
 * @param {string} pageId - ID of the page to display
 */
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
    page.style.display = '';
    page.style.visibility = '';
    page.style.pointerEvents = '';
  });
  const activePage = document.getElementById(pageId);
  activePage.classList.add('active');
  const fabButton = document.getElementById('fabButton');
  if (pageId === 'resultsPage') {
    fabButton.style.display = 'flex';
  } else {
    fabButton.style.display = 'none';
    closeAIChat();
  }
  window.scrollTo(0, 0);
}

/**
 * Navigate back to the main form page
 */
function goBackToForm() {
  showPage('landingPage');
}

/**
 * Navigate back to results page from detail page
 */
function goBackToResults() {
  showPage('resultsPage');
}


// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Print the current page
 */
function printResults() {
  window.print();
}


// ============================================================================
// MODAL CHAT INTERFACE
// ============================================================================

/**
 * Open the AI chat modal
 */
function openAIChat() {
  document.getElementById('modalOverlay').classList.add('active');
  document.getElementById('modalChat').classList.add('active');
}

/**
 * Close the AI chat modal
 */
function closeAIChat() {
  document.getElementById('modalOverlay').classList.remove('active');
  document.getElementById('modalChat').classList.remove('active');
}
