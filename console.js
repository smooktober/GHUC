async function sleep(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

function generateRandomUsername(length) {
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  let username = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    username += characters[randomIndex];
  }
  return username;
}

async function checkUsernameAvailability(username) {
  const loginInput = document.querySelector('input[name="login"]');
  const submitButton = document.querySelector('button[type="submit"]');
  if (loginInput && submitButton) {
    loginInput.value = username;
    loginInput.dispatchEvent(new Event("input", { bubbles: true }));
    await sleep(1000);
    return !!document.querySelector(".note") && !document.querySelector(".color-fg-danger");
  }
}

async function performUsernameChangeRequest(username) {
  const submitButton = document.querySelector('button[data-disable-invalid][type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Changing...";

    const form = submitButton.closest('form[data-turbo="false"]');
    if (form) {
      const authenticityTokenInput = document.querySelector('input[name="authenticity_token"]');
      const authenticityToken = authenticityTokenInput ? authenticityTokenInput.value : "";
      const formData = new FormData(form);
      formData.append("user[login]", username);
      formData.append("authenticity_token", authenticityToken);
      form.submit();
      return true;
    }
  }
  return false;
}

async function findAvailableUsernames(length, count, delay, mode) {
  let availableUsernames = [];

  for (let i = 0; i < count; i++) {
    const username = generateRandomUsername(length);
    const isAvailable = await checkUsernameAvailability(username);

    if (isAvailable) {
      if (mode === "1") {
        availableUsernames.push(username);
      } else if (mode === "2") {
        const isChanged = await performUsernameChangeRequest(username);
        if (isChanged) break;
      }
    }

    await sleep(delay);
  }

  if (mode === "1" && availableUsernames.length > 0) {
    let selectedUsername;
    do {
      selectedUsername = prompt(`Available Usernames:\n\n${availableUsernames.map((name, index) => `[${index + 1}] ${name}`).join("\n")}\n\nSelect a username to copy by providing the numerical selector before it. Note that certain usernames may have been claimed by other GitHub users while the script was still running.`);
      if (selectedUsername === null) return;
      selectedUsername = parseInt(selectedUsername, 10);
    } while (isNaN(selectedUsername) || selectedUsername <= 0 || selectedUsername > availableUsernames.length);

    const chosenUsername = availableUsernames[selectedUsername - 1];
    const copyButton = document.createElement("button");
    copyButton.textContent = `Copy "${chosenUsername}" to clipboard`;
    copyButton.style.position = "fixed";
    copyButton.style.top = "50%";
    copyButton.style.left = "50%";
    copyButton.style.transform = "translate(-50%,-50%)";
    copyButton.style.zIndex = "9999";
    copyButton.style.padding = "10px";
    copyButton.style.backgroundColor = "#007b5e";
    copyButton.style.color = "#fff";
    copyButton.style.border = "none";
    copyButton.style.borderRadius = "5px";
    copyButton.style.cursor = "pointer";
    copyButton.onclick = () => {
      navigator.clipboard.writeText(chosenUsername).then(() => {
        alert(`Copied "${chosenUsername}" to clipboard`);
        document.body.removeChild(copyButton);
      }, () => {
        alert("Failed to copy to clipboard");
        document.body.removeChild(copyButton);
      });
    };
    document.body.appendChild(copyButton);
  }
}

function promptModeSelection() {
  let mode;
  do {
    mode = prompt("Please select the mode:\n1. List (Lists available usernames that meet the specifications after the desired number of usernames has been checked)\n2. Autochange (Automatically changes the username to the first available username that meets the specifications)");
    if (mode === null) return null;
  } while (mode !== "1" && mode !== "2");
  return mode;
}

function promptOptions() {
  let usernameLength, usernamesToTry, delay;
  do {
    usernameLength = prompt("Please enter the number of characters for the username (Usernames with more characters are usually easier to claim):");
    if (usernameLength === null) return null;
  } while (!usernameLength || parseInt(usernameLength, 10) === 0);

  do {
    usernamesToTry = prompt("Please enter the number of usernames to generate and check (If you are using the autochange mode, the first available username will be used):");
    if (usernamesToTry === null) return null;
  } while (!usernamesToTry || parseInt(usernamesToTry, 10) === 0);

  do {
    delay = prompt("Please enter the delay in milliseconds between username checks (800-1000 is the most accurate for a wide range of devices, while lower numbers may be suitable for powerful systems):");
    if (delay === null) return null;
  } while (!delay || parseInt(delay, 10) === 0);

  return {
    usernameLength: parseInt(usernameLength, 10),
    usernamesToTry: parseInt(usernamesToTry, 10),
    delay: parseInt(delay, 10),
  };
}

async function main() {
  if (window.location.href !== "https://github.com/settings/admin") {
    alert("This script should be run at https://github.com/settings/admin. You will now be redirected.");
    return;
  }

  const mode = promptModeSelection();
  if (mode === null) return;

  const options = promptOptions();
  if (options === null) return;

  await findAvailableUsernames(options.usernameLength, options.usernamesToTry, options.delay, mode);
}

main();
