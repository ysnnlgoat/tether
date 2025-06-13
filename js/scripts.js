let previousUser = '';
let lastMessageFrom = null;
let lastMessageWrapper = null;
let messageid = 0;
let ws = null;
const messageHistory = {};
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('user').readOnly = true;
});

function selectUsername(name) {
  initializeUser(name);
  document.getElementById('usernameModal').style.display = 'none';
}

function selectCustomUsername() {
  const custom = prompt("Enter your custom username:");
  if (custom && custom.trim() !== '') {
    initializeUser(custom.trim());
    document.getElementById('usernameModal').style.display = 'none';
  }
}

function initializeUser(username) {
  const userInput = document.getElementById('user');
  userInput.value = username;
  userInput.readOnly = true;

  ws = new WebSocket('ws://localhost:8080');

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'message') {
      const { user, message, messageid } = data.newMessage;
      messageHistory[messageid] = { user, message }; 
      rendMessage(user, message, messageid);
    } else if (data.type === 'history') {
      data.logs.forEach(({ user, message, messageid }) => {
        messageHistory[messageid] = { user, message };
        rendMessage(user, message, messageid);
      });
    }
  };
}

document.getElementById('message').addEventListener('keydown', function(event) {
  if (event.key === 'Enter' && !event.repeat) {
    sendMessage();
  }
});

function sendMessage() {
  const user = document.getElementById('user').value.trim();
  const message = document.getElementById('message').value.trim();

  if (!user) return alert("Please select a username.");
  if (!message) return alert("Please enter a message.");
  if (!ws || ws.readyState !== WebSocket.OPEN) return alert("WebSocket not connected.");

  ws.send(JSON.stringify({ message, user, messageid }));
  document.getElementById('message').value = '';
  document.getElementById('message').focus();
}

function rendMessage(user, message, messageid) {
  const myUsername = document.getElementById('user').value;
  const isMyMessage = user === myUsername;

  const replyMatch = message.match(/^@(\w+):#(\d+)\s+/);
  let actualMessage = message;
  let repliedTo = null;
  let repliedToId = null;

  if (replyMatch) {
    repliedTo = replyMatch[1];
    repliedToId = parseInt(replyMatch[2]);
    actualMessage = message.replace(/^@\w+:#\d+\s+/, '');
  }

  const isSameUserAsPrevious = lastMessageFrom === user;
  let chatWrapper = null;

  if (!isSameUserAsPrevious) {
    chatWrapper = document.createElement('div');
    chatWrapper.classList.add('chatwrapper');

    const avatar = document.createElement('div');
    avatar.classList.add('avatar');
    avatar.textContent = user[0].toUpperCase();

    const content = document.createElement('div');
    content.classList.add('contentbox');

    const usernameLabel = document.createElement('span');
    usernameLabel.classList.add('chatuser');
    usernameLabel.textContent = user;

    content.appendChild(usernameLabel);
    chatWrapper.appendChild(avatar);
    chatWrapper.appendChild(content);

    lastMessageWrapper = content;
    document.getElementById('messagewrapper').appendChild(chatWrapper);
  }

  const chatMessage = document.createElement('div');
  chatMessage.classList.add(isMyMessage ? 'mymessage' : 'othermessage');

  if (repliedTo && repliedToId !== null && messageHistory[repliedToId]) {
    const replyPreview = document.createElement('div');
    replyPreview.classList.add('replybox');

    const line1 = document.createElement('div');
    line1.classList.add('replyline1');
    line1.textContent = `${user} replied to ${repliedTo} →`;

    const line2 = document.createElement('div');
    line2.classList.add('replyline2');

    const repliedMsg = messageHistory[repliedToId].message;
    const previewText = repliedMsg.split(' ').slice(0, 2).join(' ') + (repliedMsg.split(' ').length > 2 ? '...' : '');
    line2.textContent = previewText;

    replyPreview.appendChild(line1);
    replyPreview.appendChild(line2);
    chatMessage.appendChild(replyPreview);
  }

  chatMessage.appendChild(document.createTextNode(actualMessage));

  if (!isMyMessage) {
    const replyBtn = document.createElement('button');
    replyBtn.classList.add('reply');
    replyBtn.textContent = 'Reply';
    replyBtn.onclick = () => {
      const input = document.getElementById('message');
      input.value = `@${user}:#${messageid} `;
      input.focus();
    };
    chatMessage.appendChild(replyBtn);
  }

  if (isSameUserAsPrevious) {
    lastMessageWrapper.appendChild(chatMessage);
  } else {
    lastMessageWrapper.appendChild(chatMessage);
  }

  lastMessageFrom = user;

const wrapper = document.getElementById('messagewrapper');
const scrollPosition = wrapper.scrollTop + wrapper.clientHeight;
const scrollThreshold = wrapper.scrollHeight * 0.75;

wrapper.appendChild(chatWrapper);

if (scrollPosition >= scrollThreshold) {
  requestAnimationFrame(() => {
    wrapper.scrollTop = wrapper.scrollHeight;
  });
}

}
