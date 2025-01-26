let totalDoseDiv;
let totalInjectionFrequencyDiv;
let activeCompounds = [];
let chart = null;
let editingIndex = null;
let selectedDate = null;
let medicalTests = [];

function frequencyToWeekly(frequencyDays) {
  return 7 / frequencyDays;
}

function weeklyToFrequency(weeklyFreq) {
  return 7 / weeklyFreq;
}

function addCompound() {
  const compound = document.getElementById('compound').value;
  const ester = document.getElementById('ester').value;
  const concentration = parseFloat(document.getElementById('concentration').value);
  const dosage = parseFloat(document.getElementById('dosage').value);
  const frequencyDays = parseFloat(document.getElementById('frequency-days').value);
  const frequency = frequencyToWeekly(frequencyDays); // Convert to weekly frequency
  const startDate = new Date(document.getElementById('startDate').value);
  const duration = parseInt(document.getElementById('duration').value);

  const compoundData = STEROID_DATA[compound].esters[ester];
  const newCompound = {
    compound,
    ester,
    concentration,
    dosage,
    frequency,
    startDate,
    duration,
    data: compoundData
  };

  activeCompounds.push(newCompound);
  updateCompoundsList();
  calculateAndDraw();
  saveToLocalStorage();
}

function editCompound(index) {
  editingIndex = index;
  const compound = activeCompounds[index];
  
  document.getElementById('compound').value = compound.compound;
  updateEsters();
  document.getElementById('ester').value = compound.ester;
  document.getElementById('concentration').value = compound.concentration;
  document.getElementById('dosage').value = compound.dosage;
  const frequencyDays = weeklyToFrequency(compound.frequency);
  document.getElementById('frequency-days').value = frequencyDays;
  document.getElementById('startDate').value = compound.startDate.toISOString().split('T')[0];
  document.getElementById('duration').value = compound.duration;

  document.getElementById('addButton').style.display = 'none';
  document.getElementById('updateButton').style.display = 'block';
  document.getElementById('cancelButton').style.display = 'block';
  
  updateCompoundInfo();
}

function updateCompound() {
  if (editingIndex === null) return;
  
  const compound = document.getElementById('compound').value;
  const ester = document.getElementById('ester').value;
  const concentration = parseFloat(document.getElementById('concentration').value);
  const dosage = parseFloat(document.getElementById('dosage').value);
  const frequencyDays = parseFloat(document.getElementById('frequency-days').value);
  const frequency = frequencyToWeekly(frequencyDays);
  const startDate = new Date(document.getElementById('startDate').value);
  const duration = parseInt(document.getElementById('duration').value);

  const compoundData = STEROID_DATA[compound].esters[ester];
  activeCompounds[editingIndex] = {
    compound,
    ester,
    concentration,
    dosage,
    frequency,
    startDate,
    duration,
    data: compoundData
  };

  cancelEdit();
  updateCompoundsList();
  calculateAndDraw();
  saveToLocalStorage();
}

function cancelEdit() {
  editingIndex = null;
  document.getElementById('addButton').style.display = 'block';
  document.getElementById('updateButton').style.display = 'none';
  document.getElementById('cancelButton').style.display = 'none';
  
  // Reset form
  document.getElementById('compound').selectedIndex = 0;
  updateEsters(); // This will populate both main form and dialog esters
  document.getElementById('concentration').value = '100';
  document.getElementById('dosage').value = '100';
  document.getElementById('frequency-days').value = '1';
  document.getElementById('duration').value = '10';
}

function removeCompound(index) {
  activeCompounds.splice(index, 1);
  updateCompoundsList();
  calculateAndDraw();
  saveToLocalStorage();
}

function updateCompoundsList() {
  const list = document.getElementById('activeCompounds');
  if (!list) return;
  
  list.innerHTML = '';
  
  activeCompounds.forEach((compound, index) => {
    if (!isValidCompound(compound)) return;
    
    const steroidData = STEROID_DATA[compound.compound];
    const esterData = steroidData.esters[compound.ester];
    const frequencyDays = weeklyToFrequency(compound.frequency);
    
    const div = document.createElement('div');
    div.className = 'active-compound';
    
    let frequencyText = '';
    if (esterData.isOral) {
      frequencyText = `${compound.frequency} раз в день`;
    } else if (frequencyDays === 1) {
      frequencyText = 'каждый день';
    } else if (frequencyDays === 2) {
      frequencyText = 'через день';
    } else {
      frequencyText = `раз в ${frequencyDays} дня`;
    }
    
    div.innerHTML = `
      <h4>${steroidData.name} ${esterData.name}</h4>
      <p>Дозировка: ${compound.dosage}${esterData.isIU ? ' ME' : ' мг'} ${frequencyText}</p>
      <div class="edit-buttons">
        <button class="edit-button" onclick="editCompound(${index})">Редактировать</button>
        <button class="delete-button" onclick="removeCompound(${index})">Удалить</button>
      </div>
    `;
    list.appendChild(div);
  });
}

function calculateAndDraw() {
  if (!activeCompounds?.length) {
    clearChart();
    clearCalendar();
    return;
  }

  // Find total date range - ensure all dates are valid Date objects
  let minDate = new Date(Math.min(...activeCompounds.map(c => c.startDate.getTime())));
  let maxDuration = Math.max(...activeCompounds.map(c => c.duration * 7));
  let totalDays = maxDuration;

  // Add extra days for compound elimination
  totalDays += Math.max(...activeCompounds.map(c => Math.ceil(c.data.halfLife * 10)));

  // Get display period from select
  const displayPeriod = parseInt(document.getElementById('displayPeriod').value);
  
  const daysArray = Array.from({length: totalDays}, (_, i) => i)
    .filter(day => day < displayPeriod);

  const datasets = [];
  
  // Calculate concentrations for each compound
  activeCompounds.forEach(compound => {
    const concentrationData = calculateCompoundConcentration(compound, displayPeriod);
    datasets.push({
      label: `${STEROID_DATA[compound.compound].name} ${compound.data.name}`,
      data: concentrationData,
      backgroundColor: compound.data.color,
      borderColor: compound.data.borderColor,
      borderWidth: 1,
      fill: true
    });
  });

  drawChart(daysArray, datasets);
  updateCalendar();
}

