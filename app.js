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

// Mock analysis functionality for demo purposes
document.getElementById('try-analyze').addEventListener('click', () => {
  const url = document.getElementById('try-url').value.trim();
  if (!url) {
    alert('Please enter a repository URL');
    return;
  }
  
  const docViewer = document.getElementById('try-doc-viewer');
  docViewer.innerHTML = `
    <h3>Analyzing ${url}</h3>
    <div class="loading-spinner">
      <div class="spinner"></div>
      <p>Reading repository structure...</p>
    </div>
  `;
  
  // Simulate analysis delay
  setTimeout(() => {
    docViewer.innerHTML = `
      <h3>Analysis Complete</h3>
      <p>Found 12 Python files, 3 Markdown docs, and 2 Jupyter notebooks.</p>
      <div class="analysis-summary">
        <p><strong>Documentation Status:</strong> 65% complete</p>
        <p><strong>Issues Found:</strong> 3 outdated examples, 2 broken links</p>
      </div>
      <p>Switch to the "Generate" tab to create improved documentation.</p>
    `;
  }, 2000);
});

// Mock generation functionality
document.getElementById('try-generate').addEventListener('click', () => {
  const tone = document.getElementById('tone-select').value;
  const docViewer = document.getElementById('try-generated-docs');
  
  docViewer.innerHTML = `
    <h3>Generating ${tone} documentation...</h3>
    <div class="loading-spinner">
      <div class="spinner"></div>
      <p>This may take a minute...</p>
    </div>
  `;
  
  // Simulate generation delay
  setTimeout(() => {
    let sampleDoc = '';
    if (tone === 'technical') {
      sampleDoc = `
        <h1>Project Documentation</h1>
        <h2>API Reference</h2>
        <h3>Class Example</h3>
        <pre><code>class Example:
    """Example class demonstrating functionality"""
    
    def __init__(self, param: str):
        self.param = param</code></pre>
      `;
    } else if (tone === 'beginner') {
      sampleDoc = `
        <h1>Welcome to the Project!</h1>
        <p>This project helps you do amazing things with just a few simple steps:</p>
        <ol>
          <li>First, install the package using pip</li>
          <li>Then import the main class</li>
          <li>Create an instance and start using it!</li>
        </ol>
      `;
    } else {
      sampleDoc = `
        <h1>Research Project Documentation</h1>
        <h2>Abstract</h2>
        <p>This implementation demonstrates the novel approach described in our paper...</p>
        <h2>Methodology</h2>
        <p>The system architecture consists of three primary components...</p>
      `;
    }
    
    docViewer.innerHTML = sampleDoc + `
      <div class="generated-actions">
        <button class="primary-btn">Save to File</button>
        <button class="secondary-btn">Copy to Clipboard</button>
      </div>
    `;
  }, 2500);
});

// Edit functionality
document.getElementById('try-save').addEventListener('click', () => {
  alert('Changes saved! (This is a demo - in a real app, changes would be saved to your account)');
});

document.getElementById('try-download').addEventListener('click', () => {
  alert('Download started! (This is a demo - in a real app, this would download a Markdown file)');
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    document.querySelector(this.getAttribute('href')).scrollIntoView({
      behavior: 'smooth'
    });
  });
});

// Loading spinner animation
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  .loading-spinner {
    text-align: center;
    margin: 2rem 0;
  }
  .spinner {
    border: 4px solid rgba(94, 125, 74, 0.2);
    border-top: 4px solid var(--primary-green);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }
`;
document.head.appendChild(style);
