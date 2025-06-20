// Configuration
const API_BASE_URL = 'https://thechaiexperiment-sencha.hf.space';

// Tab switching logic
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    tabContents.forEach(tc => tc.classList.add('hidden'));
    document.getElementById(tab.dataset.tab).classList.remove('hidden');
  });
});

// Sidebar history logic
const historyList = document.getElementById('history-list');
function addToHistory(repoName) {
  const li = document.createElement('li');
  li.textContent = repoName;
  li.title = 'Click to load this repo';
  li.addEventListener('click', () => {
    document.getElementById('doc-viewer').textContent = `Loaded documentation for ${repoName}`;
  });
  historyList.prepend(li);
}

// File upload logic
const repoUpload = document.getElementById('repo-upload');
if (repoUpload) {
  repoUpload.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length) {
      addToHistory(files[0].name);
      document.getElementById('doc-viewer').textContent = `Repo "${files[0].name}" uploaded. Ready to generate docs!`;
    }
  });
}

// Analyze logic - FIXED
const analyzeBtn = document.getElementById('analyze-btn');
const sourceUrlInput = document.getElementById('source-url');
const sourceTypeSelect = document.getElementById('source-type');
const analyzeStatus = document.getElementById('analyze-status');
let lastAnalysisId = null;
let lastAnalysis = null;

analyzeBtn.addEventListener('click', async () => {
  const url = sourceUrlInput.value.trim();
  const type = sourceTypeSelect.value;
  if (!url) {
    analyzeStatus.textContent = 'Please enter a repository or space URL.';
    return;
  }
  
  analyzeStatus.textContent = 'Analyzing...';
  
  try {
    // Fixed: Use URL parameters to match backend signature
    const params = new URLSearchParams({
      source_url: url,
      source_type: type,
      include_diagrams: 'true'
    });
    
    const res = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_url: url,
        source_type: type,
        include_diagrams: true
      })
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`${res.status}: ${errorText}`);
    }
    
    const data = await res.json();
    lastAnalysis = data;
    lastAnalysisId = data.request_id || data.analysis_id || url;
    
    document.getElementById('doc-viewer').textContent = JSON.stringify(data, null, 2);
    analyzeStatus.textContent = 'Analysis complete! You can now generate documentation.';
    addToHistory(url);
    
  } catch (err) {
    console.error('Analysis error:', err);
    analyzeStatus.textContent = 'Error: ' + err.message;
    
    // Add specific error handling for common issues
    if (err.message.includes('CORS')) {
      analyzeStatus.textContent += ' (CORS issue - check if Space is running)';
    } else if (err.message.includes('Failed to fetch')) {
      analyzeStatus.textContent += ' (Network error - check if Space is accessible)';
    }
  }
});

// Generate docs button - FIXED
const generateBtn = document.getElementById('generate-btn');
if (generateBtn) {
  generateBtn.addEventListener('click', async () => {
    if (!lastAnalysisId) {
      document.getElementById('generate-status').textContent = 'Please analyze a project first.';
      return;
    }
    
    document.getElementById('generate-status').textContent = 'Generating documentation...';
    
    try {
      // Fixed: Use URL parameters for the generate endpoint
      const params = new URLSearchParams({
        analysis_id: lastAnalysisId,
        style: 'minimal',
        format: 'markdown'
      });
      
      const res = await fetch(`${API_BASE_URL}/generate?${params}`, {
        method: 'POST',
        mode: 'cors'
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`${res.status}: ${errorText}`);
      }
      
      const data = await res.json();
      document.getElementById('doc-viewer').textContent = data.content || JSON.stringify(data, null, 2);
      document.getElementById('generate-status').textContent = 'Documentation generated!';
      
    } catch (err) {
      console.error('Generation error:', err);
      document.getElementById('generate-status').textContent = 'Error: ' + err.message;
    }
  });
}

// Status check function - NEW
async function checkStatus(requestId) {
  try {
    const res = await fetch(`${API_BASE_URL}/status/${requestId}`, {
      method: 'GET',
      mode: 'cors'
    });
    
    if (!res.ok) {
      throw new Error(`${res.status}: ${await res.text()}`);
    }
    
    return await res.json();
  } catch (err) {
    console.error('Status check error:', err);
    throw err;
  }
}

// Download function - NEW (missing from original)
async function downloadDocumentation(requestId, format = 'markdown') {
  try {
    const res = await fetch(`${API_BASE_URL}/download/${requestId}?format=${format}`, {
      method: 'GET',
      mode: 'cors'
    });
    
    if (!res.ok) {
      throw new Error(`${res.status}: ${await res.text()}`);
    }
    
    // Handle file download
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `documentation.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
  } catch (err) {
    console.error('Download error:', err);
    throw err;
  }
}

// Health check function - NEW
async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      mode: 'cors'
    });
    
    if (!res.ok) {
      throw new Error(`${res.status}: ${await res.text()}`);
    }
    
    return await res.json();
  } catch (err) {
    console.error('Health check error:', err);
    throw err;
  }
}

// Edit/save logic
const saveEditBtn = document.getElementById('save-edit-btn');
if (saveEditBtn) {
  saveEditBtn.addEventListener('click', () => {
    const editArea = document.getElementById('edit-area');
    if (editArea && editArea.value.trim()) {
      // Store edited content
      localStorage.setItem('edited_docs', editArea.value);
      alert('Edits saved locally!');
    } else {
      alert('Nothing to save.');
    }
  });
}

// Load edited content if available
document.addEventListener('DOMContentLoaded', () => {
  const editArea = document.getElementById('edit-area');
  const savedContent = localStorage.getItem('edited_docs');
  if (editArea && savedContent) {
    editArea.value = savedContent;
  }
});

// Mascot animation
const mascot = document.querySelector('.mascot');
if (mascot) {
  mascot.title = 'Sencha the Turtle: Your friendly doc assistant!';
  mascot.addEventListener('mouseenter', () => {
    mascot.style.transform = 'scale(1.08) rotate(-4deg)';
    mascot.style.transition = 'transform 0.3s';
  });
  mascot.addEventListener('mouseleave', () => {
    mascot.style.transform = 'scale(1) rotate(0)';
  });
}

// Test connection on page load
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const health = await checkHealth();
    console.log('Backend connection successful:', health);
  } catch (err) {
    console.warn('Backend connection failed:', err.message);
    // Show user-friendly notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #ff6b6b;
      color: white;
      padding: 10px;
      border-radius: 5px;
      z-index: 1000;
    `;
    notification.textContent = 'Backend connection failed. Some features may not work.';
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }
});
