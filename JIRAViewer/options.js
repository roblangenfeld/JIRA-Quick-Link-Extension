
function JIRAServer(data) {
  'use strict';

  var jira_servers = document.getElementById('jira_servers').getElementsByTagName('tbody')[0];
  this.node = document.getElementById('jira-server-template').cloneNode(true);
  var jira_server_id = (JIRAServer.next_id++);
  this.node.id = 'jira-server' + jira_server_id;
  this.node.jira_server = this;
  if(jira_server_id%2==1){
      this.node.className="alt";
  }
  jira_servers.appendChild(this.node);
  this.node.hidden = false;

  var tags;
  if (data) {
    this.getElement('jira-url').value = data.jira_url;
    this.getElement('jira-project').value = data.jira_project;
    this.getElement('jira-user').value = data.jira_user
    tags = data.jira_tags;
  }

  var selector = this.getElement('jira-selector');
  selector.id = selector.id + jira_server_id;
  if(data && data.jira_url){
    loadStatuses(data.jira_url, selector.id, tags);
  }
  //this.render();

  this.getElement('jira-url').onkeyup = storeRules;
  this.getElement('jira-project').onkeyup = storeRules;
  this.getElement('jira-user').onkeyup = storeRules;

  $(selector).change(function () {
    storeRules();
  });

  var jira_server = this;
  this.getElement('remove').onclick = function () {
    jira_server.node.parentNode.removeChild(jira_server.node);
    storeRules();
  };

  this.getElement('refresh-tags').onclick = function () {
    loadStatuses(jira_server.getElement('jira-url').value, selector.id, $('#' + selector.id).val());
  };

}

JIRAServer.prototype.getElement = function (name) {
  return document.querySelector('#' + this.node.id + ' .' + name);
}

JIRAServer.prototype.render = function () {}

JIRAServer.next_id = 0;

function loadJIRAs() {
  var jira_servers = localStorage.jira_servers;
  try {
    JSON.parse(jira_servers).forEach(function (jira_server) {
      new JIRAServer(jira_server);
    });
  } catch (e) {
    localStorage.jira_servers = JSON.stringify([]);
  }
}

function storeRules() {
  localStorage.jira_servers = JSON.stringify(Array.prototype.slice.apply(
        //document.getElementById('jira_servers').rows).map(function (node) {
        $('#jira_servers tr').not('thead tr, tfoot tr')).map(function (node) {
        //node.jira_server.render();
        if(node.jira_server){
            return {
              jira_url: node.jira_server.getElement('jira-url').value,
              jira_project: node.jira_server.getElement('jira-project').value,
              jira_user: node.jira_server.getElement('jira-user').value,
              jira_tags: $('#' + node.jira_server.getElement('jira-selector').id).val()
            };
        }
      }));
}

function loadStatuses(jira_url, selectorID, previouslySelected) {
  //TODO: Cache these values when we load them initially and only update if there are new values.
  //See if this can be done in a background thread.
  var url = jira_url + '/rest/api/2/status',
  x = new XMLHttpRequest();

  x.open('GET', url);
  x.responseType = 'json';
  x.onload = function () {
    // Parse and process the response
    var response = x.response;
    if (!response || response.length === 0) {
      //errorCallback('No response from ' + searchUrl);
      return;
    }
    parseJIRAStatuses(response, selectorID, previouslySelected);
  };
  x.onerror = function () {
    errorCallback('Network error.');
  };
  x.send();
}

function parseJIRAStatuses(statuses, selectorID, previouslySelected) {
  'use strict';

  var select = document.getElementById(selectorID);
  //First nuke the previous options
  while (select.hasChildNodes()) {
    select.removeChild(select.lastChild);
  }
  //Repopulate and rebuild the list
  if(select.children.length == 0){
    $('#' + selectorID).multiselect({
      numberDisplayed: 0,
      includeSelectAllOption: true,
      nonSelectedText: 'Select JIRA Tags!'
    });
  }
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
    for (var i = 0; i < previouslySelected.length; i++) {
      $('#' + selectorID).multiselect('select', previouslySelected[i]);
    }
  }

}

window.onload = function () {
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
