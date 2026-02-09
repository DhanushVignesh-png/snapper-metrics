// =====================================================  
// SNAPPER METRICS PUBLIC VIEWER  
// =====================================================

let allData = [];  
let currentReport = null;  
let sortDirection = 'asc'; // 'asc' or 'desc'

// DOM Elements  
const reportSelect = document.getElementById('reportSelect');  
const sortAZBtn = document.getElementById('sortAZ');  
const sortZABtn = document.getElementById('sortZA');  
const loadingMessage = document.getElementById('loadingMessage');  
const errorMessage = document.getElementById('errorMessage');  
const resultsSection = document.getElementById('resultsSection');  
const resultsBody = document.getElementById('resultsBody');  
const resultsFoot = document.getElementById('resultsFoot');  
const lastUpdatedSpan = document.getElementById('lastUpdated');

// =====================================================  
// INITIALIZATION  
// =====================================================  
document.addEventListener('DOMContentLoaded', function() {  
  loadData();  
    
  // Event listeners  
  reportSelect.addEventListener('change', handleReportChange);  
  sortAZBtn.addEventListener('click', () => setSortDirection('asc'));  
  sortZABtn.addEventListener('click', () => setSortDirection('desc'));  
});

// =====================================================  
// DATA LOADING  
// =====================================================  
async function loadData() {  
  try {  
    const response = await fetch('data.json');  
    if (!response.ok) {  
      throw new Error('Failed to load data');  
    }  
      
    allData = await response.json();  
      
    if (!allData || allData.length === 0) {  
      showError();  
      return;  
    }  
      
    populateReportSelector();  
    currentReport = allData[0];  
    displayReport(currentReport);  
      
    loadingMessage.classList.add('hidden');  
    resultsSection.classList.remove('hidden');  
      
  } catch (error) {  
    console.error('Error loading data:', error);  
    showError();  
  }  
}

function showError() {  
  loadingMessage.classList.add('hidden');  
  errorMessage.classList.remove('hidden');  
}

// =====================================================  
// REPORT SELECTOR  
// =====================================================  
function populateReportSelector() {  
  reportSelect.innerHTML = '';  
    
  allData.forEach((report, index) => {  
    const option = document.createElement('option');  
    option.value = index;  
    option.textContent = report.date || new Date(report.timestamp).toLocaleString();  
    reportSelect.appendChild(option);  
  });  
}

function handleReportChange() {  
  const index = parseInt(reportSelect.value);  
  currentReport = allData[index];  
  displayReport(currentReport);  
}

// =====================================================  
// SORTING  
// =====================================================  
function setSortDirection(direction) {  
  sortDirection = direction;  
    
  // Update button states  
  sortAZBtn.classList.toggle('active', direction === 'asc');  
  sortZABtn.classList.toggle('active', direction === 'desc');  
    
  // Update sort icon  
  const sortIcon = document.querySelector('.sort-icon');  
  sortIcon.textContent = direction === 'asc' ? '▲' : '▼';  
    
  // Re-display current report  
  if (currentReport) {  
    displayReport(currentReport);  
  }  
}

// =====================================================  
// DISPLAY FUNCTIONS  
// =====================================================  
function displayReport(report) {  
  lastUpdatedSpan.textContent = `Last updated: ${report.date}`;  
    
  // Sort results  
  let sortedResults = [...report.results];  
  sortedResults.sort((a, b) => {  
    // Keep unknown snappers at the bottom  
    if (a.isUnknown !== b.isUnknown) {  
      return a.isUnknown ? 1 : -1;  
    }  
      
    // Sort by name  
    const comparison = a.snapper.localeCompare(b.snapper);  
    return sortDirection === 'asc' ? comparison : -comparison;  
  });  
    
  displayResults(sortedResults, report.totals, report.totalsExTurboPLX);  
}

