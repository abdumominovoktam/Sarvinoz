import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction

from apps.users.models import User, Group, StudentProfile, RuleAcceptance
from apps.games.models import Game, Question
from apps.results.models import GameResult, ViolationLog
from apps.leaderboard.services import update_user_aggregates, recalculate_all_rankings


class Command(BaseCommand):
    help = "Seeds the database with 8 interactive games, rich number-systems questions, groups, 24 students, and leaderboard data."

    @transaction.atomic
    def handle(self, *args, **options):
        from apps.games.models import GameSession, Answer
        self.stdout.write("Cleaning database (removing demo students, sessions, results, and groups)...")
        Answer.objects.all().delete()
        GameSession.objects.all().delete()
        GameResult.objects.all().delete()
        ViolationLog.objects.all().delete()
        RuleAcceptance.objects.all().delete()
        User.objects.filter(role='student').delete()
        Group.objects.all().delete()

        self.stdout.write("Seeding admin user...")
        admin_user, _ = User.objects.get_or_create(
            email='admin@sarvinoz.uz',
            defaults={
                'first_name': 'Sarvinoz',
                'last_name': 'Adminova',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
                'group': None,
            }
        )
        admin_user.set_password('admin123')
        admin_user.role = 'admin'
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.group = None
        admin_user.save()
        StudentProfile.objects.update_or_create(
            user=admin_user,
            defaults={'rules_accepted': True, 'rules_accepted_at': timezone.now()}
        )

        self.stdout.write("Seeding 8 Interactive Games...")
        games_spec = [
            {
                'order': 1,
                'slug': 'quiz',
                'title': 'Tezkor viktorina',
                'description': 'Sanoq sistemalari, bit va bayt, pozitsion qiymat hamda ikkilik arifmetikaga oid 4 variantli tezkor test savollari.',
                'game_type': 'quiz',
                'duration_seconds': 600,  # 10 min
                'max_score': 180,
                'icon_name': 'Zap',
            },
            {
                'order': 2,
                'slug': 'crossword',
                'title': 'Krossvord',
                'description': 'Ta’rif va izohlarni o‘qib, sanoq sistemalari hamda kompyuter arxitekturasiga oid terminlarni kataklarga joylashtiring.',
                'game_type': 'crossword',
                'duration_seconds': 480,  # 8 min
                'max_score': 120,
                'icon_name': 'Grid',
            },
            {
                'order': 3,
                'slug': 'word-search',
                'title': 'So‘z qidiruv',
                'description': '10x10 harflar jadvalidan sanoq sistemalariga oid yashiringan 8 ta muhim terminni toping va belgilang.',
                'game_type': 'word_search',
                'duration_seconds': 300,  # 5 min
                'max_score': 104,
                'icon_name': 'Search',
            },
            {
                'order': 4,
                'slug': 'scramble',
                'title': 'Harflar bo‘shliqtirmasi',
                'description': 'Aralashtirilgan harflarni to‘g‘ri ketma-ketlikda joylashtirib, yashiringan informatik terminni hosil qiling.',
                'game_type': 'scramble',
                'duration_seconds': 240,  # 4 min
                'max_score': 70,
                'icon_name': 'Shuffle',
            },
            {
                'order': 5,
                'slug': 'process-chain',
                'title': 'Jarayon zanjiri',
                'description': 'Sonlarni bir sanoq sistemasidan boshqasiga o‘tkazish va ikkilik qo‘shish algoritmi bosqichlarini to‘g‘ri tartibga keltiring.',
                'game_type': 'process_chain',
                'duration_seconds': 360,  # 6 min
                'max_score': 45,
                'icon_name': 'ListChecks',
            },
            {
                'order': 6,
                'slug': 'matching',
                'title': 'Tushuncha — ta’rif bog‘lash',
                'description': 'Chap ustundagi sanoq sistemasi tushunchalarini o‘ng ustundagi aniq ilmiy ta’riflari bilan moslashtiring.',
                'game_type': 'matching',
                'duration_seconds': 360,  # 6 min
                'max_score': 100,
                'icon_name': 'Puzzle',
            },
            {
                'order': 7,
                'slug': 'bingo',
                'title': 'Bingo',
                'description': '4x4 Bingo jadvalidan berilgan binary, decimal, octal va hexadecimal savollarga mos qiymat kataklarini tezda toping.',
                'game_type': 'bingo',
                'duration_seconds': 300,  # 5 min
                'max_score': 128,
                'icon_name': 'Target',
            },
            {
                'order': 8,
                'slug': 'diagram-search',
                'title': 'Chizmadan qidiruv',
                'description': 'Vizual bit registrlari, pozitsion sxemalar va ikkilik summator diagrammalarini tahlil qilib, noma’lum qiymatni aniqlang.',
                'game_type': 'diagram',
                'duration_seconds': 360,  # 6 min
                'max_score': 120,
                'icon_name': 'Brain',
            },
        ]

        games_by_order = {}
        for spec in games_spec:
            game_obj, _ = Game.objects.update_or_create(
                order=spec['order'],
                defaults=spec,
            )
            games_by_order[spec['order']] = game_obj

        # Re-seed questions and clear active sessions cleanly so they stay consistent
        from apps.games.models import GameSession
        GameSession.objects.all().delete()
        Question.objects.all().delete()

        # ==================================================
        # GAME #1: TEZKOR VIKTORINA (15 questions)
        # ==================================================
        g1 = games_by_order[1]
        quiz_questions = [
            {
                'text': "Ikkilik (Binary) sanoq sistemasining asosi nechaga teng va unda qaysi raqamlar qatnashadi?",
                'options': {'A': 'Asosi 2 ga teng; faqat 0 va 1 raqamlari', 'B': 'Asosi 2 ga teng; 1 va 2 raqamlari', 'C': 'Asosi 8 ga teng; 0 dan 7 gacha raqamlar', 'D': 'Asosi 10 ga teng; 0 dan 9 gacha raqamlar'},
                'ans': 'A',
                'diff': 'Easy',
                'exp': "Ikkilik sanoq sistemasining asosi 2 ga teng bo‘lib, faqat 0 va 1 (bit) raqamlaridan foydalaniladi.",
            },
            {
                'text': "1 bayt (Byte) necha bitdan iborat?",
                'options': {'A': '4 bit', 'B': '8 bit', 'C': '16 bit', 'D': '1024 bit'},
                'ans': 'B',
                'diff': 'Easy',
                'exp': "Standart kompyuter arxitekturasida 1 bayt = 8 bit ga teng.",
            },
            {
                'text': "O‘nlik sanoq sistemasidagi 25₁₀ soni ikkilik (Binary) sanoq sistemasida qanday ifodalanadi?",
                'options': {'A': '11001₂', 'B': '10101₂', 'C': '11010₂', 'D': '10011₂'},
                'ans': 'A',
                'diff': 'Medium',
                'exp': "25 = 16 + 8 + 1 = 1×2⁴ + 1×2³ + 0×2² + 0×2¹ + 1×2⁰ = 11001₂.",
            },
            {
                'text': "Ikkilikdagi 101101₂ sonining o‘nlik (Decimal) qiymati nechaga teng?",
                'options': {'A': '43', 'B': '45', 'C': '47', 'D': '53'},
                'ans': 'B',
                'diff': 'Medium',
                'exp': "101101₂ = 32 + 0 + 8 + 4 + 0 + 1 = 45₁₀.",
            },
            {
                'text': "O‘n oltilik (Hexadecimal) sanoq sistemasida 'F' harfi o‘nlik sanoq sistemasidagi qaysi songa mos keladi?",
                'options': {'A': '14', 'B': '15', 'C': '16', 'D': '10'},
                'ans': 'B',
                'diff': 'Easy',
                'exp': "Hexadecimalda A=10, B=11, C=12, D=13, E=14, F=15 ga teng.",
            },
            {
                'text': "Kompyuterlar nima sababdan axborotni saqlash va qayta ishlashda aynan ikkilik (Binary) sanoq sistemasidan foydalanadi?",
                'options': {
                    'A': 'Elektron tranzistorlarning 2 ta barqaror holati (tok bor = 1, tok yo‘q = 0) mavjudligi sababli',
                    'B': 'Ikkilik sonlar ekranda kam joy egallagani uchun',
                    'C': 'Odamlar uchun o‘qish oson bo‘lgani uchun',
                    'D': 'Faqat manfiy sonlarni hisoblash uchun'
                },
                'ans': 'A',
                'diff': 'Easy',
                'exp': "Raqamli mantiqiy elementlar va tranzistorlar ikki holatda (yuqori/past kuchlanish — 1 va 0) ishonchli va xatosiz ishlaydi.",
            },
            {
                'text': "Sakkizlik (Octal) sanoq sistemasida quyidagi sonlardan qaysi biri mavjud EMAS?",
                'options': {'A': '57₈', 'B': '70₈', 'C': '81₈', 'D': '17₈'},
                'ans': 'C',
                'diff': 'Easy',
                'exp': "Sakkizlik sanoq sistemasida faqat 0..7 raqamlari ishlatiladi, '8' raqami qatnashmaydi.",
            },
            {
                'text': "Ikkilik arifmetikada 1011₂ + 0111₂ yig‘indisi nechaga teng?",
                'options': {'A': '10010₂', 'B': '10001₂', 'C': '1110₂', 'D': '10100₂'},
                'ans': 'A',
                'diff': 'Medium',
                'exp': "11₁₀ + 7₁₀ = 18₁₀ = 10010₂.",
            },
            {
                'text': "Ikkilik ayirish amalini bajaring: 10100₂ − 00111₂ = ?",
                'options': {'A': '01101₂', 'B': '01011₂', 'C': '01111₂', 'D': '10001₂'},
                'ans': 'A',
                'diff': 'Hard',
                'exp': "20₁₀ − 7₁₀ = 13₁₀ = 8 + 4 + 1 = 01101₂.",
            },
            {
                'text': "O‘n oltilik sanoq sistemasidagi bir raqam (hex digit) ikkilik sanoq sistemasida aniq necha bit (tetrada) bilan ifodalanadi?",
                'options': {'A': '2 bit', 'B': '3 bit', 'C': '4 bit', 'D': '8 bit'},
                'ans': 'C',
                'diff': 'Easy',
                'exp': "2⁴ = 16 bo‘lgani sababli har bir hexadecimal raqam aniq 4 bit (1 nibble / tetrada) ga teng.",
            },
            {
                'text': "2⁸ (2 ning 8-darajasi) qiymati nechaga teng?",
                'options': {'A': '128', 'B': '255', 'C': '256', 'D': '512'},
                'ans': 'C',
                'diff': 'Easy',
                'exp': "2⁸ = 256. 1 bayt yordamida 256 xil (0 dan 255 gacha) qiymatni kodlash mumkin.",
            },
            {
                'text': "Qaysi sanoq sistemasida raqamning qiymati uning sonda turgan o‘rniga (razryadiga) bog‘liq bo‘ladi?",
                'options': {'A': 'Pozitsion sanoq sistemasida', 'B': 'Nopozitsion sanoq sistemasida', 'C': 'Rim sanoq sistemasida', 'D': 'Unar sanoq sistemasida'},
                'ans': 'A',
                'diff': 'Easy',
                'exp': "Pozitsion sanoq sistemalarida (2, 8, 10, 16 lik) raqamning salmog‘i u joylashgan xona (razryad) darajasiga bog‘liq.",
            },
            {
                'text': "2A₁₆ (Hexadecimal) sonini o‘nlik (Decimal) sanoq sistemasiga o‘tkazing:",
                'options': {'A': '32', 'B': '40', 'C': '42', 'D': '46'},
                'ans': 'C',
                'diff': 'Medium',
                'exp': "2A₁₆ = 2 × 16¹ + 10 × 16⁰ = 32 + 10 = 42₁₀.",
            },
            {
                'text': "Sakkizlik sanoq sistemasidagi 75₈ soni ikkilik (Binary) sanoq sistemasida qanday yoziladi?",
                'options': {'A': '111101₂', 'B': '110101₂', 'C': '111011₂', 'D': '101111₂'},
                'ans': 'A',
                'diff': 'Medium',
                'exp': "7₈ = 111₂ va 5₈ = 101₂, demak 75₈ = 111101₂.",
            },
            {
                'text': "8 bitli ishorasiz (unsigned) baytda ifodalash mumkin bo‘lgan ENG KATTA butun son qaysi?",
                'options': {'A': '127', 'B': '255', 'C': '256', 'D': '511'},
                'ans': 'B',
                'diff': 'Medium',
                'exp': "8 ta bitning barchasi 1 bo‘lganda: 11111111₂ = 2⁸ − 1 = 255₁₀.",
            },
        ]
        for q in quiz_questions:
            Question.objects.create(
                game=g1,
                question_text=q['text'],
                question_type='multiple_choice',
                options=q['options'],
                correct_answer=q['ans'],
                points=15,
                difficulty=q['diff'],
                explanation=q['exp'],
            )

        # ==================================================
        # GAME #2: KROSSVORD (12 intersecting 2D words: 5 Gorizontal + 7 Vertikal)
        # ==================================================
        g2 = games_by_order[2]
        crossword_items = [
            {
                'clue_number': 1,
                'direction': 'vertikal',
                'row': 0,
                'col': 1,
                'word': 'DECIMAL',
                'clue': "Kundalik hayotda ishlatiladigan, asosi 10 ga teng bo‘lgan o‘nlik sanoq sistemasi",
                'diff': 'Easy',
            },
            {
                'clue_number': 2,
                'direction': 'vertikal',
                'row': 0,
                'col': 9,
                'word': 'BIT',
                'clue': "Kompyuter xotirasidagi eng kichik axborot o‘lchov birligi (0 yoki 1)",
                'diff': 'Easy',
            },
            {
                'clue_number': 3,
                'direction': 'gorizontal',
                'row': 2,
                'col': 7,
                'word': 'BYTE',
                'clue': "8 ta ketma-ket bitdan tashkil topgan axborot birligi",
                'diff': 'Easy',
            },
            {
                'clue_number': 4,
                'direction': 'vertikal',
                'row': 1,
                'col': 10,
                'word': 'HEX',
                'clue': "Asosi 16 ga teng sanoq sistemasining qisqartma nomi (0–9 va A–F)",
                'diff': 'Easy',
            },
            {
                'clue_number': 5,
                'direction': 'gorizontal',
                'row': 3,
                'col': 0,
                'word': 'BINARY',
                'clue': "Faqat 0 va 1 raqamlaridan tashkil topgan 2 asosli sanoq sistemasi",
                'diff': 'Easy',
            },
            {
                'clue_number': 6,
                'direction': 'vertikal',
                'row': 3,
                'col': 4,
                'word': 'RAZRYAD',
                'clue': "Pozitsion sanoq sistemasida raqam joylashgan o‘rin (xona) nomi",
                'diff': 'Medium',
            },
            {
                'clue_number': 7,
                'direction': 'vertikal',
                'row': 3,
                'col': 8,
                'word': 'ARIFMETIKA',
                'clue': "Ikkilik sonlar ustida qo‘shish, ayirish va ko‘paytirish amallarini o‘rganuvchi bo‘lim",
                'diff': 'Medium',
            },
            {
                'clue_number': 8,
                'direction': 'vertikal',
                'row': 4,
                'col': 12,
                'word': 'SON',
                'clue': "Miqdor va hisobni ifodalovchi asosiy matematik tushuncha",
                'diff': 'Easy',
            },
            {
                'clue_number': 9,
                'direction': 'gorizontal',
                'row': 5,
                'col': 5,
                'word': 'POZITSION',
                'clue': "Raqamning qiymati u joylashgan xona (o‘rin) darajasiga bog‘liq bo‘lgan sanoq sistemasi turi",
                'diff': 'Medium',
            },
            {
                'clue_number': 10,
                'direction': 'vertikal',
                'row': 5,
                'col': 6,
                'word': 'OCTAL',
                'clue': "Asosi 8 ga teng bo‘lgan va 0 dan 7 gacha raqamlardan foydalanadigan sanoq sistemasi",
                'diff': 'Easy',
            },
            {
                'clue_number': 11,
                'direction': 'gorizontal',
                'row': 8,
                'col': 0,
                'word': 'TETRADA',
                'clue': "Bir o‘n oltilik raqamni ifodalovchi 4 ta ikkilik bitlar guruhi",
                'diff': 'Medium',
            },
            {
                'clue_number': 12,
                'direction': 'gorizontal',
                'row': 12,
                'col': 7,
                'word': 'MANTIQ',
                'clue': "Kompyuter sxemalarida 0 (yolg‘on) va 1 (rost) amallariga asoslangan fikrlash qonuniyati",
                'diff': 'Medium',
            },
        ]
        for item in crossword_items:
            Question.objects.create(
                game=g2,
                question_text=item['clue'],
                question_type='crossword_clue',
                options={
                    'clue_number': item['clue_number'],
                    'length': len(item['word']),
                    'direction': item['direction'],
                    'row': item['row'],
                    'col': item['col'],
                },
                correct_answer=item['word'],
                points=10,
                difficulty=item['diff'],
                explanation=f"To‘g‘ri javob: {item['word']} ({len(item['word'])} harf).",
            )

        # ==================================================
        # GAME #3: SO‘Z QIDIRUV (13 words)
        # ==================================================
        g3 = games_by_order[3]
        word_search_items = [
            ('BINARY', "2 lik sanoq sistemasi (0 va 1)", 'Easy'),
            ('DECIMAL', "10 lik sanoq sistemasi (0..9)", 'Easy'),
            ('OCTAL', "8 lik sanoq sistemasi (0..7)", 'Easy'),
            ('HEXADECIMAL', "16 lik sanoq sistemasi", 'Medium'),
            ('RAZRYAD', "Sondagi raqamning pozitsiyasi (xonasi)", 'Medium'),
            ('POZITSION', "O‘rniga qarab qiymati o‘zgaruvchi sistema", 'Medium'),
            ('ARIFMETIKA', "Sonlar ustida amallar bajarish", 'Medium'),
            ('ALGORITM', "Aniq ko‘rsatmalar ketma-ketligi", 'Medium'),
            ('TETRADA', "4 ta bitdan iborat guruh", 'Medium'),
            ('TRIADA', "3 ta bitdan iborat guruh (sakkizlik uchun)", 'Medium'),
            ('BYTE', "8 bitdan iborat xotira birligi", 'Easy'),
            ('BIT', "Axborotning eng kichik birligi", 'Easy'),
            ('KOD', "Maxsus belgilar tizimi", 'Easy'),
        ]
        for word, clue, diff in word_search_items:
            Question.objects.create(
                game=g3,
                question_text=clue,
                question_type='word_search_item',
                options={'word_length': len(word), 'target_word': word},
                correct_answer=word,
                points=8,
                difficulty=diff,
                explanation=f"Topilgan so‘z: {word} — {clue}.",
            )

        # ==================================================
        # GAME #4: HARFLAR BO‘SHLIQTIRMASI (7 words)
        # ==================================================
        g4 = games_by_order[4]
        scramble_items = [
            ('RYBANI', 'BINARY', "Kompyuterning asosiy 2 lik sanoq sistemasi.", 'Easy'),
            ('LACMIDE', 'DECIMAL', "O‘nlik sanoq sistemasi (asosi 10).", 'Easy'),
            ('TCOAL', 'OCTAL', "Sakkizlik sanoq sistemasi (asosi 8).", 'Easy'),
            ('XHE', 'HEX', "O‘n oltilik sanoq sistemasining qisqa nomi.", 'Easy'),
            ('RZYADRA', 'RAZRYAD', "Pozitsion sanoq sistemasidagi raqam xonasi.", 'Medium'),
            ('YETB', 'BYTE', "8 bitga teng bo‘lgan axborot birligi.", 'Easy'),
            ('RITLGAOM', 'ALGORITM', "Amallarni bajarishning aniq ketma-ketligi.", 'Medium'),
        ]
        for scrambled, answer, hint, diff in scramble_items:
            Question.objects.create(
                game=g4,
                question_text=hint,
                question_type='scramble_word',
                options={
                    'scrambled': scrambled,
                    'letters': list(scrambled),
                    'length': len(answer),
                },
                correct_answer=answer,
                points=10,
                difficulty=diff,
                explanation=f"{scrambled} → {answer}",
            )

        # ==================================================
        # GAME #5: JARAYON ZANJIRI (3 algorithmic chains)
        # ==================================================
        g5 = games_by_order[5]
        chains = [
            {
                'title': "O‘nlik (Decimal) butun sonni ikkilik (Binary) sanoq sistemasiga o‘tkazish algoritmi bosqichlarini to‘g‘ri tartibda joylashtiring:",
                'steps': [
                    "Berilgan o‘nlik sonni 2 ga (sanoq sistemasi asosiga) bo‘lish",
                    "Bo‘lishdan hosil bo‘lgan qoldiqni (0 yoki 1) alohida qayd etish",
                    "Bo‘linmaning butun qismini yana 2 ga bo‘lishda davom etish",
                    "Bo‘linma 0 ga teng bo‘lgunga qadar jarayonni takrorlash",
                    "Hosil bo‘lgan barcha qoldiqlarni oxirgisidan birinchisiga qarab teskari tartibda yozish",
                ],
                'diff': 'Medium',
            },
            {
                'title': "Ikkilik (Binary) sonni o‘n oltilik (Hexadecimal) sanoq sistemasiga tezkor o‘tkazish bosqichlarini tartiblang:",
                'steps': [
                    "Ikkilik sonni o‘ngdan chapga qarab 4 tadan bit (tetrada) guruhlariga ajratish",
                    "Agar eng chapdagi guruhda 4 ta bit yetishmasa, uning oldiga 0 lar qo‘shib to‘ldirish",
                    "Har bir 4 bitli guruhning o‘nlik qiymatini (0 dan 15 gacha) hisoblash",
                    "10 dan 15 gacha bo‘lgan qiymatlarni A, B, C, D, E, F harflariga almashtirish",
                    "Hosil bo‘lgan o‘n oltilik raqamlarni ketma-ket birlashtirib natijani yozish",
                ],
                'diff': 'Medium',
            },
            {
                'title': "Ikkilik sanoq sistemasida ikki sonni ustun shaklida qo‘shish (Binary Addition) algoritmini tartiblang:",
                'steps': [
                    "Ikki ikkilik sonni eng kichik razryadlari (o‘ng tomoni) bo‘yicha ustma-ust tekislash",
                    "Qo‘shishni eng o‘ngdagi (0-razryad) bitlardan boshlash",
                    "0+0=0, 0+1=1, 1+0=1 qoidasi bo‘yicha yig‘indini yozish",
                    "Agar 1+1 bo‘lsa, natijaga 0 yozib, keyingi yuqori razryadga 1 (dilda/carry) o‘tkazish",
                    "Barcha razryadlar va oxirgi ko‘chirma (carry) bitni hisoblab yakuniy ikkilik sonni olish",
                ],
                'diff': 'Hard',
            },
        ]
        for ch in chains:
            shuffled = list(ch['steps'])
            random.shuffle(shuffled)
            if shuffled == ch['steps']:
                shuffled = shuffled[1:] + shuffled[:1]
            Question.objects.create(
                game=g5,
                question_text=ch['title'],
                question_type='process_chain',
                options={'shuffled_steps': shuffled},
                correct_answer=ch['steps'],
                points=15,
                difficulty=ch['diff'],
                explanation="Algoritmik qadamlar ketma-ketligi to‘g‘ri bajarilgandagina konvertatsiya xatosiz chiqadi.",
            )

        # ==================================================
        # GAME #6: TUSHUNCHA — TA’RIF BOG‘LASH (8 pairs)
        # ==================================================
        g6 = games_by_order[6]
        matching_pairs = [
            ('Binary', "Asosi 2 ga teng bo‘lgan, faqat 0 va 1 raqamlaridan foydalanadigan sanoq sistemasi"),
            ('Bit', "Kompyuterda axborotni o‘lchashning eng kichik birligi (0 yoki 1)"),
            ('Byte', "8 ta ketma-ket bitdan tashkil topgan xotira birligi (256 xil holat)"),
            ('Hexadecimal', "Asosi 16 ga teng bo‘lgan sanoq sistemasi (0–9 raqamlari va A–F harflari)"),
            ('Octal', "Asosi 8 ga teng bo‘lgan sanoq sistemasi (0 dan 7 gacha raqamlar)"),
            ('Decimal', "Kundalik hayotda qo‘llaniladigan, asosi 10 ga teng bo‘lgan sanoq sistemasi"),
            ('Razryad', "Pozitsion sanoq sistemasida raqamning sonda egallagan o‘rni (xonasi)"),
            ('Pozitsion sistema', "Raqamning qiymati u joylashgan o‘rniga (darajasiga) bog‘liq bo‘lgan sanoq sistemasi"),
        ]
        for term, definition in matching_pairs:
            Question.objects.create(
                game=g6,
                question_text=term,
                question_type='concept_match',
                options={'term': term},
                correct_answer=definition,
                points=12,
                difficulty='Medium',
                explanation=f"{term} — {definition}.",
            )

        # ==================================================
        # GAME #7: BINGO (10 prompts on 4x4 grid)
        # ==================================================
        g7 = games_by_order[7]
        bingo_prompts = [
            ("O‘nlikdagi 2₁₀ sonining binary (ikkilik) ko‘rinishini toping:", "10", "2₁₀ = 10₂"),
            ("O‘nlikdagi 3₁₀ sonining binary (ikkilik) ko‘rinishini toping:", "11", "3₁₀ = 11₂"),
            ("O‘nlikdagi 5₁₀ sonining binary (ikkilik) ko‘rinishini toping:", "101", "5₁₀ = 4 + 1 = 101₂"),
            ("O‘nlikdagi 7₁₀ sonining binary (ikkilik) ko‘rinishini toping:", "111", "7₁₀ = 4 + 2 + 1 = 111₂"),
            ("O‘nlikdagi 8₁₀ sonining binary (ikkilik) ko‘rinishini toping:", "1000", "8₁₀ = 2³ = 1000₂"),
            ("1010₂ ikkilik sonning o‘nlik (decimal) qiymati nechaga teng? (Hex: A ga mos):", "A", "1010₂ = 10₁₀ = A₁₆"),
            ("O‘nlikdagi 15₁₀ sonining hexadecimal (16 lik) harfiy qiymatini toping:", "F", "15₁₀ = F₁₆"),
            ("1111₂ ikkilik sonning o‘nlik (decimal) qiymatini toping:", "15", "1111₂ = 8 + 4 + 2 + 1 = 15₁₀"),
            ("2⁴ (2 ning 4-darajasi) qiymatini jadvaldan toping:", "16", "2⁴ = 16"),
            ("2⁶ (2 ning 6-darajasi) qiymatini jadvaldan toping:", "64", "2⁶ = 64"),
            ("1 baytdagi maksimal ishorasiz son (11111111₂) qiymatini toping:", "255", "11111111₂ = 255₁₀"),
            ("2⁰ − 1 ifodaning qiymatini jadvaldan toping:", "0", "1 − 1 = 0"),
        ]
        for prompt_text, target_val, exp in bingo_prompts:
            Question.objects.create(
                game=g7,
                question_text=prompt_text,
                question_type='bingo_prompt',
                options={'target_type': 'cell_click'},
                correct_answer=target_val,
                points=13,
                difficulty='Medium',
                explanation=exp,
            )

        # ==================================================
        # GAME #8: CHIZMADAN QIDIRUV (6 visual diagram tasks)
        # ==================================================
        g8 = games_by_order[8]
        diagram_tasks = [
            {
                'text': "Chizmada 8-bitli registr holati ko‘rsatilgan. Yoqilgan (1) bitlarning razryad vaznlarini qo‘shib, o‘nlik sonni toping:",
                'options': {
                    'diagram_type': 'bit_register',
                    'bits': [1, 0, 1, 0, 1, 1, 0, 0],
                    'weights': [128, 64, 32, 16, 8, 4, 2, 1],
                    'choices': ['164', '172', '180', '156'],
                    'caption': "8-bit Xotira Registri (MSB → LSB)",
                },
                'ans': '172',
                'diff': 'Medium',
                'exp': "128 + 32 + 8 + 4 = 172₁₀.",
            },
            {
                'text': "Registrda hozir 01001010₂ = 74₁₀ soni tasvirlangan. Qiymat 90₁₀ bo‘lishi uchun qaysi vaznli bit katagini '1' ga o‘zgartirish kerak?",
                'options': {
                    'diagram_type': 'bit_flip',
                    'bits': [0, 1, 0, 0, 1, 0, 1, 0],
                    'weights': [128, 64, 32, 16, 8, 4, 2, 1],
                    'target_decimal': 90,
                    'current_decimal': 74,
                    'choices': ['32', '16', '4', '1'],
                    'caption': "74₁₀ + [?] = 90₁₀ → Qaysi razryad yoqilishi kerak?",
                },
                'ans': '16',
                'diff': 'Medium',
                'exp': "90 − 74 = 16. Demak, 2⁴ = 16 vaznli katakni 0 dan 1 ga o‘zgartirish kerak.",
            },
            {
                'text': "Pozitsion yoyilma sxemasida [ ? ] bilan yashirilgan ko‘paytuvchi qiymatini aniqlang: 3A7₁₆ = 3×16² + [ ? ]×16¹ + 7×16⁰",
                'options': {
                    'diagram_type': 'positional_blocks',
                    'number_str': '3A7₁₆',
                    'blocks': [
                        {'digit': '3', 'weight': '16² (256)', 'value': '3 × 256 = 768'},
                        {'digit': 'A', 'weight': '16¹ (16)', 'value': '[ ? ] × 16 = 160'},
                        {'digit': '7', 'weight': '16⁰ (1)', 'value': '7 × 1 = 7'},
                    ],
                    'choices': ['8', '10', '11', '15'],
                    'caption': "Hexadecimal Pozitsion Yoyilma Sxemasi",
                },
                'ans': '10',
                'diff': 'Easy',
                'exp': "O‘n oltilik sanoq sistemasida 'A' raqami o‘nlikda 10 ga teng.",
            },
            {
                'text': "Vizual 4-bitli ikkilik summator (Binary Adder) sxemasida A = 1011₂ va B = 0110₂ kirishlarining yig‘indisi S nechaga teng?",
                'options': {
                    'diagram_type': 'binary_adder',
                    'input_a': '1011₂ (11₁₀)',
                    'input_b': '0110₂ (6₁₀)',
                    'operation': 'A + B (Carry bilan)',
                    'choices': ['10001', '10011', '01111', '10101'],
                    'caption': "4-Bitli To‘liq Summator (Full Adder) Sxemasi",
                },
                'ans': '10001',
                'diff': 'Medium',
                'exp': "1011₂ (11) + 0110₂ (6) = 10001₂ (17₁₀).",
            },
            {
                'text': "Tetrada (4-bit Nibble) sxemasida 1101 0101₂ baytning ikkinchi (o‘ng) tetradasi qaysi Hex raqamga teng?",
                'options': {
                    'diagram_type': 'nibble_map',
                    'high_nibble_bits': '1101',
                    'high_nibble_hex': 'D',
                    'low_nibble_bits': '0101',
                    'low_nibble_hex': '?',
                    'choices': ['3', '5', '6', '9'],
                    'caption': "Baytni Ikkita Hexadecimal Tetradaga Ajratish",
                },
                'ans': '5',
                'diff': 'Easy',
                'exp': "0101₂ = 0×8 + 1×4 + 0×2 + 1×1 = 5₁₆.",
            },
            {
                'text': "Triada (3-bit Octal) sxemasida 110 101 011₂ sonining o‘rta triadasi (101₂) qaysi sakkizlik raqamni ifodalaydi?",
                'options': {
                    'diagram_type': 'octal_triad',
                    'triads': [
                        {'bits': '110', 'octal': '6'},
                        {'bits': '101', 'octal': '?'},
                        {'bits': '011', 'octal': '3'},
                    ],
                    'choices': ['4', '5', '6', '7'],
                    'caption': "Ikkilik Sondan Sakkizlikka Triada Usulida O‘tish",
                },
                'ans': '5',
                'diff': 'Easy',
                'exp': "101₂ = 4 + 0 + 1 = 5₈. To‘liq son: 653₈.",
            },
        ]
        for dt in diagram_tasks:
            Question.objects.create(
                game=g8,
                question_text=dt['text'],
                question_type='diagram_task',
                options=dt['options'],
                correct_answer=dt['ans'],
                points=20,
                difficulty=dt['diff'],
                explanation=dt['exp'],
            )

        recalculate_all_rankings()
        self.stdout.write(self.style.SUCCESS("Successfully cleaned database and seeded 8 games and 79 questions!"))

