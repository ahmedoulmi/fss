let button = document.querySelector('div[class="container-button"]');

let quoteDatabase = [
  "V: In Night City, you can be anyone you want to be.",
  "Johnny Silverhand: Wake the fuck up, Samurai. We have a city to burn.",
  "Regina Jones: Life's unpredictable. We can't always control what happens, but we can control how we respond.",
  "Takemura: In the world of Cyberpunk, few things are ever what they seem.",
  "Judy Alvarez: Sometimes it seems like the city's just one big, fat rat, devouring other rats born and bred to be devoured.",
];

let generateQuote = () => {
  let randomQuote = Math.floor(Math.random() * 5);
  let quote = quoteDatabase[randomQuote];
  let quoteBox = document.querySelector(".quote");
  quoteBox.firstElementChild.innerText = quote;
};

button.addEventListener("click", generateQuote);
