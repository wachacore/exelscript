// В начале script.js
let currentLanguage = 1; // по умолчанию — Sheets

document.addEventListener('DOMContentLoaded', () => {
  const editor = document.getElementById('codeEditor');
  const langSelect = document.getElementById('langSelect');
  const btnVisual = document.getElementById('btnVisualEditor');

  // Инициализация
  editor.value = 'ExelScript';
  updateLineNumbers();
  editor.setSelectionRange(12, 12); // курсор после "ExelScript"

  // Смена языка
  langSelect.addEventListener('change', () => {
    currentLanguage = parseInt(langSelect.value);
    btnVisual.style.display = currentLanguage === 2 ? 'inline-block' : 'none';
    updateLineNumbers(); // триггер для обновления (если будем делать live-highlight)
  });

  // В функции runCode() и saveFile() используем currentLanguage, а не парсинг кода
  window.runCode = function() {
    const code = editor.value.trim();
    if (!code.startsWith('ExelScript')) {
      return alert('Первая строка должна быть: ExelScript');
    }

    try {
      if (currentLanguage === 1) {
        renderSheet(code);
      } else if (currentLanguage === 2) {
        alert('⚠ Запуск Exel Code Script — в разработке.\nИспользуйте "Конвертер в Python" или визуальный редактор.');
      } else if (currentLanguage === 3) {
        const data = parseExelScriptClassic(code);
        const html = `<pre style="font-family:monospace">${JSON.stringify(data, null, 2)}</pre>`;
        document.getElementById('previewFrame').srcdoc = `
          <!DOCTYPE html><meta charset="utf-8"><body style="background:#1e1e1e;color:#d4d4d4;padding:16px">${html}`;
      }
    } catch (e) {
      alert('Ошибка: ' + e.message);
    }
  };

  window.saveFile = function() {
    let ext = '.es';
    if (currentLanguage === 2) ext = '.espy';
    else if (currentLanguage === 3) ext = '.escl';

    const content = editor.value;
    downloadFile(`документ${ext}`, content);
  };

  window.convertToPython = function() {
    if (currentLanguage !== 2) {
      return alert('Конвертер доступен только для Exel Code Script (выберите его в списке).');
    }
    const code = editor.value;
    if (!code.startsWith('ExelScript')) {
      return alert('Файл должен начинаться с "ExelScript"');
    }

    // Простая конвертация (можно расширить)
    let py = code
      .split('\n')
      .slice(1) // убираем "ExelScript"
      .map(line => {
        line = line.trim();
        if (line.startsWith('log(')) return line.replace('log(', 'print(').replace(/;$/, '');
        if (line.startsWith('var ')) return line.replace('var ', '').replace(/;$/, '');
        if (line.startsWith('loop ')) return line.replace(/loop (\d+) times \{/, 'for _ in range($1):').replace(/;$/, '');
        if (line.startsWith('if ')) return line.replace(/if (.*) \{/, 'if $1:').replace(/;$/, '');
        if (line === '}') return '# end block';
        return line.replace(/;/g, '');
      })
      .join('\n');

    downloadFile('converted.py', py, 'text/x-python');
  };

  // В newFile() — сброс и фокус
  window.newFile = function() {
    editor.value = 'ExelScript';
    setTimeout(() => {
      editor.focus();
      editor.setSelectionRange(12, 12);
    }, 10);
    updateLineNumbers();
  };

  // Остальное — без изменений (openFile, loadUrl и т.д.)
});
