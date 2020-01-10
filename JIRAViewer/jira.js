// Object class representing a JIRA.
class JIRA {
  constructor(data) {
    this.data = data;
    this.children = [];
    this.parentJIRA;
    this.id = data.id;
  }
  
  addChild(childJIRA) {
    this.children.push(childJIRA);
  }
  
  getChildren() {
    return this.children;
  }
  
  setParent(parentJIRA) {
    this.parentJIRA = parentJIRA;
  }
  
  dataHasParent() {
    return this.data.fields.parent;
  }
  
  getParent() {
    return this.parentJIRA;
  }
  
  getData() {
    return this.data;
  }
}