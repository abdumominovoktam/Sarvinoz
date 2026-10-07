# Kompyuterda sonlarni tasvirlash va qayta ishlash. Sanoq sistemalari — Interaktiv Bilimni Baholash Platformasi

Talabalarning **ikkilik (Binary)**, **sakkizlik (Octal)**, **o‘nlik (Decimal)** va **o‘n oltilik (Hexadecimal)** sanoq sistemalari, razryad va xona qiymatlari, 2 ning darajalari hamda ikkilik arifmetika bo‘yicha bilimlarini **8 ta interaktiv o‘yin** orqali tekshiruvchi to‘liq full-stack veb-platforma.

---

## Arxitektura va Texnologiyalar

### Frontend (`/frontend`)
- **React 18 + TypeScript + Vite**
- **Tailwind CSS** (`#007A63` Primary Emerald, `#005F4F` Dark, `#F7FBFA` Background, `#FFFFFF` Card, `#D6E5E1` Border)
- **Lucide Icons** va **Framer Motion** animatsiyalari
- **Ko‘p tilli arxitektura (i18n)**: `O‘zbek` (asosiy), `Русский`, `English`

### Backend (`/backend`)
- **Python + Django + Django REST Framework (DRF)**
- **JWT Authentication** (`djangorestframework-simplejwt`) + Password Hashing + Rate Limiting + RBAC
- **Database**: **PostgreSQL** (`USE_POSTGRES=True` orqali) hamda tezkor lokal ishga tushirish uchun **SQLite** fallback
- **Server-Authoritative Timer & Ball Hisoblash**: Umumiy 50 daqiqalik vaqt budjeti va har bir o‘yinning alohida taymeri serverda nazorat qilinadi (DevTools orqali o‘zgartirib bo‘lmaydi)
- **Anti-Cheat tizimi**: Tab almashtirish (`visibilitychange`), oynadan chiqish (`blur`), Fullscreen'dan chiqish hodisalarini serverga (`ViolationLog`) yozib boradi va 3-marta takrorlanganda o‘yinni `"Qoidabuzildi"` holatiga o‘tkazadi.

---

## 8 ta Interaktiv O‘yin va Ballar Tizimi

| # | O‘yin nomi | Vaqt | Maksimal Ball | Mexanika |
|---|---|---|---|---|
| **#1** | **Tezkor viktorina** | 10 daqiqa | 180 ball | 4 variantli (A, B, C, D) random savollar va tezkor izohli feedback |
| **#2** | **Krossvord** | 8 daqiqa | 120 ball | Kataklarga sanoq sistemasi terminlarini kiritish va avtomatik tekshirish |
| **#3** | **So‘z qidiruv** | 5 daqiqa | 104 ball | 10×10 harflar jadvalidan yashiringan 8 ta terminni belgilash |
| **#4** | **Harflar bo‘shliqtirmasi** | 4 daqiqa | 70 ball | Aralashtirilgan harflardan (`RYBANI → BINARY`) to‘g‘ri terminni yig‘ish |
| **#5** | **Jarayon zanjiri** | 6 daqiqa | 45 ball | Konvertatsiya va ikkilik qo‘shish algoritmi qadamlarini Drag & Drop tartiblash |
| **#6** | **Tushuncha — ta’rif bog‘lash** | 6 daqiqa | 100 ball | Chap ustundagi terminlarni o‘ng ustundagi ilmiy ta’riflar bilan juftlash |
| **#7** | **Bingo** | 5 daqiqa | 128 ball | 4×4 Bingo jadvalidan berilgan konvertatsiya savollariga mos qiymatni topish |
| **#8** | **Chizmadan qidiruv** | 6 daqiqa | 120 ball | 8-bitli registr, pozitsion sxema, summator, tetrada va triada chizmalarini tahlil qilish |
| **Jami** | **8 ta o‘yin** | **50 daqiqa** | **867 ball** | Server tomonidan tasdiqlanadigan adolatli baholash |

---

## Loyihani O‘rnatish va Ishga Tushirish (Installation & Setup)

### 1. Environment o‘zgaruvchilari (`.env`)
Loyiha ildizidagi `.env.example` faylidan `.env` nusxa oling:
```powershell
Copy-Item .env.example .env
```
- Lokal tezkor ishga tushirish uchun `USE_POSTGRES=False` holatida qoldiring (avtomatik `db.sqlite3` ishlatiladi).
- **PostgreSQL** ulash uchun `.env` ichida `USE_POSTGRES=True`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` qiymatlarini kiriting.

### 2. Backend o‘rnatish, Migratsiya va Seed Data
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Database migratsiyalarini yaratish va qo'llash
python manage.py makemigrations
python manage.py migrate

# Boshlang'ich ma'lumotlarni yuklash (8 ta o'yin, 79 ta savol, 4 ta guruh, 24 ta talaba va Admin)
python manage.py seed_data
```

### 3. Yangi Admin foydalanuvchi yaratish (ixtiyoriy)
`seed_data` buyrug‘i avtomatik ravishda tayyor admin yaratadi (`admin@sarvinoz.uz` / `admin123`). Qo‘shimcha superuser yaratish uchun:
```powershell
python manage.py createsuperuser
```

### 4. Backend serverni ishga tushirish
```powershell
cd backend
.\venv\Scripts\python.exe manage.py runserver 8000
```
Backend API manzili: `http://localhost:8000/api/`

### 5. Frontend o‘rnatish va ishga tushirish
Yangi terminal oynasida:
```powershell
cd frontend
npm install
npm run dev
```
Frontend manzili: `http://localhost:5173`

---

## Tayyor Demo Hisoblar (Sinov uchun)

- **Administrator (Admin Panel, Statistika, Savollar CRUD, CSV/Excel Eksport)**:
  - **Email**: `admin@sarvinoz.uz`
  - **Parol**: `admin123`
- **Talaba (Tayyor natija va taqqoslashni ko‘rish uchun)**:
  - **Email**: `oktam.abdumominov@student.uz`
  - **Parol**: `student123`
- **Yangi talaba sifatida to‘liq oqimni sinash**:
  - Birinchi sahifada (**Ro‘yxatdan o‘tish**) ism, familiya, guruh (`162-23`), email va parol kiritib ro‘yxatdan o‘ting → **Qoidalar** sahifasini tasdiqlang → **Dashboard** orqali 8 ta o‘yinni bajaring.

---

## Testlarni ishga tushirish
```powershell
cd backend
.\venv\Scripts\python.exe manage.py test
```

## Production Deployment
1. `.env` faylida `DEBUG=False`, mustahkam `SECRET_KEY`, `ALLOWED_HOSTS=yourdomain.uz` va `USE_POSTGRES=True` o‘rnating.
2. Backend uchun `gunicorn config.wsgi:application --bind 0.0.0.0:8000` va `python manage.py collectstatic --noinput` buyruqlarini bajaring.
3. Frontend uchun `npm run build` orqali `frontend/dist` katalogini hosil qiling va Nginx / Caddy orqali xizmatga chiqaring.
