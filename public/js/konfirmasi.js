// public/js/konfirmasi.js

document.addEventListener('DOMContentLoaded', () => {
    
    // Set Tahun Copyright
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

});