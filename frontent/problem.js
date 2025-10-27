let allProblems = [];
let currentFilters = {
  difficulty: [],
  company: [],
  topics: []
};

const userId = JSON.parse(localStorage.getItem('loggedInUser'))?.email || null;
let userProgress = {};

// DOM Elements
const filterModal = document.getElementById('filter-modal');
const filterLink = document.getElementById('filter-link');
const homeLink = document.getElementById('home-link');
const closeFilter = document.getElementById('close-filter');
const applyFilter = document.getElementById('apply-filter');
const resetFilter = document.getElementById('reset-filter');
const searchInput = document.getElementById('searchInput');

// Event Listeners
filterLink.addEventListener('click', openFilterModal);
closeFilter.addEventListener('click', closeFilterModal);
applyFilter.addEventListener('click', applyFilters);
resetFilter.addEventListener('click', resetFilters);
searchInput.addEventListener('keyup', function (e) {
  if (e.key === 'Enter') handleSearch();
});

function setupFilterOptions() {
  const options = document.querySelectorAll('.filter-option');
  options.forEach(option => {
    option.addEventListener('click', function () {
      this.classList.toggle('selected');
    });
  });
}

function openFilterModal() {
  filterModal.style.display = 'flex';
}

function closeFilterModal() {
  filterModal.style.display = 'none';
}

function getSelectedValues(containerId) {
  const container = document.getElementById(containerId);
  const selected = container.querySelectorAll('.selected');
  return Array.from(selected).map(el => el.dataset.value);
}

function applyFilters() {
  currentFilters = {
    difficulty: getSelectedValues('difficulty-options'),
    company: getSelectedValues('company-options'),
    topics: getSelectedValues('topic-options')
  };

  filterProblems();
  closeFilterModal();
}

function resetFilters() {
  document.querySelectorAll('.filter-option.selected').forEach(option => {
    option.classList.remove('selected');
  });

  currentFilters = { difficulty: [], company: [], topics: [] };
  displayProblems(allProblems);
  searchInput.value = '';
}

function filterProblems() {
  const filtered = allProblems.filter(problem => {
    if (
      currentFilters.difficulty.length > 0 &&
      !currentFilters.difficulty.includes(problem.difficulty.toLowerCase())
    ) return false;

    if (
      currentFilters.company.length > 0 &&
      !currentFilters.company.includes(problem.company)
    ) return false;

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

function handleSearch() {
  const query = searchInput.value.trim().toLowerCase();

  if (!query) {
    displayProblems(allProblems);
    return;
  }

  const filtered = allProblems.filter(problem =>
    problem.title.toLowerCase().includes(query)
  );

  filtered.sort((a, b) => {
    const aMatch = a.title.toLowerCase() === query;
    const bMatch = b.title.toLowerCase() === query;
    return (bMatch ? 1 : 0) - (aMatch ? 1 : 0);
  });

  displayProblems(filtered);
}

function resetSearch() {
  searchInput.value = '';
  displayProblems(allProblems);
}

//incremnet and the decrement on the button
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
        <button class="rev-btn increment" data-delta="1" data-title="${problem.title}">+</button>
        <button class="rev-btn decrement" data-delta="-1" data-title="${problem.title}">-</button>
      </div>
    `;

    list.appendChild(card);
  });

  setupActionListeners();
}



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

async function updateProgress(title, isSolved, revisionCount) {
  if (!userId) {
    alert("Please login to track progress.");
    return;
  }

  try {
    await fetch('http://13.203.159.201:5000/api/progress/update', {
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

async function fetchUserProgress() {
  if (!userId) {
    userProgress = {};
    return;
  }

  try {
    const res = await fetch(`http://13.203.159.201:5000/api/progress/${userId}`);
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

async function fetchProblems() {
  try {
    const response = await fetch('http://13.203.159.201:5000/api/problems');
    allProblems = await response.json();
    await fetchUserProgress();
    setupFilterOptions();

    const urlParams = new URLSearchParams(window.location.search);
    const topic = urlParams.get("topic");

    if (topic) {
      const topicFiltered = allProblems.filter(problem =>
        problem.topics.map(t => t.toLowerCase()).includes(topic.toLowerCase())
      );
      displayProblems(topicFiltered);
    } else {
      displayProblems(allProblems);
    }

  } catch (err) {
    console.error('Error fetching problems:', err);
  }
}

window.onload = fetchProblems;
