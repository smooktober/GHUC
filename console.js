function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateRandomUsername(length) {
  const alphanumericCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let username = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * alphanumericCharacters.length);
    username += alphanumericCharacters[randomIndex];
  }
  return username;
}

async function checkUsernameAvailability(username) {
  const inputField = document.querySelector('input[name="login"]');
  const submitButton = document.querySelector('button[type="submit"]');

  if (!inputField || !submitButton) {
    console.error('Error: Required elements not found on the page. Please navigate to the username change window where you can input a username and submit it, click "Change Username" and continue with the prompts, then attempt to run again.');
    return false;
  }

  inputField.value = '';
  inputField.value = username;
  inputField.dispatchEvent(new Event('input', { bubbles: true }));

  await sleep(1000);

  const noteElement = document.querySelector('.note');
  const errorMessage = document.querySelector('.color-fg-danger');

  if (noteElement && !errorMessage) {
    console.log(`Username "${username}" is available.`);
    return true;
  }

  console.log(`Username "${username}" is not available. Trying another one...`);
  return false;
}

async function performUsernameChangeRequest(username) {
  const submitButton = document.querySelector('button[data-disable-invalid][type="submit"]');
  
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Changing...';
    
    const form = submitButton.closest('form[data-turbo="false"]');
    
    if (form) {
      const tokenInput = document.querySelector('input[name="authenticity_token"]');
      const token = tokenInput ? tokenInput.value : '';
  
      const formData = new FormData(form);
      formData.append('user[login]', username);
      formData.append('authenticity_token', token);
      
      submitButton.disabled = false;
      submitButton.click();
      
      return true;
    } else {
      console.error('Error: Username change form not found on the page.');
    }
  } else {
    console.error('Error: "Change username" button not found on the page.');
  }

  return false;
}

function promptModeSelection() {
  let mode;
  do {
    mode = prompt('Please select the mode:\n[1] List (Lists available usernames that meet the specifications after the desired number of usernames has been checked)\n[2] Autochange (Automatically changes the username to the first available username that meets the specifications)\n\nSelect your preferred mode by entering the corresponding number above.');
  } while (mode !== '1' && mode !== '2');
  return mode;
}

function promptOptions() {
  let usernameLength, usernamesCount, msDelay;

  do {
    usernameLength = prompt('Please enter the number of characters for the username (Usernames with more characters are usually easier to claim, while shorter usernames are rarer):');
  } while (!usernameLength || parseInt(usernameLength) === 0);

  do {
    usernamesCount = prompt('Please enter the number of usernames to generate and check (If you are using the autochange mode, the first available username will be applied):');
  } while (!usernamesCount || parseInt(usernamesCount) === 0);

  do {
    msDelay = prompt('Please enter the delay in milliseconds between username checks (800-1000 is the most accurate for a wide range of devices, while lower numbers may be suitable for powerful systems):');
  } while (!msDelay || parseInt(msDelay) === 0);

  return {
    usernameLength: parseInt(usernameLength),
    usernamesToTry: parseInt(usernamesCount),
    delay: parseInt(msDelay)
  };
}

async function findAvailableUsernames(usernameLength, usernamesToTry, delay, mode) {
  let availableUsernames = [];

  for (let i = 0; i < usernamesToTry; i++) {
    const username = generateRandomUsername(usernameLength);
    const isAvailable = await checkUsernameAvailability(username);

    if (isAvailable) {
      if (mode === '1') {
        availableUsernames.push(username);
      } else if (mode === '2') {
        const isChanged = await performUsernameChangeRequest(username);
        if (isChanged) {
          break;
        }
      }
    }

    await sleep(delay);
  }

  if (mode === '1') {
    if (availableUsernames.length === 0) {
      alert('Sorry, no usernames were found. Perhaps you might want to adjust your parameters?');
    } else {
      console.log('Available usernames:', availableUsernames);
      alert('Available usernames:\n' + availableUsernames.join('\n'));
    }
  }
}

async function main() {
  if (window.location.href !== 'https://github.com/settings/admin') {
    alert('This script should be run at https://github.com/settings/admin, in the "Change Username" window. You will now be redirected.');
    window.location.href = 'https://github.com/settings/admin';
    return;
  }

  const mode = promptModeSelection();
  const options = promptOptions();

  await findAvailableUsernames(options.usernameLength, options.usernamesToTry, options.delay, mode);
}

main();
