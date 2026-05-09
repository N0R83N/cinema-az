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
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        <span>${i18n.t('chat_title')}</span>
      </div>
      <div class="chat-header-btns">
        <button class="chat-icon-btn" id="share-room-btn" title="${i18n.t('share_room')}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
        </button>
        <button class="chat-icon-btn" id="close-room-btn" title="${i18n.t('close_room')}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
    <div class="chat-user-bar">
      <button class="btn-name-edit" id="change-name-btn">
        <span id="current-name">${userName}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
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

  const shareBtn = container.querySelector('#share-room-btn');
  const closeBtn = container.querySelector('#close-room-btn');

  shareBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      const originalTitle = i18n.t('chat_title');
      container.querySelector('.chat-title span').textContent = i18n.t('link_copied');
      setTimeout(() => {
        container.querySelector('.chat-title span').textContent = originalTitle;
      }, 2000);
    });
  });

  closeBtn.addEventListener('click', () => {
    const hash = window.location.hash.split('?')[0];
    window.location.hash = hash;
    window.location.reload();
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
