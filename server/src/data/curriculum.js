// Learning path content (CEFR A1–A2).
// Each entry holds the same word/phrase in every supported language, so a
// lesson works for whatever target language the learner picked. Nouns carry
// their article because gender is part of learning the word.

const w = (en, es, fr, de, it, pt, ru, zh, pinyin) => ({
  en,
  es,
  fr,
  de,
  it,
  pt,
  ru,
  zh,
  pinyin,
});

export const LEVELS = [
  {
    id: "A1",
    title: "Beginner",
    description: "Greetings, people, numbers, food and your first verbs.",
    units: [
      {
        title: "First Words",
        icon: "👋",
        lessons: [
          {
            title: "Hello!",
            items: [
              w("hello", "hola", "bonjour", "hallo", "ciao", "olá", "привет", "你好", "nǐ hǎo"),
              w("goodbye", "adiós", "au revoir", "tschüss", "arrivederci", "tchau", "до свидания", "再见", "zàijiàn"),
              w("please", "por favor", "s'il vous plaît", "bitte", "per favore", "por favor", "пожалуйста", "请", "qǐng"),
              w("thank you", "gracias", "merci", "danke", "grazie", "obrigado", "спасибо", "谢谢", "xièxie"),
              w("yes", "sí", "oui", "ja", "sì", "sim", "да", "是", "shì"),
              w("no", "no", "non", "nein", "no", "não", "нет", "不", "bù"),
            ],
          },
          {
            title: "Introductions",
            items: [
              w("my name is…", "me llamo…", "je m'appelle…", "ich heiße…", "mi chiamo…", "eu me chamo…", "меня зовут…", "我叫…", "wǒ jiào…"),
              w("nice to meet you", "mucho gusto", "enchanté", "freut mich", "piacere", "prazer", "очень приятно", "很高兴认识你", "hěn gāoxìng rènshi nǐ"),
              w("how are you?", "¿cómo estás?", "comment ça va ?", "wie geht's?", "come stai?", "como vai?", "как дела?", "你好吗？", "nǐ hǎo ma?"),
              w("I'm fine", "estoy bien", "ça va bien", "mir geht's gut", "sto bene", "estou bem", "всё хорошо", "我很好", "wǒ hěn hǎo"),
              w("good night", "buenas noches", "bonne nuit", "gute Nacht", "buona notte", "boa noite", "спокойной ночи", "晚安", "wǎn'ān"),
              w("sorry", "lo siento", "pardon", "Entschuldigung", "scusa", "desculpa", "извините", "对不起", "duìbuqǐ"),
            ],
          },
        ],
      },
      {
        title: "People & Family",
        icon: "👨‍👩‍👧",
        lessons: [
          {
            title: "People",
            items: [
              w("man", "el hombre", "l'homme", "der Mann", "l'uomo", "o homem", "мужчина", "男人", "nánrén"),
              w("woman", "la mujer", "la femme", "die Frau", "la donna", "a mulher", "женщина", "女人", "nǚrén"),
              w("child", "el niño", "l'enfant", "das Kind", "il bambino", "a criança", "ребёнок", "孩子", "háizi"),
              w("friend", "el amigo", "l'ami", "der Freund", "l'amico", "o amigo", "друг", "朋友", "péngyou"),
              w("person", "la persona", "la personne", "die Person", "la persona", "a pessoa", "человек", "人", "rén"),
              w("neighbor", "el vecino", "le voisin", "der Nachbar", "il vicino", "o vizinho", "сосед", "邻居", "línjū"),
            ],
          },
          {
            title: "Family",
            items: [
              w("mother", "la madre", "la mère", "die Mutter", "la madre", "a mãe", "мать", "妈妈", "māma"),
              w("father", "el padre", "le père", "der Vater", "il padre", "o pai", "отец", "爸爸", "bàba"),
              w("brother", "el hermano", "le frère", "der Bruder", "il fratello", "o irmão", "брат", "兄弟", "xiōngdì"),
              w("sister", "la hermana", "la sœur", "die Schwester", "la sorella", "a irmã", "сестра", "姐妹", "jiěmèi"),
              w("son", "el hijo", "le fils", "der Sohn", "il figlio", "o filho", "сын", "儿子", "érzi"),
              w("daughter", "la hija", "la fille", "die Tochter", "la figlia", "a filha", "дочь", "女儿", "nǚ'ér"),
            ],
          },
        ],
      },
      {
        title: "Numbers & Time",
        icon: "🔢",
        lessons: [
          {
            title: "Numbers",
            items: [
              w("one", "uno", "un", "eins", "uno", "um", "один", "一", "yī"),
              w("two", "dos", "deux", "zwei", "due", "dois", "два", "二", "èr"),
              w("three", "tres", "trois", "drei", "tre", "três", "три", "三", "sān"),
              w("four", "cuatro", "quatre", "vier", "quattro", "quatro", "четыре", "四", "sì"),
              w("five", "cinco", "cinq", "fünf", "cinque", "cinco", "пять", "五", "wǔ"),
              w("ten", "diez", "dix", "zehn", "dieci", "dez", "десять", "十", "shí"),
            ],
          },
          {
            title: "Days",
            items: [
              w("today", "hoy", "aujourd'hui", "heute", "oggi", "hoje", "сегодня", "今天", "jīntiān"),
              w("tomorrow", "mañana", "demain", "morgen", "domani", "amanhã", "завтра", "明天", "míngtiān"),
              w("yesterday", "ayer", "hier", "gestern", "ieri", "ontem", "вчера", "昨天", "zuótiān"),
              w("day", "el día", "le jour", "der Tag", "il giorno", "o dia", "день", "天", "tiān"),
              w("week", "la semana", "la semaine", "die Woche", "la settimana", "a semana", "неделя", "星期", "xīngqī"),
              w("Monday", "el lunes", "lundi", "Montag", "lunedì", "segunda-feira", "понедельник", "星期一", "xīngqīyī"),
            ],
          },
        ],
      },
      {
        title: "Food & Drink",
        icon: "🍎",
        lessons: [
          {
            title: "In the Kitchen",
            items: [
              w("water", "el agua", "l'eau", "das Wasser", "l'acqua", "a água", "вода", "水", "shuǐ"),
              w("bread", "el pan", "le pain", "das Brot", "il pane", "o pão", "хлеб", "面包", "miànbāo"),
              w("coffee", "el café", "le café", "der Kaffee", "il caffè", "o café", "кофе", "咖啡", "kāfēi"),
              w("milk", "la leche", "le lait", "die Milch", "il latte", "o leite", "молоко", "牛奶", "niúnǎi"),
              w("apple", "la manzana", "la pomme", "der Apfel", "la mela", "a maçã", "яблоко", "苹果", "píngguǒ"),
              w("cheese", "el queso", "le fromage", "der Käse", "il formaggio", "o queijo", "сыр", "奶酪", "nǎilào"),
            ],
          },
          {
            title: "At the Restaurant",
            items: [
              w("I'm hungry", "tengo hambre", "j'ai faim", "ich habe Hunger", "ho fame", "estou com fome", "я голоден", "我饿了", "wǒ è le"),
              w("I would like…", "quisiera…", "je voudrais…", "ich möchte…", "vorrei…", "eu queria…", "я хотел бы…", "我想要…", "wǒ xiǎng yào…"),
              w("the bill, please", "la cuenta, por favor", "l'addition, s'il vous plaît", "die Rechnung, bitte", "il conto, per favore", "a conta, por favor", "счёт, пожалуйста", "请结账", "qǐng jiézhàng"),
              w("delicious", "delicioso", "délicieux", "lecker", "delizioso", "delicioso", "вкусно", "好吃", "hǎochī"),
              w("breakfast", "el desayuno", "le petit-déjeuner", "das Frühstück", "la colazione", "o café da manhã", "завтрак", "早饭", "zǎofàn"),
              w("dinner", "la cena", "le dîner", "das Abendessen", "la cena", "o jantar", "ужин", "晚饭", "wǎnfàn"),
            ],
          },
        ],
      },
      {
        title: "Colors & Things",
        icon: "🎨",
        lessons: [
          {
            title: "Colors",
            items: [
              w("red", "rojo", "rouge", "rot", "rosso", "vermelho", "красный", "红色", "hóngsè"),
              w("blue", "azul", "bleu", "blau", "blu", "azul", "синий", "蓝色", "lánsè"),
              w("green", "verde", "vert", "grün", "verde", "verde", "зелёный", "绿色", "lǜsè"),
              w("yellow", "amarillo", "jaune", "gelb", "giallo", "amarelo", "жёлтый", "黄色", "huángsè"),
              w("black", "negro", "noir", "schwarz", "nero", "preto", "чёрный", "黑色", "hēisè"),
              w("white", "blanco", "blanc", "weiß", "bianco", "branco", "белый", "白色", "báisè"),
            ],
          },
          {
            title: "Around the House",
            items: [
              w("house", "la casa", "la maison", "das Haus", "la casa", "a casa", "дом", "房子", "fángzi"),
              w("book", "el libro", "le livre", "das Buch", "il libro", "o livro", "книга", "书", "shū"),
              w("car", "el coche", "la voiture", "das Auto", "la macchina", "o carro", "машина", "车", "chē"),
              w("phone", "el teléfono", "le téléphone", "das Telefon", "il telefono", "o telefone", "телефон", "电话", "diànhuà"),
              w("table", "la mesa", "la table", "der Tisch", "il tavolo", "a mesa", "стол", "桌子", "zhuōzi"),
              w("door", "la puerta", "la porte", "die Tür", "la porta", "a porta", "дверь", "门", "mén"),
            ],
          },
        ],
      },
      {
        title: "Everyday Verbs",
        icon: "🏃",
        lessons: [
          {
            title: "Actions",
            items: [
              w("to eat", "comer", "manger", "essen", "mangiare", "comer", "есть", "吃", "chī"),
              w("to drink", "beber", "boire", "trinken", "bere", "beber", "пить", "喝", "hē"),
              w("to sleep", "dormir", "dormir", "schlafen", "dormire", "dormir", "спать", "睡觉", "shuìjiào"),
              w("to speak", "hablar", "parler", "sprechen", "parlare", "falar", "говорить", "说", "shuō"),
              w("to read", "leer", "lire", "lesen", "leggere", "ler", "читать", "读", "dú"),
              w("to write", "escribir", "écrire", "schreiben", "scrivere", "escrever", "писать", "写", "xiě"),
            ],
          },
          {
            title: "Key Phrases",
            items: [
              w("I have", "tengo", "j'ai", "ich habe", "ho", "eu tenho", "у меня есть", "我有", "wǒ yǒu"),
              w("I want", "quiero", "je veux", "ich will", "voglio", "eu quero", "я хочу", "我要", "wǒ yào"),
              w("I like", "me gusta", "j'aime", "ich mag", "mi piace", "eu gosto", "мне нравится", "我喜欢", "wǒ xǐhuan"),
              w("I don't understand", "no entiendo", "je ne comprends pas", "ich verstehe nicht", "non capisco", "não entendo", "я не понимаю", "我不明白", "wǒ bù míngbai"),
              w("I speak a little", "hablo un poco", "je parle un peu", "ich spreche ein bisschen", "parlo un po'", "falo um pouco", "я немного говорю", "我会说一点", "wǒ huì shuō yìdiǎn"),
              w("where is…?", "¿dónde está…?", "où est… ?", "wo ist…?", "dov'è…?", "onde fica…?", "где…?", "…在哪儿？", "… zài nǎr?"),
            ],
          },
        ],
      },
    ],
  },
  {
    id: "A2",
    title: "Elementary",
    description: "Travel, shopping, health, work, weather and talking about time.",
    units: [
      {
        title: "Travel",
        icon: "✈️",
        lessons: [
          {
            title: "At the Airport",
            items: [
              w("airport", "el aeropuerto", "l'aéroport", "der Flughafen", "l'aeroporto", "o aeroporto", "аэропорт", "机场", "jīchǎng"),
              w("train", "el tren", "le train", "der Zug", "il treno", "o trem", "поезд", "火车", "huǒchē"),
              w("ticket", "el billete", "le billet", "die Fahrkarte", "il biglietto", "a passagem", "билет", "票", "piào"),
              w("hotel", "el hotel", "l'hôtel", "das Hotel", "l'albergo", "o hotel", "гостиница", "酒店", "jiǔdiàn"),
              w("passport", "el pasaporte", "le passeport", "der Reisepass", "il passaporto", "o passaporte", "паспорт", "护照", "hùzhào"),
              w("suitcase", "la maleta", "la valise", "der Koffer", "la valigia", "a mala", "чемодан", "行李箱", "xínglixiāng"),
            ],
          },
          {
            title: "Getting Around",
            items: [
              w("Where is the station?", "¿Dónde está la estación?", "Où est la gare ?", "Wo ist der Bahnhof?", "Dov'è la stazione?", "Onde fica a estação?", "Где вокзал?", "车站在哪儿？", "chēzhàn zài nǎr?"),
              w("How much does it cost?", "¿Cuánto cuesta?", "Combien ça coûte ?", "Wie viel kostet das?", "Quanto costa?", "Quanto custa?", "Сколько это стоит?", "多少钱？", "duōshao qián?"),
              w("to the left", "a la izquierda", "à gauche", "links", "a sinistra", "à esquerda", "налево", "左边", "zuǒbian"),
              w("to the right", "a la derecha", "à droite", "rechts", "a destra", "à direita", "направо", "右边", "yòubian"),
              w("straight ahead", "todo recto", "tout droit", "geradeaus", "sempre dritto", "em frente", "прямо", "一直走", "yìzhí zǒu"),
              w("map", "el mapa", "la carte", "die Karte", "la mappa", "o mapa", "карта", "地图", "dìtú"),
            ],
          },
        ],
      },
      {
        title: "Shopping & the City",
        icon: "🛍️",
        lessons: [
          {
            title: "Shopping",
            items: [
              w("shop", "la tienda", "le magasin", "das Geschäft", "il negozio", "a loja", "магазин", "商店", "shāngdiàn"),
              w("money", "el dinero", "l'argent", "das Geld", "i soldi", "o dinheiro", "деньги", "钱", "qián"),
              w("cheap", "barato", "bon marché", "billig", "economico", "barato", "дешёвый", "便宜", "piányi"),
              w("expensive", "caro", "cher", "teuer", "caro", "caro", "дорогой", "贵", "guì"),
              w("to buy", "comprar", "acheter", "kaufen", "comprare", "comprar", "покупать", "买", "mǎi"),
              w("to pay", "pagar", "payer", "bezahlen", "pagare", "pagar", "платить", "付钱", "fù qián"),
            ],
          },
          {
            title: "Around Town",
            items: [
              w("bank", "el banco", "la banque", "die Bank", "la banca", "o banco", "банк", "银行", "yínháng"),
              w("pharmacy", "la farmacia", "la pharmacie", "die Apotheke", "la farmacia", "a farmácia", "аптека", "药店", "yàodiàn"),
              w("hospital", "el hospital", "l'hôpital", "das Krankenhaus", "l'ospedale", "o hospital", "больница", "医院", "yīyuàn"),
              w("street", "la calle", "la rue", "die Straße", "la strada", "a rua", "улица", "街", "jiē"),
              w("restaurant", "el restaurante", "le restaurant", "das Restaurant", "il ristorante", "o restaurante", "ресторан", "饭馆", "fànguǎn"),
              w("museum", "el museo", "le musée", "das Museum", "il museo", "o museu", "музей", "博物馆", "bówùguǎn"),
            ],
          },
        ],
      },
      {
        title: "Health & Body",
        icon: "🩺",
        lessons: [
          {
            title: "The Body",
            items: [
              w("head", "la cabeza", "la tête", "der Kopf", "la testa", "a cabeça", "голова", "头", "tóu"),
              w("hand", "la mano", "la main", "die Hand", "la mano", "a mão", "рука", "手", "shǒu"),
              w("eye", "el ojo", "l'œil", "das Auge", "l'occhio", "o olho", "глаз", "眼睛", "yǎnjing"),
              w("heart", "el corazón", "le cœur", "das Herz", "il cuore", "o coração", "сердце", "心", "xīn"),
              w("foot", "el pie", "le pied", "der Fuß", "il piede", "o pé", "нога", "脚", "jiǎo"),
              w("mouth", "la boca", "la bouche", "der Mund", "la bocca", "a boca", "рот", "嘴", "zuǐ"),
            ],
          },
          {
            title: "At the Doctor",
            items: [
              w("doctor", "el médico", "le médecin", "der Arzt", "il medico", "o médico", "врач", "医生", "yīshēng"),
              w("medicine", "la medicina", "le médicament", "das Medikament", "la medicina", "o remédio", "лекарство", "药", "yào"),
              w("I feel sick", "me siento mal", "je me sens mal", "mir ist schlecht", "mi sento male", "estou passando mal", "мне плохо", "我不舒服", "wǒ bù shūfu"),
              w("it hurts here", "me duele aquí", "j'ai mal ici", "es tut hier weh", "mi fa male qui", "dói aqui", "здесь болит", "这里疼", "zhèlǐ téng"),
              w("fever", "la fiebre", "la fièvre", "das Fieber", "la febbre", "a febre", "температура", "发烧", "fāshāo"),
              w("healthy", "sano", "en bonne santé", "gesund", "sano", "saudável", "здоровый", "健康", "jiànkāng"),
            ],
          },
        ],
      },
      {
        title: "Work & Study",
        icon: "💼",
        lessons: [
          {
            title: "At Work",
            items: [
              w("job", "el trabajo", "le travail", "die Arbeit", "il lavoro", "o trabalho", "работа", "工作", "gōngzuò"),
              w("office", "la oficina", "le bureau", "das Büro", "l'ufficio", "o escritório", "офис", "办公室", "bàngōngshì"),
              w("teacher", "el profesor", "le professeur", "der Lehrer", "l'insegnante", "o professor", "учитель", "老师", "lǎoshī"),
              w("student", "el estudiante", "l'étudiant", "der Student", "lo studente", "o estudante", "студент", "学生", "xuéshēng"),
              w("meeting", "la reunión", "la réunion", "die Besprechung", "la riunione", "a reunião", "встреча", "会议", "huìyì"),
              w("colleague", "el compañero de trabajo", "le collègue", "der Kollege", "il collega", "o colega", "коллега", "同事", "tóngshì"),
            ],
          },
          {
            title: "Learning",
            items: [
              w("to work", "trabajar", "travailler", "arbeiten", "lavorare", "trabalhar", "работать", "上班", "shàngbān"),
              w("to learn", "aprender", "apprendre", "lernen", "imparare", "aprender", "учиться", "学习", "xuéxí"),
              w("to begin", "empezar", "commencer", "anfangen", "cominciare", "começar", "начинать", "开始", "kāishǐ"),
              w("to finish", "terminar", "finir", "beenden", "finire", "terminar", "заканчивать", "结束", "jiéshù"),
              w("homework", "los deberes", "les devoirs", "die Hausaufgaben", "i compiti", "o dever de casa", "домашнее задание", "作业", "zuòyè"),
              w("exam", "el examen", "l'examen", "die Prüfung", "l'esame", "a prova", "экзамен", "考试", "kǎoshì"),
            ],
          },
        ],
      },
      {
        title: "Weather & Nature",
        icon: "🌦️",
        lessons: [
          {
            title: "Weather",
            items: [
              w("weather", "el tiempo", "le temps", "das Wetter", "il tempo", "o tempo", "погода", "天气", "tiānqì"),
              w("sun", "el sol", "le soleil", "die Sonne", "il sole", "o sol", "солнце", "太阳", "tàiyáng"),
              w("rain", "la lluvia", "la pluie", "der Regen", "la pioggia", "a chuva", "дождь", "雨", "yǔ"),
              w("snow", "la nieve", "la neige", "der Schnee", "la neve", "a neve", "снег", "雪", "xuě"),
              w("it's hot", "hace calor", "il fait chaud", "es ist heiß", "fa caldo", "está calor", "жарко", "很热", "hěn rè"),
              w("it's cold", "hace frío", "il fait froid", "es ist kalt", "fa freddo", "está frio", "холодно", "很冷", "hěn lěng"),
            ],
          },
          {
            title: "Nature",
            items: [
              w("tree", "el árbol", "l'arbre", "der Baum", "l'albero", "a árvore", "дерево", "树", "shù"),
              w("sea", "el mar", "la mer", "das Meer", "il mare", "o mar", "море", "海", "hǎi"),
              w("mountain", "la montaña", "la montagne", "der Berg", "la montagna", "a montanha", "гора", "山", "shān"),
              w("river", "el río", "la rivière", "der Fluss", "il fiume", "o rio", "река", "河", "hé"),
              w("flower", "la flor", "la fleur", "die Blume", "il fiore", "a flor", "цветок", "花", "huā"),
              w("sky", "el cielo", "le ciel", "der Himmel", "il cielo", "o céu", "небо", "天空", "tiānkōng"),
            ],
          },
        ],
      },
      {
        title: "Feelings & Time",
        icon: "💭",
        lessons: [
          {
            title: "Feelings",
            items: [
              w("happy", "feliz", "heureux", "glücklich", "felice", "feliz", "счастливый", "高兴", "gāoxìng"),
              w("sad", "triste", "triste", "traurig", "triste", "triste", "грустный", "难过", "nánguò"),
              w("tired", "cansado", "fatigué", "müde", "stanco", "cansado", "уставший", "累", "lèi"),
              w("angry", "enfadado", "en colère", "wütend", "arrabbiato", "com raiva", "сердитый", "生气", "shēngqì"),
              w("worried", "preocupado", "inquiet", "besorgt", "preoccupato", "preocupado", "обеспокоенный", "担心", "dānxīn"),
              w("nervous", "nervioso", "nerveux", "nervös", "nervoso", "nervoso", "нервный", "紧张", "jǐnzhāng"),
            ],
          },
          {
            title: "When?",
            items: [
              w("last week", "la semana pasada", "la semaine dernière", "letzte Woche", "la settimana scorsa", "a semana passada", "на прошлой неделе", "上个星期", "shàng ge xīngqī"),
              w("next year", "el año que viene", "l'année prochaine", "nächstes Jahr", "l'anno prossimo", "o ano que vem", "в следующем году", "明年", "míngnián"),
              w("always", "siempre", "toujours", "immer", "sempre", "sempre", "всегда", "总是", "zǒngshì"),
              w("sometimes", "a veces", "parfois", "manchmal", "a volte", "às vezes", "иногда", "有时候", "yǒushíhou"),
              w("never", "nunca", "jamais", "nie", "mai", "nunca", "никогда", "从不", "cóngbù"),
              w("already", "ya", "déjà", "schon", "già", "já", "уже", "已经", "yǐjīng"),
            ],
          },
        ],
      },
    ],
  },
];
