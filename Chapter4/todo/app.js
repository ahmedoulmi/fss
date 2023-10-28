const Context = document.querySelectorAll(".context");
const submit = document.querySelectorAll(".submit");

const submitTodo = () => {
  if (input.value === "") {
    return;
  }

  Context.innerHTML += `
    <div class="card">
          <div class="left"><h1>${input.value}</h1></div>
          <div class="right">
            <button class="del">DELETE</button>
            <button class="edit">EDIT</button>
          </div>
        </div>
        `;
};
submit.addEventListener("click", submitTodo);
