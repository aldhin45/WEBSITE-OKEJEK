document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('orderForm');
  const estimate = document.getElementById('estimate');
  const year = document.getElementById('year');
  year.textContent = new Date().getFullYear();

  function calcEstimate(pickup, dest, service) {
   // jarak palsu simple: panjang string -> konversi ke perkiraan km
    const d = Math.abs(pickup.length - dest.length);
    const baseKm = Math.max(1, Math.round(d / 3) + 2);
    let rate = 4000; // per km for motor
    if (service === 'car') rate = 7000;
    if (service === 'cargo') rate = 5000;
    const price = baseKm * rate;
    return { km: baseKm, price };
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const pickup = document.getElementById('pickup').value.trim();
    const dest = document.getElementById('destination').value.trim();
    const service = document.getElementById('service').value;

    if (!pickup || !dest) {
      estimate.textContent = 'Mohon isi lokasi jemput dan tujuan.';
      return;
    }

    const result = calcEstimate(pickup, dest, service);
    estimate.innerHTML = `Estimasi: <strong>${result.km} km</strong> • Harga sekitar <strong>Rp ${result.price.toLocaleString()}</strong>`;
    // scroll ke hasil
    estimate.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
});
