# Contextual Reading & Idiom Vault

**Contextual Reading & Idiom Vault** adalah aplikasi pembaca artikel bebas distraksi (*distraction-free web reader*) dan manajemen kosakata yang menggabungkan metode **Sentence Mining** (mengumpulkan kosakata & idiom langsung dari bacaan nyata) dengan algoritma pengulangan berjarak **SuperMemo-2 (SM-2)**.

Berbeda dengan aplikasi *flashcard* konvensional yang menghafal kata secara terpisah, aplikasi ini mengikat setiap kata atau idiom dengan kalimat asli tempat kata tersebut pertama kali ditemukan, sehingga pengguna memahami nuansa makna, tata bahasa, dan kolokasinya secara utuh.

---

## ✨ Fitur Utama

### 1. Distraction-Free Web Reader & Multi-Source Importer
* **Input Multi-Sumber:** Mendukung penempelan teks artikel langsung, ekstraksi otomatis dari tautan artikel/blog, serta unggahan file teks atau subtitle (`.txt` / `.srt`).
* **Indikator Text Coverage:** Menghitung persentase kata dalam artikel yang sudah dikuasai pengguna sebelum mulai membaca (mis. *"93% kosakata di artikel ini sudah ada di Vault kamu"*).

### 2. One-Click Sentence Mining (Auto-Context Extraction)
* **Blok & Simpan Sekaligus Konteksnya:** Menggunakan `window.getSelection()` dan *Sentence Boundary Detection (SBD)* untuk otomatis menyalin satu kalimat utuh tempat kata atau frasa idiom (mis. *"bite the bullet"*) berada ke dalam database.
* **Kamus Pop-up & Tagging:** Menampilkan definisi cepat secara *hybrid* disertai opsi catatan pribadi dan kategori label (`Idiom`, `Phrasal Verb`, `Academic`, `Slang`).

### 3. NLP Lemmatization & Smart Highlighting
* **Deteksi Bentuk Dasar Kata (*Lemma*):** Mengenali perubahan bentuk kata akibat *tense* atau jumlah (mis. *"ran into"* dan *"running into"* dicocokkan ke bentuk dasar `"run into"`).
* **Sorotan Warna Otomatis:**
  * 🟨 **Kuning (*Learning*):** Kata yang sedang dipelajari.
  * 🟥 **Merah Muda (*Leech*):** Kata yang sering salah dijawab pada sesi *review*.
  * ⬜ **Normal (Tanpa Sorotan):** Kata yang sudah dikuasai.

### 4. Kuis Cloze Deletion & Multi-Context Hint
* **Ujian Berbasis Konteks Asli:** Menampilkan kalimat dari artikel yang pernah dibaca pengguna dengan bagian kata/idiom yang dikosongkan (`[ ............... ]`).
* **Multi-Context Hint:** Tombol **"Lihat Kalimat Lain"** untuk menampilkan petunjuk kalimat dari artikel berbeda jika kata tersebut pernah ditemukan di lebih dari satu bacaan.

### 5. Penjadwalan Otomatis SuperMemo-2 (SM-2)
Menghitung jadwal *review* berikutnya berdasarkan umpan balik **Again** (Lupa), **Hard** (Sulit), **Good** (Ingat), atau **Easy** (Sangat Mudah) menggunakan variabel *Repetition ($n$)*, *Easiness Factor ($EF$)*, dan *Interval ($I$)*:

$$I_1 = 1\text{ hari}, \quad I_2 = 6\text{ hari}, \quad I_n = \text{round}(I_{n-1} \times EF)$$

$$EF' = \max\left(1.3,\; EF + (0.1 - (5 - q) \times (0.08 + (5 - q) \times 0.02))\right)$$

### 6. Dashboard Analitik & Mastery Heatmap
* **Streak & Contribution Graph:** Visualisasi aktivitas belajar harian bergaya kontribusi GitHub.
* **Distribusi Retensi (Recharts):** Perbandingan status penguasaan kosakata antara **New**, **Learning** ($< 7\text{ hari}$), **Young** ($7\text{–}21\text{ hari}$), dan **Mature** ($> 21\text{ hari}$).

---

## 🛠️ Tech Stack & Arsitektur

| Lapisan Sistem | Teknologi | Peran dalam Aplikasi |
| :--- | :--- | :--- |
| **Frontend** | ReactJS, TypeScript, Tailwind CSS | *Web Reader* interaktif, *Selection API* (`window.getSelection()`), & UI kuis *Cloze Deletion*. |
| **Visualisasi Data** | Recharts | Grafik pertumbuhan kosakata, kurva retensi, & distribusi penguasaan kata. |
| **Core Backend** | Node.js, Express.js | Autentikasi JWT, CRUD artikel & kosakata, serta kalkulasi penjadwalan SM-2. |
| **NLP Microservice** | Python, FastAPI, spaCy | *Sentence tokenization (SBD)*, *lemmatization*, dan *POS Tagging*. |
| **Database & ORM** | PostgreSQL, Prisma | Relasi *many-to-many* antara kosakata/idiom dengan kalimat konteks lintas artikel. |
| **Testing** | Jest, React Testing Library, Pytest | *Unit testing* rumus matematika SM-2, pipeline NLP, dan komponen interaktif UI. |
| **DevOps** | Docker, Vercel, Render | Orkestrasi lokal via `docker-compose.yml` dan *deployment* cloud. |

---

## 🚀 Menjalankan Proyek Secara Lokal (Docker)

```bash
# 1. Salin konfigurasi environment
cp .env.example .env

# 2. Jalankan seluruh layanan (PostgreSQL, FastAPI NLP, Express API, React Web)
docker compose up --build
```

* **Frontend Web:** `http://localhost:5173`
* **Core Backend API:** `http://localhost:4000/api/v1`
* **NLP Microservice:** `http://localhost:8000/nlp/v1`

---

## 👤 Author & License

Developed and maintained by **Ardy Nugroho** ([@vierkzme](https://github.com/vierkzme)).

Copyright © 2026 **Ardy Nugroho (@vierkzme)**. All Rights Reserved.  
Lihat file [LICENSE](./LICENSE) untuk ketentuan hak cipta dan larangan klaim ulang (*Anti-Plagiarism & Portfolio Source-Available License*).
