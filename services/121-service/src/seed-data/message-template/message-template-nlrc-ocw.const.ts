import { SeedMessageTemplateConfig } from '@121-service/src/seed-data/message-template/interfaces/seed-message-template-config.interface';

export const messageTemplateNlrcOcw: SeedMessageTemplateConfig = {
  whatsappGenericMessage: {
    isSendMessageTemplate: false,
    isWhatsappTemplate: true,
    contentSid: {
      en: 'enOcwGeneric',
      nl: 'nlOcwGeneric',
      ar: 'arOcwGeneric',
      tr: 'trOcwGeneric',
    },
  },
  whatsappReply: {
    isSendMessageTemplate: false,
    isWhatsappTemplate: false,
    message: {
      en: 'This is an automated message. Questions? Check www.schoolmaaltijden.nl, call, sms or WhatsApp 097 010 204 851, or send an email to info@schoolmaaltijden.nl.\n\nKind regards, NL Red Cross / School Meals Programme',
      nl: 'Dit is een automatisch bericht. Vragen? Check www.schoolmaaltijden.nl, bel, sms of WhatsApp 097 010 204 851 of per mail via info@schoolmaaltijden.nl\n\nMvg, Rode Kruis/Programma Schoolmaaltijden',
      ar: 'هذه رسالة تلقائية. هل لديك اسئلة؟ انظر إلى الموقع www.schoolmaaltijden.nl أو اتصل أو أرسل رسالة أو استخدم Whatsapp على الرقم 097 010 204 851أو إرسال بريد إلكتروني إلى info@schoolmaaltijden.nl.\n\nأطيب التحيات،\nبرنامج الوجبات المدرسية / الصليب الأحمر الهولندي',
      tr: 'Bu otomatik bir mesajdır. Sorularınız mı var? www.schoolmaaltijden.nl adresini kontrol edin, 097 010 204 851 numaralı telefonu arayın, SMS gönderin veya WhatsApp mesajı gönderin ya da info@schoolmaaltijden.nl adresine e-posta gönderin.\n\nSaygılarımızla,\nNL Kızılhaç / Okul Yemekleri Programı',
    },
  },
  whatsappPayment: {
    isSendMessageTemplate: false,
    isWhatsappTemplate: true,
    contentSid: {
      en: 'enOcwPayment',
      nl: 'nlOcwPayment',
      ar: 'arOcwPayment',
      tr: 'trOcwPayment',
    },
  },
  whatsappVoucher: {
    isSendMessageTemplate: false,
    isWhatsappTemplate: false,
    message: {
      en: 'Dear parent/carer, with this message you receive:\n- Your Albert Heijn grocery voucher (the image with the barcode)\n- Instructions on how to use the Albert Heijn grocery voucher\n\nThe grocery voucher is worth €[[amount]]. You can use the grocery voucher in all Albert Heijn supermarkts in the Netherlands and Belgium. You can use the grocery voucher multiple times, as long as there is money left on it.\n\nIf you have any questions, please visit the website www.schoolmaaltijden.nl. You can also contact our Customer Service by telephone, text message or Whatsapp to 097 010 204 851 (open Mon-Fri 09.00-17.00) or by email to info@schoolmaaltijden.nl.\n\nKind regards, NL Red Cross / School Meals Programme',
      nl: 'Beste ouder/verzorger, hierbij ontvangt u:\n- Een Albert Heijn boodschappenkaart. Dat is het plaatje met de barcode;\n- Uitleg over hoe u de Albert Heijn boodschappenkaart kunt gebruiken.\n\nOp de Albert Heijn boodschappenkaart staat een bedrag van €[[amount]] euro. U kunt de kaart gebruiken in alle Albert Heijn supermarkten in Nederland en België. U kunt de kaart meerdere keren gebruiken, zolang er geld op staat.\n\nVoor vragen kunt u terecht op de website www.schoolmaaltijden.nl. Ook kunt u terecht bij onze Klantenservice via telefoon, sms of Whatsapp naar 097 010 204 851 (geopend ma-vrij 09.00-17.00) of mailen naar info@schoolmaaltijden.nl. \n\nMvg, het Rode Kruis/Programma Schoolmaaltijden',
      ar: 'عزيزي الوالد / الواصي المسؤول عن القاصر، تتلقى بهذه الرسالة:\n- قسيمة بقالة Albert Heijn (الصورة مع الرمز الشريطي)\n- تعليمات حول كيفية استخدام قسيمة بقالة ألبرت هاين\n\nتبلغ قيمة قسيمة البقالة €[[amount]]. يمكنك استخدام قسيمة البقالة في جميع محلات السوبر ماركت Albert Heijn في هولندا وبلجيكا. يمكنك استخدام قسيمة البقالة عدة مرات، بشرط وجود نقود عليها.\n\nهل لديك اسئلة؟ انظر إلى الموقعwww.schoolmaaltijden.nl أو اتصل أو أرسل رسالة أو استخدم Whatsapp على الرقم 097010204851 أو إرسال بريد إلكتروني إلى info@schoolmaaltijden.nl.\n\nأطيب التحيات، برنامج الوجبات المدرسية / الصليب الأحمر الهولندي.',
      tr: 'Sayın ebeveyn/bakıcı, bu mesaj ile şunları alacaksınız:\n- Albert Heijn market kuponunuz (barkodlu resim)\n- Albert Heijn market kuponunuzun nasıl kullanılacağına ilişkin talimatlar\n\nMarket kuponunun değeri [[amount]] €’dur. Market kuponunu Hollanda ve Belçika’daki tüm Albert Heijn süpermarketlerinde kullanabilirsiniz. Market kuponunu, içinde para kaldığı sürece birçok kez kullanabilirsiniz.\n\nSorularınız mı var? Lütfen www.schoolmaaltijden.nl adresini kontrol edin, 097 010 204 851 numaralı telefonu arayın, SMS gönderin veya WhatsApp mesajı gönderin ya da info@schoolmaaltijden.nl adresine e-posta gönderin.\n\nSaygılarımızla, Kızılhaç / Okul Yemekleri Programı',
    },
  },
  visaDebitCardCreated: {
    isSendMessageTemplate: false,
    isWhatsappTemplate: false,
    message: {
      en: 'Dear parent/carer, we have sent your grocery card by post. You will receive it within 3 weeks. The card is sent in a neutral looking envelope.\n\n- You will activate your card online via www.rodekruis.nl/boodschappenkaart-activeren and use it for the rest of the year.\n- For more information on how to activate the grocery card watch: www.schoolmaaltijden.nl/activatie\n- Every two weeks, we will put new money on your card: €[[1]].\n- You can only spend a maximum of €150 per calender month.\n- You can use the card in many shops selling food in the Netherlands.\n- The card works like normal debit cards. You will receive more information in the letter that comes with the card.\n\nQuestions? Check www.schoolmaaltijden.nl, call, sms or WhatsApp 097 010 204 851, or send an email to info@schoolmaaltijden.nl.\n\nKind regards,\nNL Red Cross / School Meals Programme',
      nl: 'Beste ouder/verzorger, we hebben uw boodschappenkaart op de post gedaan. U ontvangt de kaart binnen 3 weken. De kaart zit in een neutrale envelop.\n\n- U activeert de kaart online via www.rodekruis.nl/boodschappenkaart-activeren en gebruikt deze voor de rest van het jaar.\n- Voor meer informatie over activatie bekijk deze video: www.schoolmaaltijden.nl/activatie\n- Elke twee weken zetten we nieuw geld op de kaart: €[[1]].\n- U kunt maximaal €150 per kalendermaand besteden.\n- U kunt de kaart in allerlei winkels gebruiken die voedsel verkopen.\n- De kaart werkt als een gewone pinpas. U krijgt meer informatie in de brief die in de envelop zit.\n\nHeeft u vragen? Kijk op www.schoolmaaltijden.nl, bel, SMS of Whatsapp  097 010 204 851, of mail info@schoolmaaltijden.nl.\n\nMvg, het Rode Kruis/Programma Schoolmaaltijden',
      ar: 'عزيزي ولي الأمر / مقدم الرعاية ، لقد وضعنا بطاقة التسوق الخاصة بك في البريد. سوف تتلقى البطاقة في غضون ثلاثة أسابيع. البطاقة في مظروف أبيض.\n\n- ستفعل البطاقه اونلاين عن طريق الرابط  [www.rodekruis.nl/boodschappenkaart-activeren].\n يمكنك استخدام هذه البطاقة لبقية العام\n- لمزيد من المعلومات حول كيفية تنشيط مشاهدة بطاقة البقالة هذه: www.schoolmaaltijden.nl/activatie\n- كل أسبوعين نضع أموالا جديدة على البطاقة €[[1]]\n- يمكنك فقط إنفاق ما يصل إلى 150 يورو في الشهر الواحد.\n- يمكنك استخدام البطاقة في جميع أنواع المتاجر التي تبيع المواد الغذائية\n- تعمل البطاقة مثل بطاقة البنك العادية. سوف تتلقى المزيد من المعلومات في الرسالة الموجودة في الظرف\n\nهل لديك أي أسئلة؟ تحقق من www.schoolmaaltijden.nl أو اتصل أو أرسل رسالة نصية قصيرة  أو واتس اب  على 097010204851 أو ارسل بريدا إلكترونيا info@schoolmaaltijden.nl\n\nمع تحيات\nالصليب الأحمر / برنامج الوجبات المدرسية',
      tr: 'Sevgili veli/bakıcı, alışveriş kartınızı posta ile gönderdik. Kartı 3 hafta içinde alırsınız. Kart, göze çarpmayan bir zarf içinde gelir.\n\n- Kartı online olarak aktive edersiniz [www.rodekruis.nl/boodschappenkaart-activeren] ve bunu yılın geri kalanı için kullanırsınız.\n- Etkinleştirme hakkında daha fazla bilgi için www.schoolmaaltijden.nl/activatie\n- İki haftada bir karta yeni tutar yüklemesi yapacağız: €[[1]].\n- Bir takvim ayında en fazla 150€ harcayabilirsiniz.\n- Kartı yiyecek satışı yapan çeşitli mağazalarda kullanabilirsiniz.\n- Kartın işleyişi normal ödeme kartı ile aynıdır. Daha fazla bilgiyi zarftaki mektupta bulabilirsiniz.\n\nSorularınız olursa, www.schoolmaaltijden.nl internet sitesini ziyaret edebilir, 097 010 204 851 numaralı telefona çağrı, mesaj ya da Whatsapp yoluyla ulaşabilir, veya info@schoolmaaltijden.nl adresine e-posta gönderebilirsiniz.\n\nSaygılarımızla, Rode Kruis/Programma Schoolmaaltijden',
    },
  },
  visaLoad: {
    isSendMessageTemplate: false,
    isWhatsappTemplate: false,
    message: {
      en: 'Dear parent/carer, we have put new money on your card: €[[1]] for the coming two weeks. You can only spend a maximum of €150 per calender month. \nBefore using the grocery card, please check the balance via www.rodekruis.nl/boodschappenkaart.\n\nQuestions? Check www.schoolmaaltijden.nl, call, sms or WhatsApp 097 010 204 851, or send an email to info@schoolmaaltijden.nl.\n\nKind regards,\nNL Red Cross / School Meals Programme',
      nl: 'Beste ouder/verzorger, we hebben geld op uw boodschappenkaart gezet: €[[1]] voor de komende twee weken. U kunt maximaal €150 per kalendermaand besteden.\nControleer het bedrag op uw kaart via www.rodekruis.nl/boodschappenkaart voor u de kaart gebruikt.\n\nHeeft u vragen? Kijk op www.schoolmaaltijden.nl, bel, SMS of Whatsapp  097 010 204 851, of mail info@schoolmaaltijden.nl.\n\nMvg, het Rode Kruis/Programma Schoolmaaltijden',
      ar: 'عزيزي ولي الأمر/ مقدم الرعاية ، لقد وضعنا المال  على بطاقتك للأسبوعين المقبلين بقيمة €[[1]] برجاء استخدام هذا المبلغ خلال شهر. يمكنك فقط إنفاق ما يصل إلى 150 يورو في الشهر الواحد.   تحقق من المبلغ الموجود على بطاقتك قبل استخدام البطاقه عبر الرابط: [www.rodekruis.nl/boodschappenkaart]\n\nهل لديك أي أسئلة؟ تحقق من www.schoolmaaltijden.nl أو اتصل أو أرسل رسالة نصية قصيرة أو واتس اب على 097010204851 أو أرسل بريدا إلكترونيا الى info@schoolmaaltijden.nl\n\nمع تحيات الصليب الأحمر / برنامج الوجبات المدرسية',
      tr: 'Sevgili veli/bakıcı, kartınıza para yükledik: €[[1]] (önümüzdeki iki hafta için). Lütfen ilgili tutarı bir ay içinde kullanın. Bir takvim ayında en fazla 150€ harcayabilirsiniz. Kartı kullanmadan önce karttaki tutarı [www.rodekruis.nl/boodschappenkaart] üzerinden kontrol edin.\n\nSorularınız olursa, www.schoolmaaltijden.nl internet sitesini ziyaret edebilir, 097 010 204 851 numaralı telefona çağrı, mesaj ya da Whatsapp yoluyla ulaşabilir, veya info@schoolmaaltijden.nl adresine e-posta gönderebilirsiniz.\n\nSaygılarımızla, Rode Kruis/Programma Schoolmaaltijden',
    },
  },
  reissueVisaCard: {
    isSendMessageTemplate: false,
    isWhatsappTemplate: false,
    message: {
      en: 'Dear parent/carer, a new grocery card is sent to your address. You will receive it within three weeks. School Meals',
      nl: 'Beste ouder/verzorger, we hebben u een nieuwe boodschappenkaart gestuurd. U ontvangt deze binnen drie weken. Schoolmaaltijden',
      ar: 'عزيزي الوالد / مقدم الرعاية ، لقد أرسلنا لك بطاقة تسوق جديدة. سوف تحصل عليها في غضون ثلاثة أسابيع. الوجبات المدرسية',
      tr: 'Sevgili veli/bakıcı, yeni alışveriş kartınızı gönderdik. Kartı 3 hafta içinde alırsınız. Okul Öğünleri',
    },
  },
  pauseVisaCard: {
    isSendMessageTemplate: false,
    isWhatsappTemplate: false,
    message: {
      en: 'Dear parent/carer, your grocery card is blocked. If you do not know why, please contact customer service: call or whatsapp 097 010 204 851. School Meals',
      nl: 'Beste ouder/verzorger, uw boodschappenkaart is geblokkeerd. Als u niet weet waarom, bel of WhatsApp 097 010 204 851. Schoolmaaltijden',
      ar: 'عزيزي الوالد / مقدم الرعاية ، تم حظر بطاقة التسوق الخاصة بك. إذا كنت لا تعرف السبب ، فاتصل أو ارسل على واتساب 097010204851 .الوجبات المدرسية',
      tr: 'Sevgili veli/bakıcı, alışveriş kartınız bloke edildi. Eğer nedenini bilmiyorsanız, 097 010 204 851 nolu telefonu arayın ya da Whatsapp mesajı gönderin. Okul Öğünleri',
    },
  },
  unpauseVisaCard: {
    isSendMessageTemplate: false,
    isWhatsappTemplate: false,
    message: {
      en: 'Dear parent/carer, your grocery card is unblocked. You can use the card again. Questions? Call or whatsapp 097 010 204 851. School Meals',
      nl: 'Beste ouder/verzorger, uw boodschappenkaart is gedeblokkeerd. U kunt de kaart weer gebruiken. Vragen? Bel of WhatsApp 097 010 204 851. Schoolmaaltijden',
      ar: ' عزيزي الوالد / مقدم الرعاية ، تم إلغاء حظر بطاقة التسوق الخاصة بك. يمكنك استخدام البطاقة مرة أخرى. للاسئلة؟ اتصل أو واتساب على097010204851. الوجبات المدرسية',
      tr: 'Sevgili veli/bakıcı, alışveriş kartınızın blokajı açıldı. Kartı yeniden kullanabilirsiniz. Sorunuz var mı? 097 010 204 851 numaralı telefonu arayın ya da Whatsapp mesajı gönderin. Okul Öğünleri',
    },
  },
};
