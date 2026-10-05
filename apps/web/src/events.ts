// Random office events that trigger periodically

export interface RandomOfficeEvent {
  id: string
  name: string
  slackAnnouncement: string
  duration: number // ms
  type: 'all-move' | 'single-agent' | 'visual-only' | 'slack-only'
  targetPosition?: { x: number; y: number }
  agentMessages?: string[]
  managerMessage?: string
  sound?: 'alarm' | 'celebration' | 'doorOpen' | 'error' | 'powerDown' | 'notification' | 'coffee'
}

export const RANDOM_EVENTS: RandomOfficeEvent[] = [
  {
    id: 'fire-drill',
    name: 'Fire Drill',
    slackAnnouncement: '🚨 SIMULASI KEBAKARAN! Semua ke pintu keluar!',
    duration: 6000,
    type: 'all-move',
    targetPosition: { x: 114, y: 105 },
    managerMessage: 'Fire drill! Ayo gerak!',
    agentMessages: ['lagi lagi...', 'gue baru masuk zone!', 'kopi gue!', 'selamatkan codebase-nya!'],
    sound: 'alarm',
  },
  {
    id: 'pizza',
    name: 'Pizza Delivery',
    slackAnnouncement: '🍕 Pizza datang! Makan siang gratis!',
    duration: 5000,
    type: 'all-move',
    targetPosition: { x: 114, y: 105 },
    managerMessage: 'Pizza di lobby!',
    agentMessages: ['PIZZA!', 'akhirnya kabar baik', 'nanas?!', 'gue duluan ambil pepperoni'],
    sound: 'celebration',
  },
  {
    id: 'standup',
    name: 'Daily Standup',
    slackAnnouncement: '📢 @here Daily standup mulai sekarang',
    duration: 7000,
    type: 'all-move',
    targetPosition: { x: 411, y: 417 },
    managerMessage: 'Standup! Siapa yang udah ship apa?',
    agentMessages: ['ngerjain fitur tadi', 'masih debugging', 'blocked nunggu review', 'deploy ke staging', 'benerin 3 bug, bikin 5'],
    sound: 'notification',
  },
  {
    id: 'deploy',
    name: 'Production Deploy',
    slackAnnouncement: '🚀 DEPLOYING KE PRODUCTION...',
    duration: 5000,
    type: 'slack-only',
    managerMessage: 'Tahan napas...',
    agentMessages: ['aduh', 'jangan sampe break', 'gue lupa jalanin test', 'YOLO', 'cek rollback plan'],
    sound: 'notification',
  },
  {
    id: 'deploy-success',
    name: 'Deploy Success',
    slackAnnouncement: '✅ Deploy sukses! Semua sistem hijau 🎉',
    duration: 3000,
    type: 'slack-only',
    managerMessage: 'Kita berhasil!',
    agentMessages: ['letsgo!', 'ship it!', 'kerja bagus tim', 'waktunya minum'],
    sound: 'celebration',
  },
  {
    id: 'deploy-fail',
    name: 'Deploy Failed',
    slackAnnouncement: '💥 DEPLOY GAGAL - ROLLING BACK',
    duration: 4000,
    type: 'slack-only',
    managerMessage: 'SIAPA YANG PUSH INI?!',
    agentMessages: ['bukan gue', 'aduh aduh aduh', 'cek logs', 'selalu aja DNS', 'reverting...'],
    sound: 'error',
  },
  {
    id: 'power-flicker',
    name: 'Power Flicker',
    slackAnnouncement: '⚡ Listrik kedip - simpan kerjaan lo!',
    duration: 3000,
    type: 'visual-only',
    agentMessages: ['lampunya tadi...', 'CTRL+S CTRL+S', 'perubahan gue belum kesave!', 'git commit SEKARANG'],
    sound: 'powerDown',
  },
  {
    id: 'birthday',
    name: 'Birthday',
    slackAnnouncement: '🎂 Selamat ulang tahun! Ada kue di break room!',
    duration: 4000,
    type: 'all-move',
    targetPosition: { x: 287, y: 129 },
    managerMessage: 'Selamat ulang tahun!',
    agentMessages: ['kue!', 'happy birthday!', '🎉🎉🎉', 'ini gluten free?', 'bikin permintaan dulu'],
    sound: 'celebration',
  },
  {
    id: 'who-broke-build',
    name: 'Build Broken',
    slackAnnouncement: '🔴 CI/CD pipeline MERAH. Siapa yang break build?',
    duration: 5000,
    type: 'slack-only',
    managerMessage: 'Nggak ada yang pulang sebelum ini beres.',
    agentMessages: ['cek git blame...', 'bukan gue', 'gara-gara merge?', 'mungkin flaky test?', 'gue salahkan intern'],
    sound: 'error',
  },
  {
    id: 'friday',
    name: 'Friday Vibes',
    slackAnnouncement: '🎉 Udah Jumat! Tinggal sedikit lagi tim!',
    duration: 3000,
    type: 'slack-only',
    managerMessage: 'No deploy hari Jumat.',
    agentMessages: ['TGIF', 'ngopi yuk?', 'satu PR lagi...', 'pulang tepat jam 5', 'akhir pekan!'],
    sound: 'celebration',
  },
  {
    id: 'printer-jam',
    name: 'Printer Jam',
    slackAnnouncement: '🖨️ Printer macet lagi',
    duration: 4000,
    type: 'single-agent',
    targetPosition: { x: 424, y: 132 },
    agentMessages: ['ngapain masih ada printer', 'PC LOAD LETTER?!', 'siapa sih yang nyetak', 'ini 2026...'],
    sound: 'error',
  },
  {
    id: 'slack-down',
    name: 'Slack is Down',
    slackAnnouncement: '💀 Slack lagi mati... eh terus kita posting gimana',
    duration: 3000,
    type: 'slack-only',
    agentMessages: ['ironis banget', 'saatnya pakai email', 'waktunya burung pos', 'sebenarnya adem juga sih'],
    sound: 'notification',
  },
]