function drawChart(days, datasets) {
  const ctx = document.getElementById('steroidChart').getContext('2d');
  const isMobile = detectDevice();
  
  if (chart) {
    chart.destroy();
  }
  
  chart = new Chart(ctx, {
    type: 'line',
    data: { labels: days, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: { 
            display: !isMobile, 
            text: 'Дни' 
          },
          ticks: {
            maxRotation: isMobile ? 45 : 0,
            autoSkip: true,
            stepSize: Math.ceil(days.length / 10) // Reduce number of ticks
          }
        },
        y: {
          title: { 
            display: !isMobile, 
            text: 'Концентрация' 
          },
          beginAtZero: true
        }
      },
      plugins: {
        legend: {
          position: isMobile ? 'bottom' : 'top',
          labels: {
            boxWidth: isMobile ? 8 : 40
          }
        }
      }
    }
  });
}

function calculateCompoundConcentration(compound, totalDays) {
  const injectionDays = [];
  const daysPerWeek = 7;
  const daysInterval = daysPerWeek / compound.frequency;
  
  for (let week = 0; week < compound.duration; week++) {
    for (let injection = 0; injection < compound.frequency; injection++) {
      injectionDays.push(week * 7 + injection * daysInterval);
    }
  }

  return Array.from({length: totalDays}, (_, day) => {
    let totalConcentration = 0;
    
    injectionDays.forEach(injectionDay => {
      if (injectionDay <= day) {
        const daysSinceInjection = day - injectionDay;
        const concentration = calculateConcentration(
          compound.dosage,
          daysSinceInjection,
          compound.data.halfLife,
          compound.data.peakTime
        );
        totalConcentration += concentration;
      }
    });
    
    return totalConcentration;
  });
}

function calculateConcentration(dose, time, halfLife, peakTime) {
  if (time < 0) return 0;
  
  // Using modified two-compartment model with sharper elimination
  const k = Math.log(2) / halfLife;
  const peakFactor = Math.exp(-k * peakTime);
  
  if (time <= peakTime) {
    // Rising phase
    return dose * (1 - Math.exp(-4 * time / peakTime));
  } else {
    // Elimination phase with enhanced decay
    return dose * Math.exp(-k * (time - peakTime));
  }
}

function updateCalendar() {
  const calendar = document.getElementById('calendar');
  calendar.innerHTML = '';
  
  if (activeCompounds.length === 0) return;

  const startDate = new Date(Math.min(...activeCompounds.map(c => c.startDate.getTime())));
  const totalDays = Math.max(...activeCompounds.map(c => c.duration * 7)) + 30;
  
  for (let i = 0; i < totalDays; i++) {
    const currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i, 12, 0, 0, 0);
    
    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day';
    dayDiv.onclick = () => handleDateClick(currentDate);
    
    let injectionInfo = '';
    activeCompounds.forEach((compound, compoundIndex) => {
      const compoundStartDate = new Date(compound.startDate.getFullYear(), compound.startDate.getMonth(), compound.startDate.getDate(), 12, 0, 0, 0);
      const daysDiff = Math.round((currentDate - compoundStartDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff >= 0 && daysDiff < compound.duration * 7) {
        if (isInjectionDay(daysDiff, compound)) {
          const name = `${STEROID_DATA[compound.compound].name} ${compound.data.name}`;
          injectionInfo += `
            <div class="injection" data-compound-index="${compoundIndex}" data-date="${currentDate.toISOString()}">
              <span>${name}: ${compound.dosage}${compound.data.isIU ? ' ME' : ' мг'}</span>
              <span class="delete-injection" onclick="removeCompoundFromDate(event, ${compoundIndex}, '${currentDate.toISOString()}')">&times;</span>
            </div>`;
        }
      }
    });
    
    dayDiv.innerHTML = `
      <div class="date">${currentDate.toLocaleDateString()}</div>
      ${injectionInfo}
    `;
    
    if (injectionInfo) {
      dayDiv.classList.add('has-injections');
    }
    
    calendar.appendChild(dayDiv);
  }
}

function removeCompoundFromDate(event, compoundIndex, dateStr) {
  event.stopPropagation(); // Prevent calendar day click
  
  const date = new Date(dateStr);
  const compound = activeCompounds[compoundIndex];
  
  if (!compound) return;
  
  // Adjust compound start date to be after this injection
  const compoundStartDate = new Date(compound.startDate);
  const daysDiff = Math.round((date - compoundStartDate) / (1000 * 60 * 60 * 24));
  
  // If this is the first injection, remove the compound entirely
  if (daysDiff === 0) {
    activeCompounds.splice(compoundIndex, 1);
  } else {
    // Split the compound into two periods if needed
    const newDuration = Math.floor(daysDiff / 7);
    if (newDuration > 0) {
      compound.duration = newDuration;
    } else {
      activeCompounds.splice(compoundIndex, 1);
    }
  }
  
  updateCompoundsList();
  calculateAndDraw();
  saveToLocalStorage();
}

function isInjectionDay(day, compound) {
  const daysInterval = 7 / compound.frequency;
  return day % daysInterval < 1;
}

