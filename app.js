const video = document.getElementById('preview');
const cameraBtn = document.getElementById('cameraBtn');
const recordBtn = document.getElementById('recordBtn');
const stopBtn = document.getElementById('stopBtn');
const cameraStatus = document.getElementById('cameraStatus');
const placeholder = document.getElementById('placeholder');
const message = document.getElementById('message');
const recordStatus = document.getElementById('recordStatus');
const elapsedEl = document.getElementById('elapsed');
const savedInfo = document.getElementById('savedInfo');
const downloadLink = document.getElementById('downloadLink');

let stream = null, recorder = null, chunks = [], startedAt = 0, tick = null, lastUrl = null;

function say(text){ message.textContent = text; }

cameraBtn.addEventListener('click', async () => {
  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Browser belum mendukung kamera. Buka aplikasi melalui alamat HTTPS di Chrome.');
    }
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
    });
    video.srcObject = stream;
    video.style.display = 'block';
    placeholder.style.display = 'none';
    cameraStatus.textContent = 'KAMERA AKTIF';
    cameraStatus.classList.add('on');
    cameraBtn.disabled = true;
    recordBtn.disabled = false;
    say('Kamera aktif. Pastikan garis finis terlihat jelas.');
  } catch (err) {
    say('Kamera gagal dibuka: ' + err.message + ' Periksa izin kamera Chrome dan gunakan HTTPS.');
  }
});

recordBtn.addEventListener('click', () => {
  if (!stream) return;
  const mime = ['video/webm;codecs=vp8,opus','video/webm','video/mp4'].find(t => MediaRecorder.isTypeSupported(t));
  if (!mime) { say('Perekaman video tidak didukung browser ini.'); return; }
  chunks = [];
  recorder = new MediaRecorder(stream, { mimeType: mime });
  recorder.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
  recorder.onstop = saveRecording;
  recorder.start(1000);
  startedAt = Date.now();
  recordStatus.textContent = 'Sedang merekam';
  recordBtn.disabled = true;
  stopBtn.disabled = false;
  say('Perekaman dimulai. Jaga HP tetap mengarah ke garis finis.');
  tick = setInterval(() => {
    const s = Math.floor((Date.now() - startedAt)/1000);
    elapsedEl.textContent = String(Math.floor(s/60)).padStart(2,'0') + ':' + String(s%60).padStart(2,'0');
  }, 500);
});

stopBtn.addEventListener('click', () => {
  if (recorder && recorder.state !== 'inactive') recorder.stop();
  clearInterval(tick);
  recordBtn.disabled = false;
  stopBtn.disabled = true;
  recordStatus.textContent = 'Menyimpan video…';
});

function saveRecording() {
  const type = recorder.mimeType || 'video/webm';
  const blob = new Blob(chunks, {type});
  if (lastUrl) URL.revokeObjectURL(lastUrl);
  lastUrl = URL.createObjectURL(blob);
  const ext = type.includes('mp4') ? 'mp4' : 'webm';
  const filename = 'finish-line-' + new Date().toISOString().replace(/[:.]/g,'-') + '.' + ext;
  downloadLink.href = lastUrl;
  downloadLink.download = filename;
  downloadLink.hidden = false;
  savedInfo.textContent = 'Video siap disimpan: ' + (blob.size/1024/1024).toFixed(1) + ' MB. Tekan tautan unduh dan pilih penyimpanan perangkat.';
  recordStatus.textContent = 'Rekaman selesai';
  say('Rekaman selesai. Simpan video ke perangkat melalui tautan unduh.');
}

window.addEventListener('beforeunload', () => {
  if (stream) stream.getTracks().forEach(t => t.stop());
});

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) { window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(()=>{})); }
