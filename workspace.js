'use strict';
const $ = selector => document.querySelector(selector);
let groups = [];

function selection() {
  let groupId, path;
  try { [groupId, path] = decodeURIComponent(location.hash.slice(1)).split('/'); } catch {}
  const group = groups.find(g => g.id === groupId && g.documents.some(d => d.path === path)) || groups.find(g => g.documents.some(d => d.path === path)) || groups.find(g => g.id === groupId) || groups[0];
  return {group, doc:group.documents.find(d => d.path === path) || group.documents[0]};
}

function render() {
  if (!groups.length) return;
  const {group, doc} = selection();
  const navigation = $('#document-groups');
  navigation.replaceChildren();
  for (const item of groups) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = `${item.title} · ${item.documents.length}`;
    button.setAttribute('aria-pressed', String(item.id === group.id));
    button.onclick = () => { location.hash = `${item.id}/${item.documents[0].path}`; };
    navigation.append(button);
  }
  const select = $('#documents');
  select.replaceChildren(...group.documents.map(d => new Option(d.title, d.path)));
  select.value = doc.path;
  select.onchange = () => { location.hash = `${group.id}/${select.value}`; };
  $('#group-name').textContent = group.title;
  $('#document-name').textContent = doc.title;
  document.title = `${group.title} · ${doc.title} · 제품기획 작업실`;
  const url = new URL(`pages/${doc.path}`, location.href);
  $('#open-page').href = url.href;
  $('#preview').title = `${group.title} · ${doc.title}`;
  if ($('#preview').getAttribute('src') !== url.href) $('#preview').src = url.href;
  $('#viewer').hidden = false;
  $('#status').textContent = '';
}

// 문서 안의 상대 링크로 이동해도 제품·문서 선택을 따라간다.
$('#preview').addEventListener('load', () => {
  try {
    const url = new URL($('#preview').contentWindow.location.href);
    if (url.origin !== location.origin) return;
    const path = decodeURIComponent(url.pathname).split('/').pop();
    const current = selection();
    const group = current.group.documents.some(d => d.path === path) ? current.group : groups.find(g => g.documents.some(d => d.path === path));
    if (!group || (current.group.id === group.id && current.doc.path === path)) return;
    history.replaceState(null, '', `#${group.id}/${path}`);
    render();
  } catch {}
});
window.addEventListener('hashchange', render);

async function start() {
  try {
    const response = await fetch('navigation.json', {cache:'no-store'});
    if (!response.ok) throw new Error('목록 요청 실패');
    const data = await response.json();
    for (const group of data.groups || []) {
      if (!/^[a-z0-9-]+$/.test(group.id) || typeof group.title !== 'string' || !Array.isArray(group.documents)) continue;
      const documents = group.documents.filter(d => /^[a-z0-9][a-z0-9.-]*\.html$/.test(d.path) && typeof d.title === 'string');
      if (documents.length) groups.push({...group, documents});
    }
    if (!groups.length) throw new Error('빈 문서 목록');
    render();
  } catch {
    $('#status').textContent = '문서 목록을 불러오지 못했습니다. 잠시 후 새로고침해 주세요.';
  }
}
start();
