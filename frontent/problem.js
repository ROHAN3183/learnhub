let allProblems = [];
let currentFilters = {
  difficulty: [],
  company: [],
  topics: []
};

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

// Event Listeners
filterLink.addEventListener('click', openFilterModal);
homeLink.addEventListener('click', showAllProblems);
closeFilter.addEventListener('click', closeFilterModal);
applyFilter.addEventListener('click', applyFilters);
resetFilter.addEventListener('click', resetFilters);

// Add event listeners to filter options
function setupFilterOptions() {
  const options = document.querySelectorAll('.filter-option');
  options.forEach(option => {
    option.addEventListener('click', function() {
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
  // Get selected filters
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
  // Clear all selected options
  document.querySelectorAll('.filter-option.selected').forEach(option => {
    option.classList.remove('selected');
  });
  
  currentFilters = {
    difficulty: [],
    company: [],
    topics: []
  };
  
  showAllProblems();
  closeFilterModal();
}

function filterProblems() {
  const filtered = allProblems.filter(problem => {
    // Check difficulty
    if (currentFilters.difficulty.length > 0 && 
        !currentFilters.difficulty.includes(problem.difficulty.toLowerCase())) {
      return false;
    }
    
    // Check company
    if (currentFilters.company.length > 0 && 
        !currentFilters.company.includes(problem.company)) {
      return false;
    }
    
    // Check topics
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

// Problem display functions
function displayProblems(problems) {
  const list = document.querySelector('.problem-list');
  list.innerHTML = '';

  problems.forEach(problem => {
    const card = document.createElement('div');
    card.className = 'problem-card';
    card.innerHTML = `
      <h3>${problem.title}</h3>
      <div class="problem-meta">
        Company: ${problem.company} | Topic: ${problem.topics.join(', ')} | Difficulty: ${problem.difficulty}
      </div>`;
    list.appendChild(card);
  });
}

// Fetch problems
async function fetchProblems() {
  try {
    const response = await fetch('http://localhost:5000/api/problems');
    allProblems = await response.json();
    displayProblems(allProblems);
    setupFilterOptions();
  } catch (err) {
    console.error('Error fetching problems:', err);
    // Fallback to default problems if API fails
    allProblems = [
      {
        title: "Two Sum",
        company: "Amazon",
        topics: ["Arrays", "HashMap"],
        difficulty: "Easy"
      },
      {
        title: "Sliding Window Maximum",
        company: "Microsoft",
        topics: ["Sliding Window", "Deque"],
        difficulty: "Hard"
      },
      {
        title: "Interval Merge",
        company: "Google",
        topics: ["Sorting", "Greedy"],
        difficulty: "Medium"
      },
      {
        title: "Longest Substring Without Repeating Characters",
        company: "Adobe",
        topics: ["Strings", "HashMap"],
        difficulty: "Medium"
      },
      {
        title: "Top K Frequent Elements",
        company: "Amazon",
        topics: ["Heap", "HashMap"],
        difficulty: "Medium"
      }
    ];
    displayProblems(allProblems);
    setupFilterOptions();
  }
}

window.onload = fetchProblems;