function updateEsters(type='main') {
  let compoundSelects, esterSelects;

  if(type === 'main') {
    compoundSelects = [
      document.getElementById('compound'),
      document.getElementById('compound-dialog')
    ];
  
    esterSelects = [
      document.getElementById('ester'),
      document.getElementById('ester-dialog')
    ];
  }
  else {
    compoundSelects = [document.getElementById('pct-compound-dialog')];
      esterSelects = [document.getElementById('pct-ester-dialog')];
  }

  compoundSelects.forEach((compoundSelect, index) => {
    if (!compoundSelect) return;

    const compound = compoundSelect.value;
      const esterSelect = esterSelects[index]
    if (!esterSelect) return;

    const esters = STEROID_DATA[compound]?.esters;
    if (!esters) return;
    
    // Clear and populate ester select
    esterSelect.innerHTML = '';
    Object.entries(esters).forEach(([value, data]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = data.name;
      esterSelect.appendChild(option);
    });
  });
}

function updateCompoundInfo() {
  const compound = document.getElementById('compound').value;
  const ester = document.getElementById('ester').value;
  const data = STEROID_DATA[compound]?.esters[ester];
  
  if (!data) return;
  
  // Hide/show fields based on compound type
  const concentrationField = document.getElementById('concentration').parentElement;
  const frequencyField = document.getElementById('frequency-days').parentElement;
  const frequencyLabel = document.querySelector('label[for="frequency-days"]');
  const dosageLabel = document.querySelector('label[for="dosage"]');

  if (data.isOral) {
    concentrationField.style.display = 'none';
    if (frequencyLabel) {
      frequencyLabel.textContent = 'Количество приемов в день:';
    }
    if (dosageLabel) {
      dosageLabel.textContent = 'Количество таблеток:';
    }
  } else {
    concentrationField.style.display = 'block';
    if (frequencyLabel) {
      frequencyLabel.textContent = 'Количество инъекций в день:';
    }
    if (dosageLabel) {
      dosageLabel.textContent = 'Дозировка:';
    }
  }
  
  document.getElementById('compound-info').innerHTML = `
    <p><strong>Название:</strong> ${STEROID_DATA[compound].name} ${data.name}</p>
    <p><strong>Период полувыведения:</strong> ${data.halfLife} дней</p>
    <p><strong>Время до пика:</strong> ${data.peakTime} дней</p>
    <p><strong>Активный период:</strong> ${data.activePeriod} дней</p>
    <p><strong>Описание:</strong> ${data.description}</p>
  `;
}

function handleDateClick(date) {
  // Create a new date at noon on the selected date
  selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
  showAddCompoundDialog();
}

function addCompoundOnDate() {
  const compound = document.getElementById('compound-dialog').value;
  const ester = document.getElementById('ester-dialog').value;
    
    const pctCompound = document.getElementById('pct-compound-dialog').value;
    const pctEster = document.getElementById('pct-ester-dialog').value;

  const concentration = parseFloat(document.getElementById('concentration-dialog').value);
  const dosage = parseFloat(document.getElementById('dosage-dialog').value);
    
  const pctDosage = parseFloat(document.getElementById('pct-dosage-dialog').value);
  const frequencyDays = parseFloat(document.getElementById('frequency-days-dialog').value);
  const frequency = frequencyToWeekly(frequencyDays);
  
  if (!selectedDate) {
    return;
  }
    
    const compoundData = STEROID_DATA[compound]?.esters[ester];
    const pctData = STEROID_DATA[pctCompound]?.esters[pctEster];
    
    if (!compoundData) return;
    
    if (pctCompound && pctEster && pctData) {
      const pctStartDate = new Date(selectedDate);
      pctStartDate.setHours(12, 0, 0, 0);

      const newPctCompound = {
        compound: pctCompound,
        ester: pctEster,
        concentration: 0,
        dosage: pctDosage,
        frequency: 1,
        startDate: pctStartDate,
        duration: 1,
        data: pctData
      };
      
      activeCompounds.push(newPctCompound);
    }
    else if (compound && ester && compoundData) {
        // Set the time to noon to avoid timezone issues
        const startDate = new Date(selectedDate);
        startDate.setHours(12, 0, 0, 0);

      const newCompound = {
        compound,
        ester,
        concentration: concentration, 
        dosage,
        frequency,
        startDate,
        duration: 1,
        data: compoundData
      };
        activeCompounds.push(newCompound);
    }
  
  updateCompoundsList();
  calculateAndDraw();
  saveToLocalStorage();
  
  hideAddCompoundDialog();
  
  const saveConfirm = document.createElement('div');
  saveConfirm.className = 'save-confirmation';
  saveConfirm.textContent = 'Препарат успешно добавлен';
  document.body.appendChild(saveConfirm);
  
  setTimeout(() => {
    saveConfirm.remove();
  }, 2000);
}

function showAddCompoundDialog() {
  const dialog = document.getElementById('add-compound-dialog');
  const backdrop = document.querySelector('.dialog-backdrop');
  dialog.style.display = 'block';
  backdrop.style.display = 'block';
  
  // Set the date in the dialog
  document.getElementById('selected-date').textContent = selectedDate.toLocaleDateString();
  
  // Reset and update form fields
  const compoundDialog = document.getElementById('compound-dialog');
  const concentrationDialog = document.getElementById('concentration-dialog').parentElement;
  const frequencyLabelDialog = document.querySelector('label[for="frequency-days-dialog"]');
  const dosageLabelDialog = document.querySelector('label[for="dosage-dialog"]');
  
  if (compoundDialog) {
    compoundDialog.value = 'testosterone';
    updateEsters();
    
    // Check if selected compound is oral
    const compound = compoundDialog.value;
    const ester = document.getElementById('ester-dialog').value;
    const data = STEROID_DATA[compound]?.esters[ester];
    
    if (data?.isOral) {
      concentrationDialog.style.display = 'none';
      frequencyLabelDialog.textContent = 'Количество приемов в день:';
      dosageLabelDialog.textContent = 'Количество таблеток:';
    } else {
      concentrationDialog.style.display = 'block';
      frequencyLabelDialog.textContent = 'Инъекций в день:';
      dosageLabelDialog.textContent = 'Дозировка:';
    }
  }
  
  // Set default values
  document.getElementById('concentration-dialog').value = '100';
  document.getElementById('dosage-dialog').value = '100';
  document.getElementById('frequency-days-dialog').value = '1';
  document.getElementById('pct-dosage-dialog').value = '50';
  
  // Update PCT fields
  const pctCompoundDialog = document.getElementById('pct-compound-dialog');
  if (pctCompoundDialog) {
    pctCompoundDialog.value = 'clomiphene';
    updateEsters('pct');
  }
}

