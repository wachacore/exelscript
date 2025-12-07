let currentFilename = 'новый.es';

document.addEventListener('DOMContentLoaded', () => {
  const editor = document.getElementById('codeEditor');
  const fileInput = document.getElementById('fileInput');
  const versionStatus = document.getElementById('versionStatus');
  const btnVisual = document.getElementById('btnVisualEditor');

  // Загрузка сохранённого кода из localStorage
  const saved = localStorage.getItem('exelscript-last-code');
  if (saved) editor.value = saved;

  editor.addEventListener('input', debounce(() => {
    const ver = getLanguageVersion(editor.value);
    let status = 'ExelScript (неизвестно)';
    let ext = '.es';
    btnVisual.style.display = 'none';

    if (ver === 1) {
      status = 'Exel Sheets Script (таблицы)';
      ext = '.es';
    } else if (ver === 2) {
      status = 'Exel Code Script (обучение)';
      ext = '.espy';
      btnVisual.style.display = 'inline-block';
    } else if (ver === 3) {
      status = 'Exel Script Classic (БД)';
      ext = '.escl';
    }

    versionStatus.textContent = status;
    currentFilename = ver ? `документ${ext}` : 'новый.es';

    updateLineNumbers();
    localStorage.setItem('exelscript-last-code', editor.value);
    // highlightSyntax(); — будет позже
  }, 200));

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

  fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    currentFilename = file.name;
    const reader = new FileReader();
    reader.onload = () => {
      editor.value = reader.result;
      editor.dispatchEvent(new Event('input'));
    };
    reader.readAsText(file);
  });

  // Запуск
  function runCode() {
    const code = editor.value;
    const ver = getLanguageVersion(code);
    if (!ver) return alert('Неверный заголовок. Должно быть: ExelScript\\n(1/2/3)\\n');

    try {
      if (ver === 1) {
        renderSheet(code);
      } else if (ver === 2) {
        alert('Запуск Exel Code Script — в разработке. Пока можно только конвертировать в Python.');
      } else if (ver === 3) {
        const data = parseExelScriptClassic(code);
        const html = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
        document.getElementById('previewFrame').srcdoc = `
          <!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="background:#f0f0f0">${html}</body></html>
        `;
      }
    } catch (e) {
      alert('Ошибка: ' + e.message);
      console.error(e);
    }
  }

  function parseExelScriptClassic(code) {
    // Пример: record User { name: "Alice", age: 30 }
    // → { User: { name: "Alice", age: 30 } }
    const lines = code.split('\n').slice(3); // пропускаем заголовки
    const obj = {};
    let currentRecord = null;

    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith('//')) continue;

      if (line.startsWith('record ')) {
        const match = line.match(/record\s+(\w+)\s*\{/);
        if (match) currentRecord = match[1];
        obj[currentRecord] = {};
      } else if (line === '}') {
        currentRecord = null;
      } else if (currentRecord && line.includes(':')) {
        const [key, val] = line.split(':').map(x => x.trim().replace(/;$/, ''));
        let parsedVal;
        if (val === 'true' || val === 'false') parsedVal = val === 'true';
        else if (val === 'null') parsedVal = null;
        else if (!isNaN(val) && !val.startsWith('"')) parsedVal = parseFloat(val);
        else if (val.startsWith('"') && val.endsWith('"')) parsedVal = val.slice(1, -1);
        else parsedVal = val;
        obj[currentRecord][key] = parsedVal;
      }
    }
    return obj;
  }

  function renderSheet(code) {
    // Пример: sheet(3x5); write(1x1: "A1"); color(1x1: #ff0000)
    const lines = code.split('\n').slice(3);
    let rows = 10, cols = 10; // по умолчанию
    const cells = {}; // "1x1" → { text, color, font, size }

    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith('//')) continue;

      if (line.startsWith('sheet(')) {
        const match = line.match(/sheet\((\d+)x(\d+)\)/);
        if (match) {
          rows = parseInt(match[1]);
          cols = parseInt(match[2]);
        }
      } else if (line.startsWith('write(')) {
        const match = line.match(/write\((\d+)x(\d+):\s*"?([^"]*)"?/);
        if (match) {
          const key = `${match[1]}x${match[2]}`;
          cells[key] = cells[key] || {};
          cells[key].text = match[3];
        }
      } else if (line.startsWith('color(')) {
        const match = line.match(/color\((\d+)x(\d+):\s*([^)]+)/);
        if (match) {
          const key = `${match[1]}x${match[2]}`;
          cells[key] = cells[key] || {};
          cells[key].color = match[3].trim();
        }
      }
    }

    // Генерируем HTML-таблицу
    let html = '<table border="1" style="border-collapse:collapse; font-family:monospace">';
    for (let r = 1; r <= rows; r++) {
      html += '<tr>';
      for (let c = 1; c <= cols; c++) {
        const key = `${r}x${c}`;
        const cell = cells[key] || {};
        const style = [];
        if (cell.color) style.push(`background:${cell.color}`);
        html += `<td style="${style.join(';')}">${cell.text || ''}</td>`;
      }
      html += '</tr>';
    }
    html += '</table>';

    document.getElementById('previewFrame').srcdoc = `
      <!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${html}<br><button onclick="downloadCSV()">Скачать как CSV</button>
      <script>
        function downloadCSV() {
          const table = document.querySelector('table');
          let csv = [];
          for (let r of table.rows) {
            let row = [];
            for (let c of r.cells) {
              row.push('"' + (c.textContent || '').replace(/"/g, '""') + '"');
            }
            csv.push(row.join(';'));
          }
          const blob = new Blob([csv.join('\\n')], {type: 'text/csv'});
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'table.csv';
          a.click();
        }
      </script></body></html>
    `;
  }

  function loadUrl() {
    const url = document.getElementById('browserUrl').value.trim();
    const frame = document.getElementById('previewFrame');
    if (!url) return;
    // Безопасность: только https и разрешённые домены
    if (!url.startsWith('http')) {
      alert('Введите полный URL (например: https://yandex.ru)');
      return;
    }
    frame.src = url;
  }

  // Меню
  window.newFile = () => {
    editor.value = 'ExelScript\n(1)\n';
    editor.dispatchEvent(new Event('input'));
  };
  window.openFile = () => fileInput.click();
  window.saveFile = () => {
    const ver = getLanguageVersion(editor.value);
    let ext = '.es';
    if (ver === 2) ext = '.espy';
    else if (ver === 3) ext = '.escl';
    downloadFile(`документ${ext}`, editor.value);
  };
  window.saveAs = saveFile;
  window.convertToPython = () => {
    const code = editor.value;
    const ver = getLanguageVersion(code);
    if (ver !== 2) return alert('Конвертер работает только для Exel Code Script (версия 2).');
    // Простая замена
    let py = code
      .replace(/log\((.*?)\);/g, 'print($1)')
      .replace(/var /g, '')
      .replace(/loop (\d+) times \{/g, 'for _ in range($1):')
      .replace(/if (.*?) \{/g, 'if $1:')
      .replace(/} else \{/g, 'else:')
      .replace(/};/g, '')
      .replace(/;/g, '');

    downloadFile('converted.py', py, 'text/python');
  };
  window.toggleVisualEditor = toggleVisualEditor;
});