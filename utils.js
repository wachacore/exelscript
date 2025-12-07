function downloadFile(filename, content, type = 'text/plain') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

function getLanguageVersion(code) {
  const lines = code.split('\n');
  if (lines[0] !== 'ExelScript') return null;
  const match = lines[1].match(/^\((1|2|3)\)$/);
  return match ? parseInt(match[1]) : null;
}

function updateLineNumbers() {
  const editor = document.getElementById('codeEditor');
  const lines = editor.value.split('\n').length;
  const numbers = Array.from({ length: lines }, (_, i) => i + 1).join('\n');
  document.getElementById('lineNumbers').textContent = numbers;
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}