function hideAddCompoundDialog() {
  const dialog = document.getElementById('add-compound-dialog');
  const backdrop = document.querySelector('.dialog-backdrop');
  dialog.style.display = 'none';
  backdrop.style.display = 'none';
  selectedDate = null;
}

function updateDashboard() {
  const dashboard = document.getElementById('dashboard-tab');
  if (!dashboard) return;
  dashboard.innerHTML = '';
  
  if (activeCompounds.length === 0) {
    dashboard.innerHTML = '<p>Нет активных препаратов.</p>';
    return;
  }
    
    const totalDuration = activeCompounds.reduce((max, compound) => {
        const compoundEndDate = new Date(compound.startDate);
        compoundEndDate.setDate(compound.startDate.getDate() + compound.duration * 7);
        return Math.max(max, compoundEndDate.getTime());
    }, 0);

    const totalDurationWeeks = Math.ceil((totalDuration - Math.min(...activeCompounds.map(c => c.startDate.getTime()))) / (1000 * 60 * 60 * 24 * 7));

  const totalCompounds = activeCompounds.length;
  const firstDay = new Date(Math.min(...activeCompounds.map(c => c.startDate.getTime())));
  const lastDay = new Date(totalDuration);

  const daysOnCycle = Math.ceil((lastDay - firstDay) / (1000 * 60 * 60 * 24));
  
    const totalDose = activeCompounds.reduce((sum, compound) => {
      const dailyDose = compound.dosage / 7 * compound.frequency
      return sum + dailyDose * compound.duration * 7;
    }, 0);
  
    const totalInjectionFrequency = activeCompounds.reduce((sum, compound) => {
      if (!compound.data.isOral) {
        return sum + compound.frequency * compound.duration;
      }
      return sum;
    }, 0);

    const dashboardMetrics = document.createElement('div');
    dashboardMetrics.className = 'dashboard-metrics';

    const totalCompoundsDiv = document.createElement('div');
    totalCompoundsDiv.className = 'dashboard-item';
    totalCompoundsDiv.innerHTML = `<h4>Всего препаратов</h4><p>${totalCompounds}</p>`;
    dashboardMetrics.appendChild(totalCompoundsDiv);

    const firstDayDiv = document.createElement('div');
    firstDayDiv.className = 'dashboard-item';
    firstDayDiv.innerHTML = `<h4>Начало курса</h4><p>${firstDay.toLocaleDateString()}</p>`;
    dashboardMetrics.appendChild(firstDayDiv);
    
    const lastDayDiv = document.createElement('div');
    lastDayDiv.className = 'dashboard-item';
    lastDayDiv.innerHTML = `<h4>Окончание курса</h4><p>${lastDay.toLocaleDateString()}</p>`;
    dashboardMetrics.appendChild(lastDayDiv);
    
  const durationDiv = document.createElement('div');
  durationDiv.className = 'dashboard-item';
  durationDiv.innerHTML = `<h4>Длительность курса</h4><p>${daysOnCycle} дней, ${totalDurationWeeks} недель</p>`;
  dashboardMetrics.appendChild(durationDiv);
    
  dashboard.appendChild(dashboardMetrics);

  
  const dashboardItems = [
    { label: 'Обшая дозировка за курс', value: `${totalDose.toFixed(0)} мг`},
    {label: 'Общее кол-во инъекций', value: `${totalInjectionFrequency} `}
  ];
  
    const dashboardDates = document.createElement('div');
    dashboardDates.className = 'dashboard-dates';

  const totalDoseDiv = document.createElement('div');
    totalDoseDiv.className = 'dashboard-item';
  totalDoseDiv.innerHTML = `<h4>${dashboardItems[0].label}</h4><p>${dashboardItems[0].value}</p>`;
  dashboardDates.appendChild(totalDoseDiv);

  const totalInjectionFrequencyDiv = document.createElement('div');
  totalInjectionFrequencyDiv.className = 'dashboard-item';
  totalInjectionFrequencyDiv.innerHTML = `<h4>${dashboardItems[1].label}</h4><p>${dashboardItems[1].value}</p>`;
  dashboardDates.appendChild(totalInjectionFrequencyDiv);

  dashboard.appendChild(dashboardDates);
    
    const compoundListDiv = document.createElement('div');
    compoundListDiv.className = 'dashboard-item compound-list';
    let compoundListHTML = '<h4>Список препаратов:</h4><ul>';
    
    activeCompounds.forEach(compound => {
        const steroidName = STEROID_DATA[compound.compound]?.name;
        const esterName = compound.data.name;
        const dosage = compound.dosage;
        const frequency = compound.frequency;
        const doseType = compound.data.isOral ? 'таб' : 'мг';
        const frequencyType = compound.data.isOral ? 'таблеток' : 'инъекций';
        compoundListHTML += `<li>${steroidName} ${esterName} - ${dosage}${doseType} x ${frequency} ${frequencyType}/неделю</li>`;
    });
    compoundListHTML += '</ul>';
    compoundListDiv.innerHTML = compoundListHTML;
    dashboard.appendChild(compoundListDiv);

  // Create a div for the progress wheel chart
  const progressChartDiv = document.createElement('div');
  progressChartDiv.className = 'dashboard-item';
  dashboard.appendChild(progressChartDiv);
  
  // Get the total duration in days
    const totalCycleDays = Math.ceil((lastDay - firstDay) / (1000 * 60 * 60 * 24));

  // Calculate the elapsed days
  const elapsedDays = Math.ceil((new Date() - firstDay) / (1000 * 60 * 60 * 24));
  
  // Calculate the progress percentage
  const progressPercentage = Math.min(100, Math.max(0, (elapsedDays / totalCycleDays) * 100));

  // Create the SVG for the progress wheel
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "150");
  svg.setAttribute("height", "150");
  svg.setAttribute("viewBox", "0 0 100 100");
  
  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", "50");
  circle.setAttribute("cy", "50");
  circle.setAttribute("r", "45");
  circle.setAttribute("fill", "none");
  circle.setAttribute("stroke", "var(--border)");
  circle.setAttribute("stroke-width", "10");
  svg.appendChild(circle);
  
  const progressCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  progressCircle.setAttribute("cx", "50");
  progressCircle.setAttribute("cy", "50");
  progressCircle.setAttribute("r", "45");
  progressCircle.setAttribute("fill", "none");
  progressCircle.setAttribute("stroke", "var(--primary)");
  progressCircle.setAttribute("stroke-width", "10");
  progressCircle.setAttribute("stroke-dasharray", 283);
  progressCircle.setAttribute("stroke-dashoffset", 283 - (283 * progressPercentage / 100));
  progressCircle.setAttribute("transform", "rotate(-90 50 50)");
  progressCircle.style.transition = 'stroke-dashoffset 0.5s ease-out';
  
  svg.appendChild(progressCircle);

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", "50");
    text.setAttribute("y", "55");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-size", "18");
    text.setAttribute("font-weight", "bold");
    text.setAttribute("fill", "var(--text)");
    text.textContent = `${progressPercentage.toFixed(0)}%`;
    svg.appendChild(text);

  progressChartDiv.appendChild(svg);

  const progressText = document.createElement('p');
  progressText.textContent = `Прогресс курса`;
  progressText.style.textAlign = 'center';
  progressChartDiv.appendChild(progressText);
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  document.querySelectorAll('.tab-button').forEach(button => {
    button.classList.remove('active');
  });
  
  document.getElementById(`${tabName}-tab`).classList.add('active');
  document.querySelector(`.tab-button[onclick="switchTab('${tabName}')"]`).classList.add('active');
  
  // Adjust display period container visibility
  const displayPeriodContainer = document.querySelector('.display-period-container');
  if (displayPeriodContainer) {
    displayPeriodContainer.classList.toggle('active', tabName === 'graph');
  }
  
  if (tabName === 'graph') {
    setTimeout(() => {
      calculateAndDraw();
    }, 100);
  } else if (tabName === 'dashboard') {
    updateDashboard();
  } else if (tabName === 'tests') {
    updateTestList();
  }
}

