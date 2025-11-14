// #TODO Cleanup the content of this mock to not have program specific options (This requires changes to the test cases)
export const ContentSidMessageMockMap = {
  enGeneric:
    'There is a message waiting for you. Please reply “yes” to this message to receive it.',
  nlGeneric: 'Dummy text NL: whatsappGenericMessage',
  enPayment:
    'Please reply to this message within 24 hours to receive your voucher of [[amount]] units',
  nlPayment: 'Dummy text NL: whatsappPayment [[amount]] units',
  enOcwGeneric:
    'There is a message waiting for you. Please reply “yes” to this message to receive it.\n\nKind regards, NL Red Cross / School Meals Programme',
  nlOcwGeneric:
    "Er is een bericht voor u. Antwoord op dit bericht met 'ja' om het bericht te ontvangen.\n\nMvg, Rode Kruis/Programma Schoolmaaltijden",
  arOcwGeneric:
    'لديك رسالة تنتظر. الرجاء الرد بـ "نعم" على هذه الرسالة لتلقيها\n\n أطيب التحيات،\nبرنامج الوجبات المدرسية / الصليب الأحمر الهولندي',
  trOcwGeneric:
    'Sizi bekleyen bir mesaj var. Bu mesajı almak için lütfen bu mesajı “evet” olarak yanıtlayın.\n\nSaygılarımızla, \nNL Kızılhaç / Okul Yemekleri Programı',
  enOcwPayment:
    "Dear parent/carer, we are ready to send you your Albert Heijn grocery voucher on Whatsapp. Answer 'yes' to this message to receive your Albert Heijn grocery voucher.\nKind regards, NL Red Cross / School Meals Programme",
  nlOcwPayment:
    'Beste ouder/verzorger, we willen u uw Albert Heijn boodschappenkaart sturen. Deze staat klaar om naar uw Whatsapp te worden gestuurd. Antwoord op dit bericht met ‘ja’ om uw kaart te ontvangen.  \nMvg, Rode Kruis/Programma Schoolmaaltijden',
  arOcwPayment:
    'عزيزي الوالد / الواصي المسؤول عن القاصر، نحن على استعداد لإرسال قسيمة بقالة Albert Heijn على Whatsapp. أجب بـ "نعم" على هذه الرسالة لاستلام قسيمة البقالة، قسيمة بقالة Albert Heijn.\nأطيب التحيات، برنامج الوجبات المدرسية / الصليب الأحمر الهولندي.',
  trOcwPayment:
    'Sayın ebeveyn/bakıcı, Albert Heijn market kuponunuzu Whatsapp üzerinden size göndermeye hazırız. Market kuponunuz olan Albert Heijn market kuponunuzu almak için bu mesajı ‘evet’ olarak yanıtlayın.\nSaygılarımızla, Kızılhaç / Okul Yemekleri Programı',
  arPvGeneric:
    'هذه رسالة من الصليب الأحمر.\n\nهناك رسالة في انتظارك. الرجاء الرد ب- "نعم" على هذه الرسالة لتلقيتها',
  enPvGeneric:
    'This is a message from the Red Cross.\n\nThere is a message waiting for you. Please reply “yes” to this message to receive it.',
  esPvGeneric:
    'Este es un mensaje de la Cruz Roja.\n\nHay un mensaje esperándote. Por favor, responda “sí” a este mensaje para recibirlo.',
  nlPvGeneric:
    'Dit is een bericht van het Rode Kruis.\n\nEr staat een bericht klaar voor je. Antwoord met “ja” op dit bericht om het te ontvangen.',
  ptPvGeneric:
    'Esta mensagem é da Cruz Vermelha.\nHá uma mensagem à sua espera. Por favor, responda “sim” para a receber.',
  tlPvGeneric:
    'Ang mensaheng ito ay mula sa Red Cross.\n\nMay mensaheng naghihintay para sa iyo. Pa-click ang “oo” para matanggap ang mensaheng ito.',
  inPvGeneric:
    'Ini berita dari Red Cross (Palang Merah)\n\nAda berita yang menunggu anda. Harap jawab “yes” untuk berita yang anda terima.',
  frPvGeneric:
    'Ceci est un message de la Croix-Rouge.\n\nUn message vous attend. Veuillez répondre "oui" à ce message pour le recevoir.',
  arPvPayment:
    'هذه رسالة من الصليب الأحمر.\n\nإن قسيمة ألبرت هاين الشرائية جاهزة للارسال.\n\nالرجاء الرد بـ “yes” على هذه الرسالة لاستلام:\n1. قسيمة هذا الاسبوع.\n2.أي قسائم سابقة لم يتم استلامها بعد.',
  enPvPayment:
    "This is a message from the Red Cross.\n\nYour Albert Heijn supermarket voucher is ready to be sent.\n\nPlease reply “yes” to this message in order to receive:\n1. This week's voucher.\n2. Any previous vouchers you haven't received yet.\n",
  esPvPayment:
    'Éste es un mensaje de la Cruz Roja.\n\nSu bono de Albert Heijn está listo para ser enviado.\n\nPor favor responda "si" a éste mensaje para recibir:\n1. Éste bono semanal\n2. Cualquier bono anterior que aun no haya recibido.',
  nlPvPayment:
    'Dit is een bericht van het Rode Kruis.\n\nJe Albert Heijn supermarkt voucher is klaar om verzonden te worden.\n\nAntwoord met "ja" op dit bericht om het volgende te ontvangen:\n1. De voucher van deze week.\n2. Vorige vouchers die je nog niet hebt ontvangen.',
  ptPvPayment:
    'Esta é uma mensagem da Cruz Vermelha.\n\nSeu vale de supermercado Albert Heijn está pronto para ser enviado.\n\nPor favor, responda "sim" a esta mensagem para receber:\n1. O vale desta semana.\n2. Qualquer vale anterior que você ainda não tenha recebido.',
  tlPvPayment:
    'Ang mensaheng ito ay galing sa Red Cross.\n\nAng iyong Albert Heijn supermarket voucher ay handa na para ipadala.\n\nMag-reply ng "oo" sa mensaheng ito upang makatanggap ng voucher.',
  inPvPayment:
    'Ini adalah pesan dari Red Cross.\n\nVoucher supermarket Albert Heijn siap untuk dikirim.\n\nHarap menjawab "ya" atas berita ini agar dapat menerima:\n1. Voucher minggu ini\n2. Voucher sebelumnya yang anda belum terima.',
  frPvPayment:
    'Ceci est un message de la Croix-Rouge.\n\nVotre bon chez les supermarchés Albert Heijn est prêt à être envoyé.\n\nVeuillez répondre "oui" à ce message afin de recevoir :\n1. Le bon de cette semaine.\n2. Tous les bons précédents que vous n\'avez pas encore reçus.',
};
