let currentLanguage = 1;

document.addEventListener('DOMContentLoaded', () => {
  const editor = document.getElementById('codeEditor');
  const langSelect = document.getElementById('langSelect');
  const btnVisual = document.getElementById('btnVisualEditor');
  const fileInput = document.getElementById('fileInput');

  // Инициализация
  editor.value = 'ExelScript';
  updateLineNumbers();
  editor.focus();
  editor.setSelectionRange(12, 12); // курсор после "ExelScript"

  // Смена языка
  langSelect.addEventListener('change', () => {
    currentLanguage = parseInt(langSelect.value);
    btnVisual.style.display = currentLanguage === 2 ? 'inline-block' : 'none';
  });

  // Синхронизация строк
  editor.addEventListener('input', debounce(() => {
    updateLineNumbers();
    localStorage.setItem('exelscript-last-code', editor.value);
  }, 100));

  // Кнопки
  document.getElementById('btnNew').onclick = newFile;
  document.getElementById('btnOpen').onclick = () => fileInput.click();
  document.getElementById('btnSave').onclick = saveFile;
  document.getElementById('btnRun').onclick = runCode;
  document.getElementById('btnGo').onclick = loadUrl;
  document.getElementById('btnClear').onclick = () => {
    document.getElementById('previewFrame').src = 'about:blank';
    document.getElementById('browserUrl').value = '';
  };

  // Открытие файла
  fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      editor.value = reader.result;
      editor.focus();
      updateLineNumbers();
    };
    reader.readAsText(file);
  });

  // === ГЛОБАЛЬНЫЕ ФУНКЦИИ ===
  window.newFile = function() {
    editor.value = 'ExelScript';
    setTimeout(() => {
      editor.focus();
      editor.setSelectionRange(12, 12);
    }, 10);
    updateLineNumbers();
  };

  window.openFile = function() {
    fileInput.click();
  };

  window.saveFile = function() {
    let ext = '.es';
    if (currentLanguage === 2) ext = '.espy';
    else if (currentLanguage === 3) ext = '.escl';
    downloadFile(`документ${ext}`, editor.value);
  };

  window.saveAs = window.saveFile;

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
        const html = `<pre style="font-family:monospace;white-space:pre">${JSON.stringify(data, null, 2)}</pre>`;
        document.getElementById('previewFrame').srcdoc = `
          <!DOCTYPE html>
          <meta charset="utf-8">
          <body style="background:#1e1e1e;color:#d4d4d4;padding:16px;margin:0;font-family:monospace">
            ${html}
          </body>`;
      }
    } catch (e) {
      alert('Ошибка: ' + e.message);
      console.error(e);
    }
  };

  window.loadUrl = function() {
    const url = document.getElementById('browserUrl').value.trim();
    const frame = document.getElementById('previewFrame');
    if (!url) return;
    if (!url.startsWith('http')) {
      alert('Введите полный URL (например: https://example.com)');
      return;
    }
    frame.src = url;
  };

  window.convertToPython = function() {
    if (currentLanguage !== 2) {
      return alert('Конвертер доступен только для Exel Code Script (выберите его в списке).');
    }
    const code = editor.value;
    if (!code.startsWith('ExelScript')) {
      return alert('Файл должен начинаться с "ExelScript"');
    }

    let lines = code.split('\n').slice(1); // убираем первую строку
    let py = lines.map(line => {
      line = line.trim();
      if (!line || line.startsWith('//')) return line;
      line = line.replace(/;/g, '');
      line = line.replace(/^log\s*\((.*)\)$/, 'print($1)');
      line = line.replace(/^var\s+/, '');
      line = line.replace(/^loop\s+(\d+)\s+times\s*\{/, 'for _ in range($1):');
      line = line.replace(/^if\s+(.*?)\s*\{/, 'if $1:');
      if (line === '}') return '# end block';
      return line;
    }).join('\n');

    downloadFile('converted.py', py, 'text/x-python');
  };

  window.toggleVisualEditor = function() {
    if (currentLanguage !== 2) {
      alert('Визуальный редактор доступен только для Exel Code Script (версия 2).');
      return;
    }
    document.getElementById('visualEditor').classList.toggle('hidden');
  };

  window.showHelp = function() {
    alert(`ExelScript — новый язык программирования.

Версии:
1. Exel Sheets Script — создание таблиц кодом (sheet, write, color).
2. Exel Code Script — упрощённый Python для обучения (log, var, loop).
3. Exel Script Classic — человекочитаемое хранилище данных (record, field).

Первая строка файла всегда: ExelScript`);
  };

  // === Внутренние функции ===
  function parseExelScriptClassic(code) {
    const lines = code.split('\n').slice(1);
    const result = {};
    let currentRecord = null;

    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith('//')) continue;

      const recordMatch = line.match(/^record\s+(\w+)\s*\{/);
      if (recordMatch) {
        currentRecord = recordMatch[1];
        result[currentRecord] = {};
        continue;
      }

      if (line === '}') {
        currentRecord = null;
        continue;
      }

      if (currentRecord && line.includes(':')) {
        const [key, valRaw] = line.split(':').map(s => s.trim().replace(/;$/, ''));
        let val = valRaw;
        if (valRaw === 'true') val = true;
        else if (valRaw === 'false') val = false;
        else if (valRaw === 'null') val = null;
        else if (!isNaN(valRaw) && valRaw !== '' && !valRaw.startsWith('"')) val = Number(valRaw);
        else if (valRaw.startsWith('"') && valRaw.endsWith('"')) val = valRaw.slice(1, -1);
        result[currentRecord][key] = val;
      }
    }
    return result;
  }

  function renderSheet(code) {
    const lines = code.split('\n').slice(1);
    let rows = 5, cols = 5;
    const cells = {};

    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith('//')) continue;

      const sheetMatch = line.match(/sheet\((\d+)x(\d+)\)/);
      if (sheetMatch) {
        rows = parseInt(sheetMatch[1]);
        cols = parseInt(sheetMatch[2]);
        continue;
      }

      const writeMatch = line.match(/write\((\d+)x(\d+):\s*"?([^"]*)"?/);
      if (writeMatch) {
        const key = `${writeMatch[1]}x${writeMatch[2]}`;
        cells[key] = cells[key] || {};
        cells[key].text = writeMatch[3];
        continue;
      }

      const colorMatch = line.match(/color\((\d+)x(\d+):\s*([^)]+)/);
      if (colorMatch) {
        const key = `${colorMatch[1]}x${colorMatch[2]}`;
        cells[key] = cells[key] || {};
        cells[key].color = colorMatch[3].trim();
      }
    }

    let tableHTML = '<table border="1" style="border-collapse:collapse;font-family:monospace;font-size:14px">';
    for (let r = 1; r <= rows; r++) {
      tableHTML += '<tr>';
      for (let c = 1; c <= cols; c++) {
        const key = `${r}x${c}`;
        const cell = cells[key] || {};
        const style = cell.color ? `background:${cell.color};` : '';
        tableHTML += `<td style="${style}padding:6px;min-width:80px;text-align:center">${cell.text || ''}</td>`;
      }
      tableHTML += '</tr>';
    }
    tableHTML += '</table>';

    const html = `
      <!DOCTYPE html>
      <meta charset="utf-8">
      <body style="padding:16px;background:#f8f8f8">${tableHTML}
      <br><button onclick="downloadCSV()">📥 Скачать как CSV</button>
      <script>
        function downloadCSV() {
          const rows = [];
          const table = document.querySelector('table');
          for (let tr of table.querySelectorAll('tr')) {
            const cols = [];
            for (let td of tr.querySelectorAll('td')) {
              let text = td.textContent || '';
              text = text.replace(/"/g, '""');
              cols.push('"' + text + '"');
            }
            rows.push(cols.join(';'));
          }
          const blob = new Blob([rows.join('\\n')], {type: 'text/csv;charset=utf-8'});
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'table.csv';
          a.click();
          URL.revokeObjectURL(url);
        }
      </script>
      </body>`;

    document.getElementById('previewFrame').srcdoc = html;
  }
});