function saveCycleAs() {
  const cycleName = prompt('Введите название для сохранения курса:');
  if (!cycleName) return;
  
  const savedCycles = JSON.parse(localStorage.getItem('savedCycles') || '{}');
  savedCycles[cycleName] = {
    compounds: activeCompounds,
    displaySettings: {
      period: document.getElementById('displayPeriod').value
    },
    savedAt: new Date().toISOString()
  };
  
  localStorage.setItem('savedCycles', JSON.stringify(savedCycles));
  
  const saveConfirm = document.createElement('div');
  saveConfirm.className = 'save-confirmation';
  saveConfirm.textContent = `Курс "${cycleName}" успешно сохранен`;
  document.body.appendChild(saveConfirm);
  
  setTimeout(() => {
    saveConfirm.remove();
  }, 2000);
}

function loadSavedCycle(cycleName) {
  const savedCycles = JSON.parse(localStorage.getItem('savedCycles') || '{}');
  const cycle = savedCycles[cycleName];
  
  if (cycle) {
    activeCompounds = cycle.compounds.map(compound => ({
      ...compound,
      startDate: new Date(compound.startDate)
    }));
    
    if (cycle.displaySettings?.period) {
      document.getElementById('displayPeriod').value = cycle.displaySettings.period;
    }
    
    updateCompoundsList();
    calculateAndDraw();
  }
}

function updateSavedCyclesList() {
  const savedCycles = JSON.parse(localStorage.getItem('savedCycles') || '{}');
  const list = document.getElementById('savedCyclesList');
  
  if (!list) return;
  
  list.innerHTML = '';
  
  Object.entries(savedCycles).forEach(([name, cycle]) => {
    const div = document.createElement('div');
    div.className = 'saved-cycle';
    const date = new Date(cycle.savedAt).toLocaleDateString();
    
    div.innerHTML = `
      <h4>${name}</h4>
      <p>Сохранено: ${date}</p>
      <div class="cycle-buttons">
        <button onclick="loadSavedCycle('${name}')">Загрузить</button>
        <button onclick="deleteSavedCycle('${name}')">Удалить</button>
      </div>
    `;
    list.appendChild(div);
  });
}

function deleteSavedCycle(cycleName) {
  if (!confirm(`Удалить сохраненный курс "${cycleName}"?`)) return;
  
  const savedCycles = JSON.parse(localStorage.getItem('savedCycles') || '{}');
  delete savedCycles[cycleName];
  localStorage.setItem('savedCycles', JSON.stringify(savedCycles));
  updateSavedCyclesList();
}

