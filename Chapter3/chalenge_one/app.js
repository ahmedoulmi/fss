//challenge1
let message = "There is no war in Ba Sing Se";
function challenge_one(message) {
  return message.length;
}
console.log(challenge_one(message));
//challenge2
let countries = ["China", "Japan", "South Korea", "Vietnam", "Malaysia"];
let capital = ["Beijing", "Tokyo", "Seoul", "Hanoï", "Kuala Lumpur"];
function challenge_two(countries) {
  return (
    "Your country : " +
    countries +
    " has the capital named :" +
    capital[countries.indexOf("China")]
  );
}
console.log(challenge_two("China"));
//challenge3

let randomizer;
if (randomizer == 0) {
  console.log("A certain victory");
} else {
  if (randomizer == 1) {
    console.log("not so certain victory");
  } else {
    if (randomizer == 2) {
      console.log("an uneasy victory");
    } else {
      console.log("Your fate is unclear, ô chosen undead");
    }
  }
}
