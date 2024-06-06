let main = async () => {
  let data = await (
    await fetch("https://api.jsonbin.io/v3/b/629f9937402a5b38021f6b38")
  ).json();

  const background_color = [51, 51, 51];
  const game_color = [64, 87, 93];

  const hit_color = [34, 187, 34];
  const partial_color = [187, 136, 34];
  const base_color = [51, 51, 51];
  const miss_color = [34, 34, 34];

  const key_base_color = [51, 51, 51];
  const key_hit_color = [34, 187, 34];
  const key_partial_color = [187, 136, 34];
  const key_miss_color = [34, 34, 34];

  const success_color = [34, 187, 127];
  const fail_color = [187, 34, 34];

  const answers = data.record.answers;
  const allowed = data.record.allowed;
  const rows = document.querySelectorAll(".guess");
  const keys = document.querySelectorAll(".key");
  const background = document.getElementById("game");
  background.style.backgroundColor = `rgb(${game_color.join(",")})`;
  document.body.style.backgroundColor = `rgb(${background_color.join(",")})`;
  document.getElementById(
    "keyboard"
  ).style.backgroundColor = `rgb(${game_color.join(",")})`;
  let current_word = Math.floor(Math.random() * answers.length);

  let guess_index = 0;
  let word_index = 0;

  let known_letters = {};
  let known_hits = ["", "", "", "", ""];

  let game_running = false;

  let parse_color = (color) => {
    return color
      .substring(4, color.length - 1)
      .split(", ")
      .map((value) => {
        return parseInt(value);
      });
  };

  let transition_color = (element, color) => {
    let original_color = parse_color(element.style.backgroundColor);
    let interp_max = 25;
    let interp_index = 0;
    let interp_color = color;

    let interpolate_animate = () => {
      interp_index = interp_index + 1;
      if (interp_index === interp_max) {
        element.style.backgroundColor = `rgb(${interp_color})`;
        return;
      }
      let color = original_color.map((value, index) => {
        return Math.floor(
          value + (interp_color[index] - value) * (interp_index / interp_max)
        );
      });
      element.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
      requestAnimationFrame(interpolate_animate);
    };

    interpolate_animate();
  };

  let flash_color = (element, color, original_color, frames) => {
    let interp_max = frames;
    let interp_index = frames;
    let interp_color = color;

    let interpolate_animate = () => {
      interp_index = interp_index - 1;
      if (interp_index === 0) {
        interp_color = original_color.join(",");
        element.style.backgroundColor = `rgb(${original_color})`;
        return;
      }
      let color = original_color.map((value, index) => {
        return Math.floor(
          value + (interp_color[index] - value) * (interp_index / interp_max)
        );
      });
      element.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
      requestAnimationFrame(interpolate_animate);
    };

    interpolate_animate();
  };

  let clear_board = (animate = true) => {
    game_running = false;
    known_letters = {};
    known_hits = ["", "", "", "", ""];
    let row = 5;
    let col = 4;
    let key = 29;
    let step = () => {
      if (key >= 0) {
        let keyboard_key = keys[key];
        key--;
        if (!keyboard_key.classList.contains("key-blank")) {
          transition_color(keyboard_key, key_base_color);
        } else {
          transition_color(keyboard_key, game_color);
        }
      } else if (row >= 0) {
        let tile = rows[row].children[col];
        if (col > 0) {
          col--;
        } else {
          row--;
          col = 4;
        }
        transition_color(tile, base_color);
        tile.children[0].textContent = "";
        tile.children[1].style.backgroundColor = "transparent";
      } else {
        game_running = true;
        return;
      }
      if (animate) {
        requestAnimationFrame(step);
      } else {
        step();
      }
    };
    step();
    guess_index = 0;
    word_index = 0;
    console.log(answers[current_word]);
  };
  clear_board(false);

  let make_guess = (word) => {
    let dummy = answers[current_word].split("");
    word = word.split("");

    result = ["0", "0", "0", "0", "0"];
    for (let i = 0; i < 5; i++) {
      if (word[i] === dummy[i]) {
        dummy[i] = "_";
        word[i] = ".";
        result[i] = "2";
      }
    }
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        if (word[i] === dummy[j]) {
          dummy[j] = "_";
          word[i] = ".";
          result[i] = "1";
        }
      }
    }
    return result.join("");
  };

  let submit_guess = () => {
    let guess = "";
    let tiles = rows[guess_index].children;
    for (let i = 0; i < tiles.length; i++) {
      guess += tiles[i].children[0].textContent;
    }

    let valid = false;
    for (let i = 0; i < allowed.length; i++) {
      if (allowed[i] === guess) {
        valid = true;
        break;
      }
    }
    if (!valid) {
      for (let i = 0; i < answers.length; i++) {
        if (answers[i] === guess) {
          valid = true;
          break;
        }
      }
      if (!valid) {
        flash_color(background, fail_color, game_color, 25);
        return false;
      }
    }

    let result = make_guess(guess);
    if (result === "22222") {
      flash_color(background, success_color, game_color, 100);
      current_word = (current_word + 1) % answers.length;
      clear_board();
      return false;
    } else {
      for (let i = 0; i < 5; i++) {
        let tile = rows[guess_index].children[i];
        let keyboard_key = document.getElementById("key-" + guess[i]);
        if (known_letters[guess[i]] === undefined) {
          known_letters[guess[i]] = {
            hits: [false, false, false, false, false],
            partials: [false, false, false, false, false],
            misses: 5,
          };
        }
        if (result[i] === "1") {
          known_letters[guess[i]].partials[i] = true;
          tile.classList.add("partial");
          transition_color(tile, partial_color);
          if (!keyboard_key.classList.contains("key-hit")) {
            keyboard_key.classList.add("key-partial");
            transition_color(keyboard_key, key_partial_color);
          }
        } else if (result[i] === "2") {
          known_letters[guess[i]].hits[i] = true;
          known_hits[i] = guess[i];
          tile.classList.add("hit");
          transition_color(tile, hit_color);
          if (keyboard_key.classList.contains("key-partial")) {
            keyboard_key.classList.remove("key-partial");
          }
          keyboard_key.classList.add("key-hit");
          transition_color(keyboard_key, key_hit_color);
        } else {
          let allowed = 0;
          for (let j = 0; j < 5; j++) {
            if (guess[j] === guess[i] && result[j] !== "0") {
              allowed++;
            }
          }
          known_letters[guess[i]].misses = allowed;
          tile.classList.add("miss");
          transition_color(tile, miss_color);
          if (
            !keyboard_key.classList.contains("key-partial") &&
            !keyboard_key.classList.contains("key-hit")
          ) {
            keyboard_key.classList.add("key-miss");
            transition_color(keyboard_key, key_miss_color);
          }
        }
      }
      return true;
    }
  };

  let handle_key = (key) => {
    if (!game_running) {
      return;
    }
    if (key === "Backspace") {
      word_index--;
      if (word_index <= 0) {
        word_index = 0;
      }
      let tile = rows[guess_index].children[word_index];
      tile.children[0].textContent = "";
      tile.children[1].style.backgroundColor = "transparent";
      tile.classList = ["tile"];
    } else if (key === "Enter") {
      if (word_index === 5) {
        if (submit_guess()) {
          for (let i = 0; i < 5; i++) {
            rows[guess_index].children[i].children[1].style.backgroundColor =
              "transparent";
          }
          guess_index++;
          word_index = 0;
        }
        if (guess_index === 6) {
          flash_color(background, fail_color, game_color, 100);
          clear_board();
        }
      }
    } else {
      if (
        key.length !== 1 ||
        "abcdefghijklmnopqrstuvwxyz".indexOf(key) === -1
      ) {
        return;
      }
      if (word_index >= 5) {
        return;
      }
      let tile = rows[guess_index].children[word_index];
      tile.children[0].textContent = key;
      if (known_letters[key] !== undefined) {
        let hl = tile.children[1];
        if (known_letters[key].hits[word_index]) {
          hl.style.backgroundColor = `rgb(${hit_color})`;
        } else if (
          (known_hits[word_index].length > 0 &&
            known_hits[word_index] !== key) ||
          known_letters[key].partials[word_index]
        ) {
          hl.style.backgroundColor = `rgb(${miss_color})`;
        } else {
          let valid = false;
          for (let i = 0; i < 5; i++) {
            if (i == word_index) {
              continue;
            }
            if (known_letters[key].partials[i]) {
              valid = true;
              break;
            }
          }

          let sum = 0;
          for (let i = 0; i < 5; i++) {
            if (known_letters[key].hits[i]) {
              sum++;
            }
          }
          if (valid) {
            if (sum <= known_letters[key].misses) {
              hl.style.backgroundColor = `rgb(${partial_color})`;
            } else {
              console.log(known_letters[key].misses);
              hl.style.backgroundColor = `rgb(${miss_color})`;
            }
          }
        }
      }
      word_index++;
    }
  };

  keys.forEach((key) => {
    let id = key.id.substring(4);
    if (id !== "") {
      key.addEventListener("click", () => {
        handle_key(id);
      });
    }
  });

  document.addEventListener("keydown", (event) => {
    handle_key(event.key);
  });
};
main();