function clearChart() {
  if (chart) {
    chart.destroy();
    chart = null;
  }
}

function clearCalendar() {
  const calendar = document.getElementById('calendar');
  calendar.innerHTML = '';
}

function detectDevice() {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
  document.body.classList.toggle('mobile-device', isMobile);
  document.body.classList.toggle('desktop-device', !isMobile);
  
  // Adjust theme switcher position for mobile
  const themeSwitcher = document.querySelector('.theme-switcher');
  if (themeSwitcher) {
    themeSwitcher.style.position = isMobile ? 'relative' : 'fixed';
    themeSwitcher.style.top = isMobile ? '0' : '20px';
    themeSwitcher.style.right = isMobile ? '0' : '20px';
    themeSwitcher.style.margin = isMobile ? '1rem 0' : '0';
  }
  
  return isMobile;
}

function updateInterface() {
  const isMobile = detectDevice();
  
  // Adjust chart height based on device
  const chartContainer = document.querySelector('.chart-container');
  if (chartContainer) {
    chartContainer.style.height = isMobile ? '300px' : '500px';
  }
  
  // Adjust calendar layout
  const calendar = document.querySelector('.calendar');
  if (calendar) {
    calendar.style.gridTemplateColumns = isMobile ? '1fr' : 'repeat(auto-fill, minmax(250px, 1fr))';
  }
  
  // Adjust dialog width
  const dialog = document.getElementById('add-compound-dialog');
  if (dialog) {
    dialog.style.width = isMobile ? '90%' : 'auto';
    dialog.style.maxWidth = isMobile ? '100%' : '500px';
  }

  // Adjust tabs layout
  const tabButtons = document.querySelector('.tab-buttons');
  if (tabButtons) {
    tabButtons.classList.toggle('mobile-tabs', isMobile);
  }
}

window.addEventListener('resize', updateInterface);

const testReferenceValues = {
    'ЛГ': { unit: 'мЕд/мл', range: '1.7 - 8.6' },
    'Тестостерон общий': { unit: 'нг/дл', range: '249 - 836' },
    'Эстрадиол': { unit: 'пг/мл', range: '11 - 43' },
    'ГСПГ': { unit: 'нмоль/л', range: '13 - 71' },
    'Пролактин': { unit: 'нг/мл', range: '2.1 - 17.7' },
    'Билирубин общий': { unit: 'мкмоль/л', range: '3.4 - 20.5' },
    'АЛТ': { unit: 'Ед/л', range: '0 - 41' },
    'АСТ': { unit: 'Ед/л', range: '0 - 40' }
};

function addTestResult() {
    const testName = document.getElementById('test-name').value;
    const result = parseFloat(document.getElementById('test-result').value);
    const testDate = new Date(document.getElementById('test-date').value);

    if (!testName || isNaN(result)) return;

    const testData = testReferenceValues[testName];
    if (!testData) return;

    const newTest = {
        name: testName,
        result: result,
        date: testDate,
        unit: testData.unit,
        range: testData.range
    };

    medicalTests.push(newTest);
    updateTestList();
    saveToLocalStorage();
}

function toggleTheme() {
  const body = document.body;
  const currentTheme = body.classList.contains('theme-dark') ? 'theme-dark' : 'theme-light';
  const newTheme = currentTheme === 'theme-dark' ? 'theme-light' : 'theme-dark';
  
  body.classList.remove(currentTheme);
  body.classList.add(newTheme);
  
  localStorage.setItem('theme', newTheme);
}

let currentDesign = 'modern'; // Options: 'modern', 'minimal', 'classic'

function toggleDesign() {
  const designs = ['modern', 'minimal', 'classic'];
  const currentIndex = designs.indexOf(currentDesign);
  const nextIndex = (currentIndex + 1) % designs.length;
  currentDesign = designs[nextIndex];
  
  document.body.classList.remove(...designs.map(d => `design-${d}`));
  document.body.classList.add(`design-${currentDesign}`);
  
  localStorage.setItem('design', currentDesign);
  
  // Show confirmation
  const designConfirm = document.createElement('div');
  designConfirm.className = 'save-confirmation';
  designConfirm.textContent = `Дизайн изменен на ${getDesignName(currentDesign)}`;
  document.body.appendChild(designConfirm);
  
  setTimeout(() => {
    designConfirm.remove();
  }, 2000);
}

function getDesignName(design) {
  const names = {
    'modern': 'Современный',
    'minimal': 'Минималистичный',
    'classic': 'Классический'
  };
  return names[design] || design;
}

function updateTestList() {
    const list = document.getElementById('medical-test-results');
    if (!list) return;
    list.innerHTML = '';

    medicalTests.forEach((test, index) => {
        const div = document.createElement('div');
        div.className = 'active-compound';

        const comparison = compareToRange(test.result, test.range);
          
      let statusDisplay = '';
      let resultStyle = '';
      
        if (comparison === 'high') {
            statusDisplay = '↑';
          resultStyle = 'high';
        } else if (comparison === 'low') {
          statusDisplay = '↓';
           resultStyle = 'low';
        }
    
        div.innerHTML = `
          <h4>${test.name}</h4>
          <div class="test-result-container ${resultStyle}">
               <p>Результат: ${test.result} ${test.unit} </p>
              <span>${statusDisplay}</span>
          </div>
           <p>Референсные значения: ${test.range}</p>
          <p>Дата: ${test.date.toLocaleDateString()}</p>
          <div class="edit-buttons">
          <button class="delete-button" onclick="removeTest(${index})">Удалить</button>
          </div>
        `;
        list.appendChild(div);
    });
    drawTestChart();
    updateAnastrozoleDoseAdvice();
}

