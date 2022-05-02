class JIRAServer {
  static next_id = 0;
  static {
    const current = JSON.parse(localStorage.getItem('jira_servers')).map(j => j.id);
    current.sort();
    JIRAServer.next_id = (current[current.length - 1]++) || 0;
  }
  
  constructor(data) {
    if (document.getElementById('jira_servers')) {
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
        this.getElement('jira-url').value = data.url;
        this.getElement('jira-project').value = data.project;
        this.getElement('jira-user').value = data.user
        tags = data.tags;
        this.issues = data.issues;
      }
  
      var selector = this.getElement('jira-selector');
      selector.id = selector.id + jira_server_id;
      if(data && data.url){
        loadStatuses(data.url, selector.id, tags);
      }
  
      this.getElement('jira-url').onkeyup = this.storeServer;
      this.getElement('jira-project').onkeyup = this.storeServer;
      this.getElement('jira-user').onkeyup = this.storeServer;
  
      $(selector).change(() => {
        this.storeServer();
      });
  
      var jira_server = this;
      this.getElement('remove').onclick = function () {
        jira_server.node.parentNode.removeChild(jira_server.node);
        storeRules();
      };
  
      this.getElement('refresh-tags').onclick = function () {
        loadStatuses(jira_server.getElement('jira-url').value, selector.id, $('#' + selector.id).val());
      };
      this.id = jira_server_id;
    } else {
      ({
        url: this.url,
        project: this.project,
        user: this.user,
        tags: this.tags,
        issues: this.issues,
        id: this.id,
      } = data);
      if (typeof this.id === 'undefined') this.id = JIRAServer.next_id++;
    }

    if (typeof this.issues === 'undefined') {
      this.issues = [];
    }
  }
  
  getElement(name) {
    return document.querySelector('#' + this.node.id + ' .' + name);
  }
  
  render() {}
  
  async loadIssues() {
    if (this.tags.length && this.url && this.user) {
      let searchUrl = this.url;
      let user = this.user;

      if (searchUrl === null || searchUrl.length === 0) {
        errorCallback('Please add a valid jira server in the options.');
        return;
      }
      
      if (user === null || user.length === 0) {
        errorCallback('Please specify a valid username in the options');
        return;
      }
      
      searchUrl = searchUrl + '/rest/api/2/search?jql=';
      if (this.project) {
        searchUrl += `project=${this.project}%20AND%20`;
      }
      if (!this.tags) {
        searchUrl += `assignee=${user}`;
      } else {
        searchUrl += `assignee=${user}%20AND%20status%20in%20(${this.tags.map((jiraTag) => `"${jiraTag}"`).join('%2C%20')})`;
      }
      
      let response;
      try {
        response = await fetch(searchUrl).then(d => d.json());
      } catch (e) {
        throw e;
      }
      
      if (!response || !response.issues || response.issues.length === 0) {
        errorCallback('No response from ' + searchUrl);
        return;
      }
      
      const { issues } = response;
      
      this.issues = this.organizeJIRAsByParent(issues);
      
      // make sure it updates the local storage so the updates get retained!
      this.storeServer();
    }
  }
  
  /**
   * Organizes the passed in jiras into a parent heirarchy where each jira is grouped under a parent.
   *
   * @param {object} jiras - The jiras to organize.
   *
   * @returns {Array.<JIRA>} An array of {@link JIRA} objects.
   */
  organizeJIRAsByParent(jiras) {
    const organizedJIRAList = [];
    jiras.forEach((jira) => {
      if (!jira.fields.parent) {
        if (isParentOrganized(organizedJIRAList, jira)) {
          return;
        }
        organizedJIRAList.push(new JIRA(jira));
      } else {
        let foundParent = false;
        organizedJIRAList.forEach((oJira) => {
          const oIsParent = oJira.id === jira.fields.parent.id;
          const oHasJira = oJira.getChildren().find(c => c.id === jira.id);
          if (oIsParent && !oHasJira) {
            oJira.addChild(new JIRA(jira));
            foundParent = true;
            return;
          }
        });
        if (!foundParent) {
          const parentJIRA = new JIRA(jira.fields.parent);
          parentJIRA.addChild(new JIRA(jira));
          organizedJIRAList.push(parentJIRA);
        }
      }
    });
    return organizedJIRAList;
  }
  
  storeServer() {
    let current = JSON.parse(localStorage.jira_servers);
    // add newest version
    if (this.node) {
      current.unshift({
        id: this.id,
        url: this.getElement('jira-url').value,
        project: this.getElement('jira-project').value,
        user: this.getElement('jira-user').value,
        tags: $('#' + this.node.jira_server.getElement('jira-selector').id).val(),
        issues: this.issues,
      });
    } else {
      current.unshift({
        id: this.id,
        url: this.url,
        project: this.project,
        user: this.user,
        tags: this.tags,
        issues: this.issues,
      });
    }
    const ids = current.map(j => j.id);
    const removed_ids = [];
    current = current.map(j => {
      if (removed_ids.includes(j.id)) {
        return undefined;
      } else {
        removed_ids.push(j.id);
        return j;
      }
    });
    current = current.filter(s => s && s.url);
    localStorage.jira_servers = JSON.stringify(current);
  }
}

/**
 * Iterates through the organizedJIRAList to see if the passed in JIRA is in the list.
 *
 * @param {Array.<JIRA>} organizedJIRAList - An array of {@link JIRA} to search through.
 * @param {object} jira - The jira to look for.
 *
 * @returns {boolean} True if found, false if not.
 */
function isParentOrganized(organizedJIRAList, jira) {
  return organizedJIRAList.find(e => e.id === jira.id);
}