function getCellColor(value, metric) {  
  switch (metric) {  
    case 'factGeniePercent':  
      if (value >= 60) return 'cell-green';  
      if (value >= 40) return 'cell-light-green';  
      if (value >= 20) return 'cell-yellow';  
      return 'cell-orange';

    case 'accuracy':  
      if (value >= 99) return 'cell-green';  
      if (value >= 95) return 'cell-light-green';  
      if (value >= 90) return 'cell-yellow';  
      return 'cell-red';

    case 'avgLength':  
      if (value > 100) return 'cell-red';  
      return '';

    case 'snaps150':  
      if (value > 0) return 'cell-orange';  
      return '';

    case 'errors':  
      if (value > 0) return 'cell-red';  
      return '';

    default:  
      return '';  
  }  
}

function displayResults(results, totals, totalsExTurboPLX) {  
  resultsBody.innerHTML = '';  
  resultsFoot.innerHTML = '';

  for (const row of results) {  
    const tr = document.createElement('tr');  
      
    if (row.isUnknown) {  
      tr.classList.add('unknown-snapper');  
    }  
      
    tr.innerHTML = `  
      <td>${row.snapper}${row.isUnknown ? ' <span class="unknown-badge">*</span>' : ''}</td>  
      <td>${row.alerts}</td>  
      <td>${row.adjAlerts}</td>  
      <td>${row.factGenie}</td>  
      <td class="${getCellColor(row.factGeniePercent, 'factGeniePercent')}">${row.factGeniePercent.toFixed(1)}%</td>  
      <td>${row.avgTimeGap.toFixed(1)}</td>  
      <td>${row.snaps10}</td>  
      <td>${row.snaps20}</td>  
      <td class="${getCellColor(row.avgLength, 'avgLength')}">${row.avgLength.toFixed(1)}</td>  
      <td class="${getCellColor(row.snaps150, 'snaps150')}">${row.snaps150}</td>  
      <td class="${getCellColor(row.errors, 'errors')}">${row.errors}</td>  
      <td class="${getCellColor(row.accuracy, 'accuracy')}">${row.accuracy.toFixed(1)}%</td>  
    `;  
      
    resultsBody.appendChild(tr);  
  }

  // Total row  
  const totalRow = document.createElement('tr');  
  totalRow.innerHTML = `  
    <td><strong>Total/Avg</strong></td>  
    <td>${totals.alerts}</td>  
    <td>${totals.adjAlerts}</td>  
    <td>${totals.factGenie}</td>  
    <td>${totals.factGeniePercent.toFixed(1)}%</td>  
    <td>${totals.avgTimeGap.toFixed(1)}</td>  
    <td>${totals.snaps10}</td>  
    <td>${totals.snaps20}</td>  
    <td>${totals.avgLength.toFixed(1)}</td>  
    <td>${totals.snaps150}</td>  
    <td>${totals.errors}</td>  
    <td>${totals.accuracy.toFixed(1)}%</td>  
  `;  
  resultsFoot.appendChild(totalRow);

  // Total (ex. Turbo, PLX) row  
  const totalExRow = document.createElement('tr');  
  totalExRow.innerHTML = `  
    <td><strong>Total/Avg (ex. Turbo, PLX)</strong></td>  
    <td>${totalsExTurboPLX.alerts}</td>  
    <td>${totalsExTurboPLX.adjAlerts}</td>  
    <td>${totalsExTurboPLX.factGenie}</td>  
    <td>${totalsExTurboPLX.factGeniePercent.toFixed(1)}%</td>  
    <td>${totalsExTurboPLX.avgTimeGap.toFixed(1)}</td>  
    <td>${totalsExTurboPLX.snaps10}</td>  
    <td>${totalsExTurboPLX.snaps20}</td>  
    <td>${totalsExTurboPLX.avgLength.toFixed(1)}</td>  
    <td>${totalsExTurboPLX.snaps150}</td>  
    <td>${totalsExTurboPLX.errors}</td>  
    <td>${totalsExTurboPLX.accuracy.toFixed(1)}%</td>  
  `;  
  resultsFoot.appendChild(totalExRow);  
}  