function compareToRange(result, range) {
      const [min, max] = range.split(' - ').map(Number);
    if (isNaN(min) || isNaN(max)) return 'normal'
    if (result > max) return 'high';
      if (result < min) return 'low';
  return 'normal';
}

function removeTest(index) {
  medicalTests.splice(index, 1);
  updateTestList();
  saveToLocalStorage();
}

function drawTestChart() {
    const ctx = document.getElementById('testChart').getContext('2d');
    if (!medicalTests || medicalTests.length < 2) {
      clearTestChart();
      return;
    }
  
    const testNames = Array.from(new Set(medicalTests.map(test => test.name)));
    const datasets = [];
  
  testNames.forEach(testName => {
      const testData = medicalTests.filter(test => test.name === testName).sort((a,b) => a.date - b.date);
      
      if(testData.length < 2) return;
      
      const chartData = testData.map(test => ({
        /*  x: test.date.getTime(), */
         x: test.date,
         y: test.result
      }));

     datasets.push({
        label: testName,
          data: chartData,
        borderColor: getRandomColor(),
          backgroundColor: getRandomColor(),
         fill: false,
           tension: 0.4,
         pointRadius: 5
       });
   });

   if (chart) {
    chart.destroy();
  }

   chart = new Chart(ctx, {
    type: 'line',
    data: { datasets },
    options: {
        responsive: true,
        maintainAspectRatio: false,
         scales: {
          x: {
            type: 'time',
            time: {
              unit: 'day',
              displayFormats: {
                day: 'MMM dd'
              }
             },
           title: { display: true, text: 'Дата' }
          },
        y: {
           title: { display: true, text: 'Результат' },
           beginAtZero: true
          }
         }
      }
    });
}

function clearTestChart() {
   const ctx = document.getElementById('testChart').getContext('2d');
  if (chart) {
        chart.destroy();
        chart = null;
        ctx.clearRect(0,0, ctx.canvas.width, ctx.canvas.height)
    }
}

function getRandomColor() {
  const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);
  return `rgba(${r}, ${g}, ${b}, 0.8)`;
}

function isValidCompound(compound) {
  return compound && 
         compound.compound && 
         compound.ester && 
         STEROID_DATA[compound.compound]?.esters[compound.ester];
}

function saveToLocalStorage() {
  const dataToSave = {
    compounds: activeCompounds,
    medicalTests: medicalTests,
    displaySettings: {
      period: document.getElementById('displayPeriod').value
    }
  };
  localStorage.setItem('steroidCycle', JSON.stringify(dataToSave));
}

function loadFromLocalStorage() {
  const saved = localStorage.getItem('steroidCycle');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      if (data.compounds) {
        activeCompounds = data.compounds.map(compound => {
          if (!compound || !compound.compound || !compound.ester) {
            return null;
          }
          
          const steroidData = STEROID_DATA[compound.compound];
          const esterData = steroidData?.esters[compound.ester];
          
          if (!steroidData || !esterData) {
            return null;
          }
          
          return {
            ...compound,
            startDate: new Date(compound.startDate),
            data: esterData
          };
        }).filter(compound => compound !== null); 
      } else {
        activeCompounds = [];
      }
        
       if(data.medicalTests) {
           medicalTests = data.medicalTests.map(test => ({
            ...test,
               date: new Date(test.date)
           }));
        } else {
            medicalTests = [];
       }
      
      if (data.displaySettings) {
        const displayPeriod = document.getElementById('displayPeriod');
        if (displayPeriod && data.displaySettings.period) {
          displayPeriod.value = data.displaySettings.period;
        }
      }
      
      updateCompoundsList();
      calculateAndDraw();
        updateTestList();
    } catch (error) {
      console.error('Error loading saved data:', error);
      activeCompounds = [];
        medicalTests = [];
      localStorage.removeItem('steroidCycle');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    updateEsters();
    loadFromLocalStorage();
    updateSavedCyclesList();
    updateDashboard();
    updateInterface();
    const startDateInput = document.getElementById('startDate');
    if (startDateInput) {
      startDateInput.valueAsDate = new Date();
    }
      
      const testDateInput = document.getElementById('test-date');
      if(testDateInput) {
          testDateInput.valueAsDate = new Date();
      }
    switchTab('compounds');
    
    // Set initial theme
    const savedTheme = localStorage.getItem('theme') || 'theme-light';
    document.body.classList.add(savedTheme);

    const displayPeriodSelects = document.querySelectorAll('#displayPeriod');
    displayPeriodSelects.forEach(select => {
      select.addEventListener('change', () => {
        displayPeriodSelects.forEach(otherSelect => {
          otherSelect.value = select.value;
        });
        calculateAndDraw();
      });
    });
    
    // Set initial design
    const savedDesign = localStorage.getItem('design') || 'modern';
    document.body.classList.add(`design-${savedDesign}`);
    currentDesign = savedDesign;
  } catch (error) {
    console.error('Error during initialization:', error);
  }
});

