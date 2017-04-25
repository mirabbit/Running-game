function User(opt) {
  var _default = {
    id: '',
    color: 'red',
    position: 0
  }
  opt = $.extend(_default, opt);
  this.id = opt.id;
  this.color = opt.color;
  this.position = opt.position
}

User.prototype.left = function() {

}

User.prototype.up = function() {

}
User.prototype.down = function() {

}
User.prototype.right = function() {

}