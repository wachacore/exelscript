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

function updateLineNumbers() {
  const editor = document.getElementById('codeEditor');
  const lines = editor.value.split('\n').length;
  const maxDigits = Math.max(2, String(lines).length);
  const numbers = Array.from({ length: lines }, (_, i) => {
    const num = i + 1;
    return String(num).padStart(maxDigits, ' ');
  }).join('\n');
  document.getElementById('lineNumbers').textContent = numbers;
}