function exportCalendar() {
  // Create calendar data in iCal format
  let iCalData = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SteroidCalc//RU',
    'CALSCALE:GREGORIAN'
  ];

  activeCompounds.forEach(compound => {
    const steroidName = STEROID_DATA[compound.compound].name;
    const esterName = compound.data.name;
    const dosage = compound.dosage;
    const unit = compound.data.isIU ? 'ME' : 'мг';
    
    // Calculate injection dates based on frequency
    const daysInterval = 7 / compound.frequency;
    const endDate = new Date(compound.startDate);
    endDate.setDate(endDate.getDate() + (compound.duration * 7));
    
    let currentDate = new Date(compound.startDate);
    
    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const endDateString = new Date(currentDate.getTime() + (30 * 60000))
        .toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      
      iCalData.push(
        'BEGIN:VEVENT',
        `DTSTART:${dateString}`,
        `DTEND:${endDateString}`,
        `SUMMARY:${steroidName} ${esterName} ${dosage}${unit}`,
        `DESCRIPTION:Прием ${steroidName} ${esterName} в дозировке ${dosage}${unit}`,
        'END:VEVENT'
      );
      
      // Move to next injection date
      currentDate.setDate(currentDate.getDate() + daysInterval);
    }
  });

  iCalData.push('END:VCALENDAR');

  // Create and download file
  const blob = new Blob([iCalData.join('\r\n')], { type: 'text/calendar' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'steroid-calendar.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  
  // Show confirmation
  const saveConfirm = document.createElement('div');
  saveConfirm.className = 'save-confirmation';
  saveConfirm.textContent = 'Календарь успешно экспортирован';
  document.body.appendChild(saveConfirm);
  
  setTimeout(() => {
    saveConfirm.remove();
  }, 2000);
}

function updateAnastrozoleDoseAdvice() {
    const estradioTest = medicalTests.find(test => test.name === 'Эстрадиол');
    const adviceDiv = document.getElementById('anastrozole-advice');
    
    if(!adviceDiv) return;

    if (!estradioTest) {
        adviceDiv.textContent = 'Нет данных об уровне эстрадиола.';
        return;
    }
    
    const estradioLevel = estradioTest.result;
    const range = testReferenceValues['Эстрадиол'].range.split(' - ').map(Number);
    const min = range[0];
    const max = range[1];
    let advice = '';

    if (estradioLevel < min) {
        advice = 'Уровень эстрадиола низ! Рассмотрите возможность снижения дозы анастрозола или его отмены.';
    } else if (estradioLevel > max * 1.3) {
        advice = `Уровень эстрадиола значительно повышен (${estradioLevel} пг/мл). Рассмотрите увеличение дозы анастрозола.`;
    } else if(estradioLevel > max) {
        advice = `Уровень эстрадиола повышен (${estradioLevel} пг/мл). Рассмотрите увеличение дозы анастрозола.`;
    }else{
        advice = `Уровень эстрадиола в норме (${estradioLevel} пг/мл). Продолжайте прием анастрозола в текущей дозе.`;
    }

    adviceDiv.textContent = advice;
}

function exportAnalytics() {
  // Generate analytics report
  const report = generateAnalyticsReport();
  
  // Create and download file
  const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'steroid-cycle-analytics.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  
  // Show confirmation
  const saveConfirm = document.createElement('div');
  saveConfirm.className = 'save-confirmation';
  saveConfirm.textContent = 'Аналитика успешно экспортирована';
  document.body.appendChild(saveConfirm);
  
  setTimeout(() => {
    saveConfirm.remove();
  }, 2000);
}

function generateAnalyticsReport() {
  let report = 'АНАЛИТИКА СТЕРОИДНОГО ЦИКЛА\n';
  report += '========================\n\n';
  
  // Basic cycle info
  const firstDay = new Date(Math.min(...activeCompounds.map(c => c.startDate.getTime())));
  const lastDay = new Date(Math.max(...activeCompounds.map(c => {
    const endDate = new Date(c.startDate);
    endDate.setDate(c.startDate.getDate() + c.duration * 7);
    return endDate.getTime();
  })));
  
  const daysOnCycle = Math.ceil((lastDay - firstDay) / (1000 * 60 * 60 * 24));
  
  report += `Дата начала: ${firstDay.toLocaleDateString()}\n`;
  report += `Дата окончания: ${lastDay.toLocaleDateString()}\n`;
  report += `Общая длительность: ${daysOnCycle} дней (${Math.ceil(daysOnCycle/7)} недель)\n\n`;
  
  // Compounds analysis
  report += 'ИСПОЛЬЗУЕМЫЕ ПРЕПАРАТЫ\n';
  report += '=====================\n\n';
  
  activeCompounds.forEach(compound => {
    const steroidName = STEROID_DATA[compound.compound].name;
    const esterName = compound.data.name;
    const dosage = compound.dosage;
    const frequency = compound.frequency;
    const doseType = compound.data.isIU ? 'ME' : 'мг';
    const weeklyDose = dosage * frequency;
    const totalDose = weeklyDose * compound.duration;
    
    report += `Препарат: ${steroidName} ${esterName}\n`;
    report += `Дозировка: ${dosage}${doseType} ${frequency} раз в неделю\n`;
    report += `Недельная доза: ${weeklyDose}${doseType}\n`;
    report += `Общая доза за курс: ${totalDose}${doseType}\n`;
    report += `Длительность приема: ${compound.duration} недель\n`;
    report += `Период полувыведения: ${compound.data.halfLife} дней\n`;
    report += '------------------------\n\n';
  });
  
  // Medical tests analysis
  if (medicalTests.length > 0) {
    report += 'МЕДИЦИНСКИЕ ТЕСТЫ\n';
    report += '=================\n\n';
    
    const testsByType = {};
    medicalTests.forEach(test => {
      if (!testsByType[test.name]) {
        testsByType[test.name] = [];
      }
      testsByType[test.name].push(test);
    });
    
    Object.entries(testsByType).forEach(([testName, tests]) => {
      const sortedTests = tests.sort((a, b) => a.date - b.date);
      report += `${testName}:\n`;
      
      sortedTests.forEach(test => {
        const status = compareToRange(test.result, test.range);
        let statusText = '';
        if (status === 'high') statusText = '↑ Повышен';
        else if (status === 'low') statusText = '↓ Понижен';
        else statusText = '✓ Норма';
        
        report += `  ${test.date.toLocaleDateString()}: ${test.result} ${test.unit} (${statusText})\n`;
      });
      
      report += '\n';
    });
  }
  
  return report;
}