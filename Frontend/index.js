async function generate() {
  // Select UI Elements
  const repoUrl = document.getElementById('repoUrl').value;
  const numQuestions = document.getElementById('numQuestions').value;
  const btn = document.getElementById('generateBtn');
  const statusBar = document.getElementById('statusBar');
  const errorBox = document.getElementById('errorBox');
  const questionsList = document.getElementById('questionsList');
  const emptyState = document.getElementById('emptyState');

  // Basic Validation
  if (!repoUrl) {
    showError("Please enter a repository URL.");
    return;
  }

  // Reset UI State
  errorBox.style.display = 'none';
  emptyState.style.display = 'none';
  statusBar.style.display = 'flex';
  btn.disabled = true;
  btn.classList.add('loading');
  questionsList.innerHTML = '';

  try {
    const response = await fetch('https://onrender.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        repo_url: repoUrl,
        num_questions: parseInt(numQuestions)
      })
    });

    const data = await response.json();

    if (response.ok) {
      displayQuestions(data.result);
    } else {
      showError(data.detail || "Failed to analyze repository.");
    }
  } catch (err) {
    showError("Network error. Make sure your backend is running.");
  } finally {
    btn.disabled = false;
    btn.classList.remove('loading');
    statusBar.style.display = 'none';
  }
}

function displayQuestions(questions) {
  const questionsList = document.getElementById('questionsList');
  questions.forEach(q => {
    const div = document.createElement('div');
    div.className = 'question-item'; // Make sure you have this in your CSS
    div.innerText = q;
    questionsList.appendChild(div);
  });
}

function showError(msg) {
  const errorBox = document.getElementById('errorBox');
  errorBox.innerText = msg;
  errorBox.style.display = 'block';
}