// Office drama conversations
export const DRAMA_CONVERSATIONS = [
  {
    trigger: 'coffee-meet',
    messages: [
      { sender: 0, text: 'lu udah liat PR baru?' },
      { sender: 1, text: 'yang 2000 baris itu? iya...' },
      { sender: 0, text: 'testnya juga nggak ada' },
      { sender: 1, text: '💀' },
    ],
  },
  {
    trigger: 'who-pushed',
    messages: [
      { sender: 0, text: 'siapa yang push langsung ke main?' },
      { sender: 1, text: 'bukan gue' },
      { sender: 0, text: 'git blame bilang lain' },
      { sender: 1, text: '...' },
    ],
  },
  {
    trigger: 'tabs-vs-spaces',
    messages: [
      { sender: 0, text: 'tabs atau spaces?' },
      { sender: 1, text: 'spaces lah jelas' },
      { sender: 0, text: 'blocked dan gue laporin' },
    ],
  },
  {
    trigger: 'meeting',
    messages: [
      { sender: 0, text: 'rapat ini bisa jadi pesan slack aja' },
      { sender: 1, text: 'pesan slack ini bisa jadi diem aja' },
    ],
  },
  {
    trigger: 'framework',
    messages: [
      { sender: 0, text: 'kita harus rewrite pakai Rust' },
      { sender: 1, text: 'itu omongan lo tiap minggu' },
      { sender: 0, text: 'dan gue bener tiap minggu' },
    ],
  },
  {
    trigger: 'legacy',
    messages: [
      { sender: 0, text: 'nemu TODO dari 2019' },
      { sender: 1, text: 'isinya apa' },
      { sender: 0, text: '"benerin nanti"' },
      { sender: 1, text: 'nanti udah sekarang' },
      { sender: 0, text: 'nggak. nanti tetap nanti.' },
    ],
  },
  {
    trigger: 'ai',
    messages: [
      { sender: 0, text: 'AI-nya nulis kode lebih bagus dari gue hari ini' },
      { sender: 1, text: 'standarnya emang rendah sih' },
      { sender: 0, text: 'kasar tapi adil' },
    ],
  },
  {
    trigger: 'standup-excuse',
    messages: [
      { sender: 0, text: 'kemarin lu ngapain?' },
      { sender: 1, text: 'ngelidikin isu yang kompleks' },
      { sender: 0, text: 'maksud lu googling 6 jam' },
      { sender: 1, text: 'gue lebih suka disebut "riset"' },
    ],
  },
]

// Slack reactions that randomly appear on messages
export const SLACK_REACTIONS = ['👍', '🔥', '💀', '😂', '🚀', '❤️', '👀', '💯', '🎉', '😅', '🤔', '⚡']

