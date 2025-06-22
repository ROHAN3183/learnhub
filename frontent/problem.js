let allProblems = [];
let currentFilters = {
  difficulty: [],
  company: [],
  topics: []
};

// ✅ Get actual logged-in user from localStorage
const userId = JSON.parse(localStorage.getItem('loggedInUser'))?.email || null;

// Track user progress
let userProgress = {};

// DOM Elements
const filterModal = document.getElementById('filter-modal');
const filterLink = document.getElementById('filter-link');
const homeLink = document.getElementById('home-link');
const closeFilter = document.getElementById('close-filter');
const applyFilter = document.getElementById('apply-filter');
const resetFilter = document.getElementById('reset-filter');
const difficultyOptions = document.getElementById('difficulty-options');
const companyOptions = document.getElementById('company-options');
const topicOptions = document.getElementById('topic-options');
const searchInput = document.getElementById('searchInput');

// Event Listeners
filterLink.addEventListener('click', openFilterModal);
homeLink.addEventListener('click', showAllProblems);
closeFilter.addEventListener('click', closeFilterModal);
applyFilter.addEventListener('click', applyFilters);
resetFilter.addEventListener('click', resetFilters);
searchInput.addEventListener('keyup', function (e) {
  if (e.key === 'Enter') handleSearch();
});

// Add event listeners to filter options
function setupFilterOptions() {
  const options = document.querySelectorAll('.filter-option');
  options.forEach(option => {
    option.addEventListener('click', function () {
      this.classList.toggle('selected');
    });
  });
}

// Modal functions
function openFilterModal() {
  filterModal.style.display = 'flex';
}

function closeFilterModal() {
  filterModal.style.display = 'none';
}

// Filter functions
function applyFilters() {
  currentFilters = {
    difficulty: getSelectedValues('difficulty-options'),
    company: getSelectedValues('company-options'),
    topics: getSelectedValues('topic-options')
  };

  filterProblems();
  closeFilterModal();
}

function getSelectedValues(containerId) {
  const container = document.getElementById(containerId);
  const selected = container.querySelectorAll('.selected');
  return Array.from(selected).map(el => el.dataset.value);
}

function resetFilters() {
  document.querySelectorAll('.filter-option.selected').forEach(option => {
    option.classList.remove('selected');
  });

  currentFilters = { difficulty: [], company: [], topics: [] };
  showAllProblems();
  closeFilterModal();
}

function filterProblems() {
  const filtered = allProblems.filter(problem => {
    if (currentFilters.difficulty.length > 0 &&
      !currentFilters.difficulty.includes(problem.difficulty.toLowerCase())) {
      return false;
    }

    if (currentFilters.company.length > 0 &&
      !currentFilters.company.includes(problem.company)) {
      return false;
    }

    if (currentFilters.topics.length > 0) {
      const hasTopic = problem.topics.some(topic =>
        currentFilters.topics.includes(topic)
      );
      if (!hasTopic) return false;
    }

    return true;
  });

  displayProblems(filtered);
}

function showAllProblems() {
  displayProblems(allProblems);
}

// ✅ Search Function (Local)
function handleSearch() {
  const query = searchInput.value.trim().toLowerCase();

  if (!query) {
    displayProblems(allProblems);
    return;
  }

  const filtered = allProblems.filter(problem =>
    problem.title.toLowerCase().includes(query)
  );

  // Sort: exact matches on top
  filtered.sort((a, b) => {
    const aMatch = a.title.toLowerCase() === query;
    const bMatch = b.title.toLowerCase() === query;
    return (bMatch ? 1 : 0) - (aMatch ? 1 : 0);
  });

  displayProblems(filtered);
}

// ✅ Display Problems
function displayProblems(problems) {
  const list = document.querySelector('.problem-list');
  list.innerHTML = '';

  if (problems.length === 0) {
    list.innerHTML = `<p style="color:red;">No problems found.</p>`;
    return;
  }

  problems.forEach(problem => {
    const progress = userProgress[problem.title] || { isSolved: false, revisionCount: 0 };

    const card = document.createElement('div');
    card.className = 'problem-card';

    card.innerHTML = `
      <h3>${problem.title}</h3>
      <div class="problem-meta">
        Company: ${problem.company} | Topic: ${problem.topics.join(', ')} | Difficulty: ${problem.difficulty}
      </div>
      <div style="margin-top: 10px;">
        <label>
          <input type="checkbox" class="solved-checkbox" data-title="${problem.title}" ${progress.isSolved ? 'checked' : ''}>
          Solved
        </label>
        <span style="margin-left: 20px;">
          Revisions: <span class="revision-count" data-title="${problem.title}">${progress.revisionCount}</span>
        </span>
        <button class="rev-btn" data-delta="1" data-title="${problem.title}">+</button>
        <button class="rev-btn" data-delta="-1" data-title="${problem.title}">-</button>
      </div>
    `;

    list.appendChild(card);
  });

  setupActionListeners();
}

// ✅ Setup checkbox + revision buttons
function setupActionListeners() {
  document.querySelectorAll('.solved-checkbox').forEach(box => {
    box.addEventListener('change', async function () {
      const title = this.dataset.title;
      const isSolved = this.checked;
      const revisionCount = userProgress[title]?.revisionCount || 0;
      await updateProgress(title, isSolved, revisionCount);
    });
  });

  document.querySelectorAll('.rev-btn').forEach(btn => {
    btn.addEventListener('click', async function () {
      const title = this.dataset.title;
      const delta = parseInt(this.dataset.delta);
      const prev = userProgress[title]?.revisionCount || 0;
      const newCount = Math.max(prev + delta, 0);
      const isSolved = userProgress[title]?.isSolved || false;

      await updateProgress(title, isSolved, newCount);
      userProgress[title].revisionCount = newCount;

      const counter = document.querySelector(`.revision-count[data-title="${title}"]`);
      if (counter) counter.textContent = newCount;
    });
  });
}

// ✅ Save progress to backend
async function updateProgress(title, isSolved, revisionCount) {
  if (!userId) {
    alert("Please login to track progress.");
    return;
  }

  try {
    await fetch('https://learnhub-0m40.onrender.com/api/progress/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        problemTitle: title,
        isSolved,
        revisionCount
      })
    });
    userProgress[title] = { isSolved, revisionCount };
  } catch (err) {
    console.error('Failed to update progress:', err);
  }
}

// ✅ Load user progress
async function fetchUserProgress() {
  if (!userId) {
    userProgress = {};
    return;
  }

  try {
    const res = await fetch(`https://learnhub-0m40.onrender.com/api/progress/${userId}`);
    const data = await res.json();
    userProgress = {};
    data.forEach(p => {
      userProgress[p.problemTitle] = {
        isSolved: p.isSolved,
        revisionCount: p.revisionCount
      };
    });
  } catch (err) {
    console.error("Error loading progress", err);
    userProgress = {};
  }
}

// ✅ Fetch problems and then progress
async function fetchProblems() {
  try {
    const response = await fetch('https://learnhub-0m40.onrender.com/api/problems');
    allProblems = await response.json();
    await fetchUserProgress();
    displayProblems(allProblems);
    setupFilterOptions();
  } catch (err) {
    console.error('Error fetching problems:', err);
  }
}
//search result
function resetSearch() {
  const searchInput = document.getElementById("searchInput");
  searchInput.value = '';
  displayProblems(allProblems); // Show all again
}


// 🔄 Load on page
window.onload = fetchProblems;
