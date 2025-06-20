// Configuration
const API_BASE_URL = 'https://thechaiexperiment-sencha.hf.space';
let lastAnalysisId = null;
let currentDocs = null;

// Initialize Mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  fontFamily: 'Inter, sans-serif',
  themeVariables: {
    primaryColor: '#f6fbf7',
    primaryBorderColor: '#dbead6',
    primaryTextColor: '#3a3a2c',
    lineColor: '#5e7d4a'
  }
});

// Tab functionality for Try Section
const tryTabs = document.querySelectorAll('.try-tab');
const tryPanels = document.querySelectorAll('.try-panel');

tryTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    // Remove active class from all tabs and panels
    tryTabs.forEach(t => t.classList.remove('active'));
    tryPanels.forEach(p => p.classList.remove('active'));
    
    // Add active class to clicked tab and corresponding panel
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
  });
});

// Demo button functionality
document.getElementById('demo-btn').addEventListener('click', () => {
  document.querySelector('.demo-section').scrollIntoView({ behavior: 'smooth' });
});

// Try button functionality
document.getElementById('try-btn').addEventListener('click', () => {
  document.querySelector('.try-section').scrollIntoView({ behavior: 'smooth' });
});

// Analysis functionality
document.getElementById('try-analyze').addEventListener('click', async () => {
  const url = document.getElementById('try-url').value.trim();
  const sourceType = document.getElementById('source-type').value;
  const includeDiagrams = document.getElementById('include-diagrams').checked;
  const deepAnalysis = document.getElementById('deep-analysis').checked;
  
  if (!url) {
    showErrorNotification('Please enter a repository URL');
    return;
  }
  
  const docViewer = document.getElementById('try-doc-viewer');
  docViewer.innerHTML = `
    <div class="loading-spinner">
      <div class="spinner"></div>
      <p>Analyzing repository...</p>
    </div>
  `;
  
  try {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_url: url,
        source_type: sourceType,
        include_diagrams: includeDiagrams,
        deep_analysis: deepAnalysis
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Analysis failed');
    }
    
    const data = await response.json();
    lastAnalysisId = data.analysis_id;
    
    // Display analysis results
    displayAnalysisResults(data);
    
    // Enable generate tab
    document.querySelector('.try-tab[data-tab="generate"]').disabled = false;
    
  } catch (error) {
    console.error('Analysis error:', error);
    docViewer.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>Error: ${error.message}</p>
      </div>
    `;
  }
});

function displayAnalysisResults(data) {
  const docViewer = document.getElementById('try-doc-viewer');
  
  let html = `
    <h3>Analysis Results</h3>
    <div class="analysis-summary">
      <p><strong>Repository:</strong> ${data.repo_name || 'N/A'}</p>
      <p><strong>Description:</strong> ${data.description || 'No description available'}</p>
      <p><strong>Primary Language:</strong> ${data.primary_language || 'N/A'}</p>
      <p><strong>Files Analyzed:</strong> ${data.file_count || 0}</p>
    </div>
  `;
  
  if (data.dependencies && data.dependencies.length > 0) {
    html += `
      <div class="analysis-section">
        <h4>Dependencies</h4>
        <ul class="dependency-list">
          ${data.dependencies.map(dep => `<li>${dep.name} (${dep.version || 'N/A'})</li>`).join('')}
        </ul>
      </div>
    `;
  }
  
  if (data.documentation_status) {
    html += `
      <div class="analysis-section">
        <h4>Documentation Status</h4>
        <p>${data.documentation_status.score || 0}/100</p>
        <p>${data.documentation_status.summary || 'No summary available'}</p>
        ${data.documentation_status.issues ? `
          <div class="issues-list">
            <h5>Issues Found:</h5>
            <ul>
              ${data.documentation_status.issues.map(issue => `<li>${issue}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
  }
  
  docViewer.innerHTML = html;
}

// Documentation generation
document.getElementById('try-generate').addEventListener('click', async () => {
  if (!lastAnalysisId) {
    showErrorNotification('Please analyze a repository first');
    return;
  }
  
  const style = document.getElementById('doc-style').value;
  const format = document.getElementById('output-format').value;
  const includes = Array.from(document.querySelectorAll('input[name="include"]:checked'))
                       .map(el => el.value);
  const includeDiagrams = document.getElementById('include-diagrams').checked;
  
  const statusIndicator = document.getElementById('generate-status');
  const docViewer = document.getElementById('try-generated-docs');
  
  statusIndicator.innerHTML = `
    <div class="loading-spinner">
      <div class="spinner"></div>
      <p>Generating documentation...</p>
    </div>
  `;
  
  docViewer.innerHTML = '';
  document.getElementById('download-actions').style.display = 'none';
  
  try {
    const response = await fetch(`${API_BASE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        analysis_id: lastAnalysisId,
        style: style,
        format: format,
        includes: includes,
        diagrams: includeDiagrams
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Generation failed');
    }
    
    const data = await response.json();
    
    if (data.status === 'processing') {
      // Start polling for status
      pollGenerationStatus(data.request_id);
      return;
    }
    
    // Display generated docs immediately if ready
    displayGeneratedDocs(data);
    
  } catch (error) {
    console.error('Generation error:', error);
    statusIndicator.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>Error: ${error.message}</p>
      </div>
    `;
  }
});

// Poll generation status
async function pollGenerationStatus(requestId) {
  const statusInfo = document.getElementById('status-info');
  const statusIndicator = document.getElementById('generate-status');
  
  const checkStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/status/${requestId}`);
      
      if (!response.ok) {
        throw new Error('Failed to check status');
      }
      
      const data = await response.json();
      
      if (data.status === 'completed') {
        statusInfo.innerHTML = `<p>Documentation generation complete!</p>`;
        statusIndicator.innerHTML = `<p class="success">Documentation ready!</p>`;
        displayGeneratedDocs(data.result);
        return;
      }
      
      if (data.status === 'failed') {
        statusInfo.innerHTML = `<p class="error">Generation failed: ${data.message}</p>`;
        statusIndicator.innerHTML = `
          <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <p>Generation failed: ${data.message}</p>
          </div>
        `;
        return;
      }
      
      // Still processing
      statusInfo.innerHTML = `
        <p><strong>Status:</strong> ${data.status}</p>
        <p><strong>Progress:</strong> ${data.progress || 0}%</p>
        ${data.message ? `<p>${data.message}</p>` : ''}
      `;
      
      // Continue polling
      setTimeout(checkStatus, 2000);
      
    } catch (error) {
      console.error('Status check error:', error);
      statusInfo.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          <p>Error checking status: ${error.message}</p>
        </div>
      `;
    }
  };
  
  // Start polling
  statusIndicator.innerHTML = '<p>Documentation generation started. Checking status...</p>';
  checkStatus();
}