// Dunder Mifflin themed events — used when Office theme is active
export const OFFICE_EVENTS: RandomOfficeEvent[] = [
  {
    id: 'fire-alarm-stress-relief',
    name: 'FIRE! FIRE! FIRE!',
    slackAnnouncement: '🔥 FIRE! FIRE! FIRE! (Dwight lagi ngajarin keselamatan kebakaran)',
    duration: 6000,
    type: 'all-move',
    targetPosition: { x: 114, y: 105 },
    managerMessage: 'Api-nya nyerang kita!',
    agentMessages: ['KEBAKARAN!', 'aduh aduh aduh', 'selamatkan Bandit!', 'GUE NYATAKAN PAILIT!', 'ambil defibrilatornya!'],
    sound: 'alarm',
  },
  {
    id: 'cpr-training',
    name: "Stayin' Alive",
    slackAnnouncement: '🫀 Latihan CPR — ikutin irama Stayin\' Alive',
    duration: 5000,
    type: 'slack-only',
    managerMessage: 'ah ah ah ah, stayin\' alive, stayin\' alive',
    agentMessages: ['dia... udah mati?', 'Dwight lagi motong mukanya', 'gue belajar ini dari ER', 'ah ah ah ah'],
    sound: 'notification',
  },
  {
    id: 'golden-ticket',
    name: 'Golden Ticket',
    slackAnnouncement: '🎫 Lima Golden Ticket disembunyikan di rim kertas — diskon 10%!',
    duration: 4000,
    type: 'slack-only',
    managerMessage: 'Itu ide gue. Semua gue.',
    agentMessages: ['gue salahkan Kevin', 'waktunya Willy Wonka', 'itu murni Michael', 'siapa yang approve ini'],
    sound: 'celebration',
  },
  {
    id: 'jim-prank',
    name: 'Jim Pranks Dwight',
    slackAnnouncement: '🥤 Stapler Dwight dimasukkin jelly lagi',
    duration: 3500,
    type: 'slack-only',
    managerMessage: 'JIM!',
    agentMessages: ['lagi lagi', 'selalu Jim', 'pencurian identitas bukan candaan', 'Pam, tolong'],
    sound: 'notification',
  },
  {
    id: 'parkour',
    name: 'Parkour!',
    slackAnnouncement: '🏃 PARKOUR! PARKOUR! PARKOUR!',
    duration: 4000,
    type: 'visual-only',
    managerMessage: 'PARKOUR!',
    agentMessages: ['parkour!', 'PAR-KOUR', 'Michael jangan', 'ini bakal berakhir buruk'],
    sound: 'celebration',
  },
  {
    id: 'schrute-bucks',
    name: 'Schrute Bucks',
    slackAnnouncement: '💵 Dwight ngeluarin Schrute Bucks. 1/1000 sen.',
    duration: 3000,
    type: 'slack-only',
    agentMessages: ['kursnya berapa?', 'gue keliatan butuh insentif tambahan?', 'gue ambil Stanley nickels aja', 'kenaikan gaji gue mana?'],
    sound: 'notification',
  },
  {
    id: 'kevins-chili',
    name: "Kevin's Chili",
    slackAnnouncement: '🫘 Kevin jatuhin chili. Lagi-lagi.',
    duration: 4000,
    type: 'slack-only',
    managerMessage: 'cuma satu yang bisa dilakukan: ngumpetin pelan-pelan...',
    agentMessages: ['NOOO', 'dia masak dari pagi', 'karpet udah hancur', 'gue udah bilang pakai dua wajan'],
    sound: 'error',
  },
  {
    id: 'printer-jam-dm',
    name: 'Sabre Printer Jam',
    slackAnnouncement: '🖨️ Printer kebakaran lagi. Beneran kebakaran.',
    duration: 4000,
    type: 'single-agent',
    targetPosition: { x: 424, y: 132 },
    agentMessages: ['printer Sabre menyerang lagi', 'GUE UDAH BILANG', 'saatnya telepon Nellie', 'garansinya udah habis'],
    sound: 'error',
  },
  {
    id: 'dundies',
    name: 'The Dundies',
    slackAnnouncement: '🏆 Dundies malam ini!',
    duration: 4000,
    type: 'slack-only',
    managerMessage: 'Lo bakal ketawa, lo bakal nangis...',
    agentMessages: ['waktunya penghargaan Bushiest Beaver', 'Please no lagi', 'gue duluan ambil Best Dad', 'gue bawa Pam ke Chili\'s'],
    sound: 'celebration',
  },
  {
    id: 'pretzel-day',
    name: 'Pretzel Day',
    slackAnnouncement: '🥨 HARI PRETZEL',
    duration: 5000,
    type: 'all-move',
    targetPosition: { x: 287, y: 129 },
    managerMessage: 'Lo nggak ngerti. Ini hari pretzel.',
    agentMessages: ['hari terbaik sepanjang tahun', 'worth tiap kalorinya', 'Stanley udah nunggu setahun', 'semua topping'],
    sound: 'celebration',
  },
  {
    id: 'bears-beets',
    name: 'Bears. Beets. Battlestar Galactica.',
    slackAnnouncement: '📋 Pertanyaan: beruang jenis apa yang paling oke?',
    duration: 3000,
    type: 'slack-only',
    agentMessages: ['salah. black bear.', 'Bears, beets, Battlestar Galactica', 'pencurian identitas bukan candaan, Jim', 'fakta: beruang makan bit'],
    sound: 'notification',
  },
]

import { getTheme } from './theme'

export function pickEvent(): RandomOfficeEvent {
  const isOffice = getTheme() === 'office'

  // Deploy events chain together (kept for both themes)
  if (Math.random() < 0.15) {
    return Math.random() < 0.7
      ? RANDOM_EVENTS.find(e => e.id === 'deploy-success')!
      : RANDOM_EVENTS.find(e => e.id === 'deploy-fail')!
  }

  if (isOffice) {
    // 70% Office-themed, 30% default — keeps things varied
    const useOffice = Math.random() < 0.7
    const pool = useOffice
      ? OFFICE_EVENTS
      : RANDOM_EVENTS.filter(e => e.id !== 'deploy-success' && e.id !== 'deploy-fail')
    return pool[Math.floor(Math.random() * pool.length)]
  }

  const pool = RANDOM_EVENTS.filter(e => e.id !== 'deploy-success' && e.id !== 'deploy-fail')
  return pool[Math.floor(Math.random() * pool.length)]
}
