function rotate(text) {
  text = text.split("");
  let array = [];
  for (let i = 0; i < text.length; i++) {
    text.push(text.shift());
    array.push(text.join(""));
  }
  return array;
}
console.log(rotate("hello"));