// Display generated documentation
function displayGeneratedDocs(data) {
  const docViewer = document.getElementById('try-generated-docs');
  const actions = document.getElementById('download-actions');
  
  currentDocs = data;
  
  if (data.format === 'markdown') {
    // Use marked.js to render markdown
    docViewer.innerHTML = marked.parse(data.content);
  } else if (data.format === 'html') {
    docViewer.innerHTML = data.content;
  } else {
    // For other formats, show in pre tag
    docViewer.innerHTML = `<pre>${data.content}</pre>`;
  }
  
  // Initialize Mermaid diagrams if present
  if (data.diagrams && typeof mermaid !== 'undefined') {
    mermaid.init(undefined, '.mermaid');
  }
  
  // Show download options
  actions.style.display = 'flex';
  
  // Update status indicator
  document.getElementById('generate-status').innerHTML = `
    <p class="success">Documentation generated successfully!</p>
  `;
}

// Download documentation
document.getElementById('download-btn').addEventListener('click', async () => {
  if (!currentDocs) {
    showErrorNotification('No documentation to download');
    return;
  }
  
  const format = document.getElementById('output-format').value;
  
  try {
    // In a real app, this would download from the server
    // For demo, we'll create a client-side download
    let content, mimeType, extension;
    
    switch (format) {
      case 'markdown':
        content = currentDocs.content;
        mimeType = 'text/markdown';
        extension = 'md';
        break;
      case 'html':
        content = currentDocs.content;
        mimeType = 'text/html';
        extension = 'html';
        break;
      case 'pdf':
        // In a real app, this would come from the server
        showErrorNotification('PDF generation requires server-side processing');
        return;
      case 'docx':
        // In a real app, this would come from the server
        showErrorNotification('DOCX generation requires server-side processing');
        return;
      case 'txt':
        content = currentDocs.content;
        mimeType = 'text/plain';
        extension = 'txt';
        break;
      default:
        throw new Error('Unsupported format');
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sencha-docs-${Date.now()}.${extension}`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
  } catch (error) {
    console.error('Download error:', error);
    showErrorNotification(`Download failed: ${error.message}`);
  }
});

// Copy Markdown to clipboard
document.getElementById('copy-markdown').addEventListener('click', () => {
  if (!currentDocs || currentDocs.format !== 'markdown') {
    showErrorNotification('No Markdown content to copy');
    return;
  }
  
  navigator.clipboard.writeText(currentDocs.content)
    .then(() => {
      const notification = document.createElement('div');
      notification.className = 'success-notification';
      notification.textContent = 'Markdown copied to clipboard!';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    })
    .catch(err => {
      showErrorNotification('Failed to copy to clipboard');
      console.error('Clipboard error:', err);
    });
});

// Status refresh
document.getElementById('refresh-status').addEventListener('click', () => {
  if (!lastAnalysisId) {
    showErrorNotification('No analysis to check status for');
    return;
  }
  
  const statusInfo = document.getElementById('status-info');
  statusInfo.innerHTML = `
    <div class="loading-spinner">
      <div class="spinner"></div>
      <p>Checking status...</p>
    </div>
  `;
  
  // In a real app, this would check the actual status
  setTimeout(() => {
    statusInfo.innerHTML = `
      <p><strong>Last Analysis:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Status:</strong> Ready</p>
    `;
  }, 1000);
});

// Edit functionality
document.getElementById('try-save').addEventListener('click', () => {
  const content = document.getElementById('try-edit-area').value;
  if (!content.trim()) {
    showErrorNotification('No content to save');
    return;
  }
  
  // In a real app, this would save to the server
  localStorage.setItem('sencha_edited_docs', content);
  
  const notification = document.createElement('div');
  notification.className = 'success-notification';
  notification.textContent = 'Changes saved locally!';
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
});

// Load saved edits
document.addEventListener('DOMContentLoaded', () => {
  const savedContent = localStorage.getItem('sencha_edited_docs');
  if (savedContent) {
    document.getElementById('try-edit-area').value = savedContent;
  }
  
  // Disable generate tab until analysis is done
  document.querySelector('.try-tab[data-tab="generate"]').disabled = true;
});

// Error notification
function showErrorNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'error-notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 5000);
}

// Success notification (for copy)
document.head.insertAdjacentHTML('beforeend', `
  <style>
    .success-notification {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #5e7d4a;
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 0.5rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      animation: slideIn 0.3s ease;
    }
  </style>
`);
