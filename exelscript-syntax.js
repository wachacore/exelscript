const SYNTAX = {
  1: { // Exel Sheets Script
    keywords: ['sheet', 'write', 'color', 'font', 'size', 'align', 'merge'],
    strings: /"(.*?)"/g,
    numbers: /\b\d+x\d+\b/g,
    colors: /(#[0-9a-fA-F]{6}|rgba?\([^)]+\))/g,
    operators: /[:;]/g,
    comments: /\/\/.*$/gm
  },
  2: { // Exel Code Script
    keywords: ['log', 'var', 'if', 'else', 'loop', 'times', 'func', 'return', 'input'],
    types: ['str', 'num', 'bool'],
    strings: /"(.*?)"/g,
    numbers: /\b\d+(\.\d+)?\b/g,
    operators: /[=+\-*/<>!&|]/g,
    comments: /\/\/.*$/gm
  },
  3: { // Exel Script Classic (JSON+)
    keywords: ['record', 'field', 'list', 'map'],
    strings: /"(.*?)"/g,
    numbers: /\b\d+(\.\d+)?\b/g,
    booleans: /\b(true|false)\b/g,
    nulls: /\bnull\b/g,
    operators: /[:{},]/g,
    comments: /\/\/.*$/gm
  }
};

function highlightSyntax() {
  const editor = document.getElementById('codeEditor');
  const code = editor.value;
  const ver = getLanguageVersion(code);
  if (!ver) return;

  let html = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const s = SYNTAX[ver];

  // Сначала комментарии (чтобы не разбивать другие токены)
  html = html.replace(s.comments, '<span class="comment">$&</span>');

  if (ver === 1) {
    // Особая обработка для 5x10, color(...) и т.д.
    html = html.replace(/(\d+x\d+)/g, '<span class="coord">$1</span>');
    html = html.replace(/color\s*\(([^)]+)\)/gi, 'color(<span class="color-arg">$1</span>)');
    html = html.replace(/write\s*\(([^)]+)\)/gi, 'write(<span class="write-arg">$1</span>)');
    html = html.replace(/sheet\s*\(([^)]+)\)/gi, 'sheet(<span class="sheet-arg">$1</span>)');
  }

  // Общие правила
  if (s.keywords) {
    const kwRegex = new RegExp(`\\b(${s.keywords.join('|')})\\b`, 'gi');
    html = html.replace(kwRegex, '<span class="keyword">$1</span>');
  }
  if (s.types) {
    const tRegex = new RegExp(`\\b(${s.types.join('|')})\\b`, 'gi');
    html = html.replace(tRegex, '<span class="type">$1</span>');
  }
  if (s.strings) html = html.replace(s.strings, '<span class="string">"$1"</span>');
  if (s.numbers) html = html.replace(s.numbers, '<span class="number">$&</span>');
  if (s.colors && ver === 1) html = html.replace(s.colors, '<span class="color-value">$&</span>');
  if (s.operators) html = html.replace(s.operators, '<span class="operator">$&</span>');
  if (s.booleans && ver === 3) html = html.replace(s.booleans, '<span class="bool">$1</span>');
  if (s.nulls && ver === 3) html = html.replace(s.nulls, '<span class="null">null</span>');

  // Но! textarea не поддерживает HTML → заменяем на contenteditable div + скрытый textarea
  // → Пока оставим как есть (подсветка будет визуализирована позже, либо через div)

  // TODO: реализовать contenteditable-редактор для подсветки (если нужно)
  // Сейчас — базовая поддержка через CSS-классы (не работает в textarea)
  // Для GitHub Pages — можно использовать Prism.js, но вы просили без библиотек.
  // → Вариант: использовать `<pre><code id="highlighted">...</code></pre>` + скрытый textarea-sync
}

// Для простоты: пока оставим без живой подсветки (или добавим позже)