'use strict';

function loadJIRAs() {
  const jira_servers = localStorage.jira_servers;
  try {
    JSON.parse(jira_servers).forEach(jira_server => new JIRAServer(jira_server));
  } catch (e) {
    localStorage.jira_servers = JSON.stringify([]);
  }
}

async function loadStatuses(jira_url, selectorID, previouslySelected) {
  // TODO: Cache these values when we load them initially and only update if there are new values.
  // See if this can be done in a background thread.
  try {
    const response = await fetch(`${jira_url}/rest/api/2/status`).then(d => d.json());
    parseJIRAStatuses(response, selectorID, previouslySelected);
  } catch(e) {
    console.error(e);
  }
}

function parseJIRAStatuses(statuses, selectorID, previouslySelected) {
  var select = document.getElementById(selectorID);
  // First nuke the previous options
  while (select.hasChildNodes()) {
    select.removeChild(select.lastChild);
  }
  // Repopulate and rebuild the list
  if(select.children.length == 0){
    $('#' + selectorID).multiselect({
      numberDisplayed: 0,
      includeSelectAllOption: true,
      nonSelectedText: 'Select JIRA Tags!'
    });
  }
  statuses.sort((a, b) => { 
    if (previouslySelected.includes(a.name) && !previouslySelected.includes(b.name)) {
      return -1;
    }
    if (previouslySelected.includes(b.name) && !previouslySelected.includes(a.name)) {
      return 1;
    }
    return a.name.localeCompare(b.name);
  });
  for (var i = 0; i < statuses.length; i++) {
    var opt = document.createElement('option');
    opt.value = statuses[i].name;
    opt.text = statuses[i].name;
    select.appendChild(opt);
  }

  $('#' + selectorID).multiselect('rebuild');
  $('#' + selectorID).multiselect('refresh');

  //If there is any previously selected, select them again.
  if (previouslySelected) {
    previouslySelected.forEach(str => $('#' + selectorID).multiselect('select', str))
  }
}

window.onload = function () {
  if (localStorage.darkMode === "true") {
    document.querySelector('body').classList.add('dark');
  }
  loadJIRAs();
  document.getElementById('new').onclick = function () {
    new JIRAServer();
  };
  //CSS Preference
  document.getElementById('darkmode').checked = localStorage.darkMode === "true";
  document.getElementById('darkmode').onclick = function () {
    localStorage.darkMode = document.getElementById('darkmode').checked;
  }
  //Subtask preference
  document.getElementById('show_assigned_subtasks').checked = localStorage.show_assigned_subtasks === "true";
  document.getElementById('show_assigned_subtasks').onclick = function () {
    localStorage.show_assigned_subtasks = document.getElementById('show_assigned_subtasks').checked;
  }
}
