let blocks = [];

function toggleVisualEditor() {
  const ver = getLanguageVersion(document.getElementById('codeEditor').value);
  const ve = document.getElementById('visualEditor');
  if (ver === 2) {
    ve.classList.toggle('hidden');
  } else {
    alert('Визуальный редактор доступен только для Exel Code Script (версия 2).');
  }
}

document.querySelectorAll('.block').forEach(btn => {
  btn.addEventListener('click', e => {
    const type = e.target.dataset.type;
    const block = document.createElement('div');
    block.className = 'drag-block';
    block.draggable = true;
    block.textContent = `Блок: ${type}`;
    block.dataset.type = type;
    document.getElementById('workspace').appendChild(block);
  });
});

// Простая генерация кода
function generateCodeFromBlocks() {
  const workspace = document.getElementById('workspace');
  const blocks = workspace.querySelectorAll('.drag-block');
  let code = 'ExelScript\n(2)\n\n';

  blocks.forEach(b => {
    const t = b.dataset.type;
    switch (t) {
      case 'print':
        code += 'log("Привет");\n';
        break;
      case 'var':
        code += 'var x = 10;\n';
        break;
      case 'loop':
        code += 'loop 5 times {\n  log("Цикл");\n}\n';
        break;
      case 'if':
        code += 'if x > 5 {\n  log("Да");\n} else {\n  log("Нет");\n}\n';
        break;
    }
  });

  document.getElementById('codeEditor').value = code;
  document.getElementById('visualEditor').classList.add('hidden');
  updateLineNumbers();
}