//Object class representing a JIRA.
function JIRA(data){
    this.data = data;
    this.children = [];
    this.parentJIRA;
}

JIRA.prototype.addChild = function addChild(childJIRA){
        this.children.push(childJIRA);
}

JIRA.prototype.getChildren = function getChildren(){
    return this.children;
}

JIRA.prototype.setParent = function setParent(parentJIRA){
    this.parentJIRA = parentJIRA;
}

JIRA.prototype.getParent = function getParent(){
    return this.parentJIRA;
}

JIRA.prototype.getData = function getData(){
    return this.data;
}
