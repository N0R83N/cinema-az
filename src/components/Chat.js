import { supabase } from '../utils/supabase.js';
import { i18n } from '../i18n/index.js';

export function createChat(roomId) {
  const container = document.createElement('div');
  container.className = 'chat-container';
  
  let userName = localStorage.getItem('chat_name') || `User_${Math.floor(Math.random() * 1000)}`;
  let channel = null;

  container.innerHTML = `
    <div class="chat-header">
      <div class="chat-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        <span>${i18n.t('chat_title') || 'Room Chat'}</span>
      </div>
      <button class="btn-name-edit" id="change-name-btn" title="Change Name">
        <span id="current-name">${userName}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
      </button>
    </div>
    <div class="chat-messages" id="chat-messages">
      <div class="system-msg">${i18n.t('chat_welcome') || 'Welcome to the room! Share the link with friends to watch together.'}</div>
    </div>
    <form class="chat-input-area" id="chat-form">
      <input type="text" id="chat-input" placeholder="${i18n.t('chat_placeholder') || 'Type a message...'}" autocomplete="off">
      <button type="submit" id="send-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
      </button>
    </form>
  `;

  const messagesDiv = container.querySelector('#chat-messages');
  const input = container.querySelector('#chat-input');
  const form = container.querySelector('#chat-form');
  const nameBtn = container.querySelector('#change-name-btn');
  const nameSpan = container.querySelector('#current-name');

  function addMessage(user, text, isSelf = false) {
    const msg = document.createElement('div');
    msg.className = `msg-bubble ${isSelf ? 'msg-self' : ''}`;
    msg.innerHTML = `
      <div class="msg-user">${user}</div>
      <div class="msg-text">${text}</div>
    `;
    messagesDiv.appendChild(msg);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  function addSystemMessage(text) {
    const msg = document.createElement('div');
    msg.className = 'system-msg';
    msg.textContent = text;
    messagesDiv.appendChild(msg);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  // Initialize Supabase Realtime
  channel = supabase.channel(`room_${roomId}`, {
    config: { broadcast: { self: false } }
  });

  channel
    .on('broadcast', { event: 'message' }, (payload) => {
      addMessage(payload.payload.user, payload.payload.text);
    })
    .on('broadcast', { event: 'sync_request' }, (payload) => {
      addSystemMessage(`${payload.payload.user} ${i18n.t('chat_sync_msg') || 'is at'} ${payload.payload.time}`);
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        addSystemMessage(i18n.t('chat_connected') || 'Connected to real-time chat.');
      }
    });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    // Send via Supabase
    channel.send({
      type: 'broadcast',
      event: 'message',
      payload: { user: userName, text }
    });

    addMessage(userName, text, true);
    input.value = '';
  });

  nameBtn.addEventListener('click', () => {
    const newName = prompt(i18n.t('chat_enter_name') || 'Enter your name:', userName);
    if (newName && newName.trim()) {
      userName = newName.trim();
      localStorage.setItem('chat_name', userName);
      nameSpan.textContent = userName;
      addSystemMessage(`${i18n.t('chat_name_changed') || 'You changed your name to'} ${userName}`);
    }
  });

  return container;
}
