function updateLineNumbers() {
  const editor = document.getElementById('codeEditor');
  const lines = editor.value.split('\n').length;
  // Генерируем номера с ведущими пробелами для выравнивания (как в VS Code)
  // Например: " 1", " 2", ..., "10", "11"
  const maxDigits = Math.max(2, String(lines).length);
  const numbers = Array.from({ length: lines }, (_, i) => {
    const num = i + 1;
    return String(num).padStart(maxDigits, ' ');
  }).join('\n');
  document.getElementById('lineNumbers').textContent = numbers;
}
