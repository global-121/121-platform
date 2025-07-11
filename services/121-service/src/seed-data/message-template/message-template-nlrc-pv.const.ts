import { SeedMessageTemplateConfig } from '@121-service/src/seed-data/message-template/interfaces/seed-message-template-config.interface';

export const messageTemplateNlrcPv: SeedMessageTemplateConfig = {
  invited: {
    isSendMessageTemplate: true,
    label: {
      en: 'Invite',
    },
    isWhatsappTemplate: false,
    message: {
      ar: 'هذه الرسالة واردة من الصليب الأحمر. {{namePartnerOrganization}} قد أرسل إلينا رقم هاتفك.\n\nيمكننا مساعدتك من خلال قسائم ألبرت هيجن (Albert Heijn) الأسبوعية. انقر على الرابط وعبأ بيانات الطلب:\n\nhttps://register.nlrc.121.global/?programs=2\n\nيجب أن يتوفر لديك اتصال بالإنترنت لفتح الرابط.\n\nهل لديك أي أسئلة؟ راسلنا عبر الواتساب:\n\nhttps://wa.me/3197010286964\n\nأو اتصل بـ {{namePartnerOrganization}}.',
      en: 'This is a message from the Red Cross. {{namePartnerOrganization}} has passed on your telephone number to us.\n\nWe can help you with weekly Albert Heijn vouchers. Click on the link and complete the application:\n\nhttps://register.nlrc.121.global/?programs=2\n\nYou need an internet connection to open the link.\n\nDo you have questions? Send us a message via WhatsApp:\n\nhttps://wa.me/3197010286964\n\nor contact {{namePartnerOrganization}}.',
      es: 'Este es un mensaje de la Cruz Roja. {{namePartnerOrganization}} nos ha facilitado tu número de teléfono.\n\nPodemos ayudarte con los vales semanales de Albert Heijn. Haz clic en el enlace y rellena la solicitud:\n\nhttps://register.nlrc.121.global/?programs=2\n\nNecesitas tener conexión a internet para abrir el enlace.\n\n¿Tienes alguna duda? Envíanos un mensaje por WhatsApp:\n\nhttps://wa.me/3197010286964\n\no ponte en contacto con {{namePartnerOrganization}}.',
      nl: 'Dit is een bericht van het Rode Kruis. {{namePartnerOrganization}} heeft jouw telefoonnummer aan ons doorgegeven.\n\nWe kunnen jou helpen met wekelijkse Albert Heijn waardebonnen. Klik op de link en vul de aanvraag in:\n\nhttps://register.nlrc.121.global/?programs=2\n\nJe hebt een internetverbinding nodig om de link te openen.\n\nHeb je vragen? Stuur ons een bericht via WhatsApp:\n\nhttps://wa.me/3197010286964\n\nof neem contact op met {{namePartnerOrganization}}.',
      pt_BR:
        'Esta é uma mensagem da Cruz Vermelha. O parceiro {{namePartnerOrganization}} passou-nos o seu número de telefone.\n\nPodemos ajudar com cupões semanais do Albert Heijn. Clique na ligação e conclua a candidatura:\n\nhttps://register.nlrc.121.global/?programs=2\n\nPrecisa de uma ligação à Internet para abrir a ligação.\n\nTem dúvidas? Envie-nos uma mensagem através do WhatsApp:\n\nhttps://wa.me/3197010286964\n\nou contacte o parceiro {{namePartnerOrganization}}.',
      fr: "Ce message vous est envoyé par la Croix-Rouge. {{namePartnerOrganization}} nous a communiqué votre numéro de téléphone.\n\nNous pouvons vous aider avec des bons d'achat hebdomadaires Albert Heijn. Cliquez sur le lien et complétez la demande:\n\nhttps://register.nlrc.121.global/?programs=2\n\nVous avez besoin d’une connexion Internet pour ouvrir le lien.\n\nAvez-vous des questions? Envoyez-nous un message via WhatsApp:\n\nhttps://wa.me/3197010286964\n\nou contactez {{namePartnerOrganization}}.",
    },
  },
  included: {
    isSendMessageTemplate: true,
    label: {
      en: 'Include',
    },
    isWhatsappTemplate: false,
    message: {
      ar: 'هذه الرسالة واردة من الصليب الأحمر.\n\nشكرًا لكم على التسجيل. اعتبارًا من الآن، ستُرسل إليك قسيمة ألبرت هيجن (Albert Heijn) عبر الواتساب كل ثلاثاء. ستتلقى القسائم طالما أنك مدرج في قائمة {{namePartnerOrganization}}.\n\nيمكن أن يزودك الصليب الأحمر أيضًا بمعلومات عن المساعدات الطبية أو المساعدات الغذائية أو المساعدات المتعلقة بالسلامة، على سبيل المثال. تفقد موقعنا الإلكتروني:\n\nhttps://helpfulinformation.redcross.nl/\n\nأو اطرح سؤالك عبر الواتساب:\n\nhttps://wa.me/3197010286964',
      en: 'This is a message from the Red Cross.\n\nThanks for registering. From now on you will receive an Albert Heijn voucher via WhatsApp every Tuesday. You will receive the vouchers as long as you are on the list of {{namePartnerOrganization}}.\n\nThe Red Cross can also provide you with information about, for example, medical assistance, food or safety. Check out our website:\n\nhttps://helpfulinformation.redcross.nl/\n\nor ask your question via WhatsApp:\n\nhttps://wa.me/3197010286964',
      es: 'Este es un mensaje de la Cruz Roja.\n\nGracias por registrarte. A partir de ahora recibirás un vale de Albert Heijn por WhatsApp todos los martes. Recibirás los vales mientras estés en la lista de {{namePartnerOrganization}}.\n\nLa Cruz Roja también puede ofrecerte información sobre, por ejemplo, asistencia sanitaria, alimentos o seguridad. Consulta nuestra página web:\n\nhttps://helpfulinformation.redcross.nl/\n\no pregúntanos a través de WhatsApp:\n\nhttps://wa.me/3197010286964',
      nl: 'Dit is een bericht van het Rode Kruis.\n\nBedankt voor je inschrijving. Je ontvangt vanaf nu elke dinsdag een Albert Heijn waardebon via WhatsApp. Je ontvangt de waardebonnen zo lang je op de lijst staat van {{namePartnerOrganization}}.\n\nHet Rode Kruis kan je ook informatie geven over bijvoorbeeld medische hulp, voedsel of veiligheid. Kijk  op onze website:\n\nhttps://helpfulinformation.redcross.nl/\n\nof stel je vraag via WhatsApp:\n\nhttps://wa.me/3197010286964',
      pt_BR:
        'Esta é uma mensagem da Cruz Vermelha.\n\nAgradecemos o seu registo. A partir de agora irá receber um cupão do Albert Heijn através do WhatsApp todas as terças-feiras. Vai receber os cupões enquanto estiver na lista do parceiro {{namePartnerOrganization}}.\n\nA Cruz Vermelha também pode dar-lhe informações sobre, por exemplo, assistência médica, alimentação ou segurança. Veja o nosso Website:\n\nhttps://helpfulinformation.redcross.nl/\n\nou coloque a sua dúvida através do WhatsApp:\n\nhttps://wa.me/3197010286964',
      fr: "Ce message vous est envoyé par la Croix-Rouge.\n\nMerci de votre inscription. Désormais, vous recevrez chaque mardi un bon d'achat Albert Heijn via WhatsApp. Vous recevrez les bons tant que vous figurerez sur la liste de {{namePartnerOrganization}}.\n\nLa Croix-Rouge peut également vous communiquer des informations concernant, par exemple, l'assistance médicale, la nourriture ou la sécurité. Consultez notre site web:\n\nhttps://helpfulinformation.redcross.nl/\n\nou posez vos questions via WhatsApp:\n\nhttps://wa.me/3197010286964",
    },
  },
  inclusionEnded: {
    isSendMessageTemplate: true,
    label: {
      en: 'End inclusion',
    },
    isWhatsappTemplate: false,
    message: {
      ar: 'هذه الرسالة واردة من الصليب الأحمر.\n\nتلقيت هذا الأسبوع قسيمتك الأخيرة لأنك لم تُعد مدرجًا في قائمة {{namePartnerOrganization}}.\n\nهل لديك أي أسئلة متعلقة بذلك؟ راسلنا عبر الواتساب:\n\nhttps://wa.me/3197010286964\n\nأو اتصل بـ {{namePartnerOrganization}}.\n\nنتمنى لكم كل التوفيق،',
      en: 'This is a message from the Red Cross.\n\nThis week you received your last voucher because you are no longer on the list of {{namePartnerOrganization}}.\n\nDo you have questions about this? Send us a message via WhatsApp:\n\nhttps://wa.me/3197010286964\n\nor contact {{namePartnerOrganization}}.\n\nWe wish you all the best.',
      es: 'Este es un mensaje de la Cruz Roja.\n\nEsta semana has recibido tu último vale porque ya no estás en la lista de {{namePartnerOrganization}}.\n\n¿Tienes alguna pregunta al respecto? Envíanos un mensaje por WhatsApp:\n\nhttps://wa.me/3197010286964\n\no ponte en contacto con {{namePartnerOrganization}}.\n\nTe deseamos todo lo mejor.',
      nl: 'Dit is een bericht van het Rode Kruis.\n\nDeze week heb je je laatste waardebon ontvangen omdat je niet meer op de lijst van {{namePartnerOrganization}} staat.\n\nHeb je hier vragen over? Stuur ons dan een bericht via WhatsApp:\n\nhttps://wa.me/3197010286964\n\nof neem contact op met {{namePartnerOrganization}}.\n\nWe wensen je het allerbeste.',
      pt_BR:
        'Esta é uma mensagem da Cruz Vermelha.\n\nEsta semana recebeu o seu último cupão porque já não está na lista do parceiro {{namePartnerOrganization}}.\n\nTem dúvidas sobre isto? Envie-nos uma mensagem através do WhatsApp:\n\nhttps://wa.me/3197010286964\n\nou contacte o parceiro {{namePartnerOrganization}}.\n\nDesejamos-lhe as maiores felicidades.',
      fr: 'Ce message vous est envoyé par la Croix-Rouge.\n\nCette semaine, vous avez reçu votre dernier bon d’achat, car vous ne figurez plus sur la liste de {{namePartnerOrganization}}.\n\nAvez-vous des questions à ce sujet ? Envoyez-nous un message via WhatsApp :\n\nhttps://wa.me/3197010286964\n\nou contactez {{namePartnerOrganization}}.\n\nNous vous souhaitons une bonne continuation.',
    },
  },
  rejected: {
    isSendMessageTemplate: true,
    label: {
      en: 'Reject',
    },
    isWhatsappTemplate: false,
    message: {
      ar: 'هذه الرسالة واردة من الصليب الأحمر.\n\nيؤسفنا أن نرفض طلبك للحصول على قسائم ألبرت هيجن (Albert Heijn). لست مسجلاً لدى إحدى المنظمات الشريكة لنا للحصول على هذه المساعدات.\n\nهل لديك أي أسئلة متعلقة بذلك؟ يُرجى مراسلتنا عبر الواتساب:\n\nhttps://wa.me/3197010286964',
      en: 'This is a message from the Red Cross.\n\nUnfortunately, we have to reject your request for Albert Heijn vouchers. You have not been signed up for this help by one of our partner organizations.\n\nDo you have questions about this? Please contact us via WhatsApp:\n\nhttps://wa.me/3197010286964',
      es: 'Este es un mensaje de la Cruz Roja.\n\nLamentablemente, tenemos que rechazar tu solicitud de vales de Albert Heijn. No apareces inscrito para esta ayuda por ninguna de nuestras organizaciones asociadas.\n\n¿Tienes alguna pregunta al respecto? Ponte en contacto con nosotros a través de WhatsApp:\n\nhttps://wa.me/3197010286964',
      nl: 'Dit is een bericht van het Rode Kruis.\n\nHelaas moeten wij jouw aanvraag voor Albert Heijn waardebonnen afwijzen. Je bent niet voor deze hulp aangemeld door een van onze partnerorganisaties.\n\nHeb je hier vragen over? Neem dan contact met ons op via WhatsApp:\n\nhttps://wa.me/3197010286964',
      pt_BR:
        'Esta é uma mensagem da Cruz Vermelha.\n\nInfelizmente, tivemos que rejeitar o seu pedido de cupões do Albert Heijn. Não se inscreveu para receber esta ajuda de uma das nossas organizações parceiras.\n\nTem dúvidas sobre isto? Contacte-nos através do WhatsApp:\n\nhttps://wa.me/3197010286964',
      fr: 'Ce message vous est envoyé par la Croix-Rouge.\n\nMalheureusement, nous ne pouvons pas accepter votre demande de bons d’achat Albert Heijn. Vous n’avez pas été inscrit pour cette aide par l’une de nos organisations partenaires.\n\nAvez-vous des questions à ce sujet ? Contactez-nous via WhatsApp:\n\nhttps://wa.me/3197010286964',
    },
  },
  whatsappGenericMessage: {
    isSendMessageTemplate: false,
    isWhatsappTemplate: true,
    contentSid: {
      ar: 'arPvGeneric',
      en: 'enPvGeneric',
      es: 'esPvGeneric',
      nl: 'nlPvGeneric',
      pt_BR: 'pt_BRPvGeneric',
      tl: 'tlPvGeneric',
      in: 'inPvGeneric',
      fr: 'frPvGeneric',
    },
  },
  whatsappPayment: {
    isSendMessageTemplate: false,
    isWhatsappTemplate: true,
    contentSid: {
      ar: 'arPvPayment',
      en: 'enPvPayment',
      es: 'esPvPayment',
      nl: 'nlPvPayment',
      pt_BR: 'pt_BRPvPayment',
      tl: 'tlPvPayment',
      in: 'inPvPayment',
      fr: 'frPvPayment',
    },
  },
  whatsappVoucher: {
    isSendMessageTemplate: false,
    isWhatsappTemplate: false,
    message: {
      ar: 'هذه رسالة من الصليب الأحمر.\n\nتحتوي هذه الرسالة على صورتين:\n1 الأولى لقسيمة الشراء من البرت هاين (cadeaukaart) - مع رمز مرئي.\n2 و تتضمن الأخرى شرحاً لكيفية استخدام قسيمة الشراء  من البرت هاين.\n\nإذا تلقيت أكثر من إيصال، فذلك لأن هناك قسائم من الأسابيع السابقة لم استلم حتى الآن .\n\n المبلغ الذي تتلقاه مكتوب في أعلى القسيمة. \\ nيمكنك استخدام هذه القسيمة لدى أي سوبر ماركت ألبرت هاين في هولندا.\n\nلست مضطراً لاستخدام كامل المبلغ مرة واحدة. لذى الرجاء المحافظة على صورة القسيمة لإعادة استخدامها حتى انتهاء الرصيد.\n\nسوف سيتم ارسال قسيمة اسبوعية في كل ثلاثاء.\n\nعند إيقاف الدعم, ستتلقى رسالة من الصليب الأحمر توضح لك متى ولماذا ننهي هذا الدعم.\n\nهل لديك اسئلة؟ قم بمراسلتنا عبر تطبيق واتسآب https://wa.me/3197010286964',
      en: 'This is a message from the Red Cross.\n\nWith this message you will receive:\n1. An Albert Heijn supermarket voucher (cadeaukaart) - this is the picture with the barcode.\n2. An explanation on how to use the voucher in Albert Heijn.\n\nIf you received more than one voucher this is because you had not yet received vouchers from previous weeks.\n\n The amount that you receive is written on the top of the voucher.\nYou can spend the vouchers at any Albert Heijn supermarket in the Netherlands.\n\nYou don’t have to spend everything at once. So keep the vouchers and re-use them until the complete amount is finished.\n\nYou will receive your Albert Heijn voucher every week on Tuesday. When we end the support you will receive a message from us, explaining you when and why we end the support.\n\nDo you have questions? Send us a message on WhatsApp: https://wa.me/3197010286964',
      es: 'Éste es un mensaje de la Cruz Roja.\n\nCon este mensaje recibirá:\n1. Un bono del supermercado Albert Heijn (cadeaukaart): ésta es la imagen con el código de barras.\n2. Una explicación sobre cómo utilizar el bono en Albert Heijn.\n\nSi recibió más de un cupón, esto se debe a que aún no había recibido los cupones de las semanas anteriores.\n\nLa cantidad que recibe está escrita en la esquina superior del cupón.\nPuede gastar los cupones en cualquier supermercado Albert Heijn de los Países Bajos.\n\nNo tiene que gastarlo todo a la vez. Así que quédese con los vales y reutilícelos hasta agotar el importe total.\n\nRecibirá su bono de Albert Heijn cada semana los martes. Cuando finalicemos la ayuda, recibirá un mensaje nuestro que le explicará cuándo y por qué finalizamos la ayuda.\n\n¿Tienes preguntas? Envíanos un mensaje en WhatsApp: https://wa.me/3197010286964',
      nl: 'Dit is een bericht van het Rode Kruis.\n\nMet dit bericht ontvang je:\n1. Een Albert Heijn supermarkt voucher - dit is de foto met de barcode.\n2. Een uitleg van hoe je de voucher moet gebruiken in de Albert Heijn. \n\nAls je meer dan één voucher ontvangt, komt dit doordat je geen vouchers hebt ontvangen van de voorgaande weken. \n\nDe waarde van elke voucher staat geschreven op de hoek van de voucher.\nJe kan de voucher gebruiken in elke Albert Heijn in Nederland.\n\nJe hoeft niet alles in één keer te gebruiken. Dus bewaar de vouchers en gebruik de voucher opnieuw totdat het hele bedrag op is. \n\nJe zal je Albert Heijn voucher elke week ontvangen op dinsdag. Wanneer we de voucherhulp stoppen sturen wij jou een bericht. In dat bericht leggen wij uit wanneer de hulp stopt en waarom.\n\nHeb je vragen? Stuur ons een bericht op WhatsApp: https://wa.me/3197010286964',
      pt_BR:
        'Esta é uma mensagem da Cruz Vermelha.\n\nCom esta mensagem você receberá:\n1. Um vale de supermercado Albert Heijn (cadeaukaart) - esta é a foto com o código de barras.\n2. Uma explicação de como usar o vale no Albert Heijn.\n\nSe você recebeu mais de um vale, é porque ainda não tinha recebido os vales das semanas anteriores.\n\nO valor que você recebe está escrito no topo do voucher..\nVocê pode gastar os vales em qualquer supermercado Albert Heijn na Holanda.\n\nVocê não precisa gastar tudo de uma vez. Portanto, guarde os vouchers e reutilize-os até esgotar o valor total.\n\nVocê receberá seus vales de Albert Heijn todas as semanas na terça-feira. Quando encerrarmos o suporte, você receberá uma mensagem nossa, explicando quando e por que encerramos o suporte.\n\nVocê tem perguntas? Envie-nos uma mensagem no WhatsApp: https://wa.me/3197010286964',
      tl: 'Ang mensaheng ito ay galing sa Red Cross.\n\nKasama ng mensaheng ito, makakatanggap ka ng 2 litrato.\nAng una ay ang Albert Heijn supermarket voucher (cadeaukaart) na may barcode.\nAt ang isa pa ay ang paliwanag kung papaano gamitin ang voucher para pambayad sa Albert Heijn.\n\nAng halagang natanggap ay nakasulat sa itaas na sulok ng voucher.\nMaaari mong gastusin ang voucher na ito sa kahit saang Albert Heijn supermarket sa Netherlands.\n\nHindi mo ito kailangang gastusin lahat sa isang bilihan. Itago ang iyong voucher at muling gamitin ang mga ito hanggang maubos ang laman nito.\n\nMakakatanggap ang voucher kada Martes. Sa pagtatapos ng iyong suporta, makakatanggap ka ng mensahe mula sa amin na nagpapaliwanag sa iyo ng dahilan at kung kailan matatapos ang pagtanggap ng iyong suporta.\n\nMay mga katanungan ka ba? Magpadala ng mensahe sa amin sa WhatsApp: http://wa.me/3197010286964',
      in: 'Ini adalah pesan dari Red Cross.\n\nDengan pesan ini Anda akan menerima:\n1. Sebuah voucher supermarket Albert Heijn  (cadeaukaart) - Inilah tampilannya dengan barcode-nya.\n2. Penjelasan mengenai cara menggunakan voucher ini di Albert Heijn.\n\nApabila Anda menerima lebih dari satu voucher itu karena Anda belum menerima voucher di minggu-minggu sebelumnya. \n\nNilai yang Anda terima tertera di bagian atas voucher.\nAnda bisa membelanjakan voucher tersebut di supermarket Albert Heijn mana pun di negeri Belanda.\n\nAnda tidak perlu menghabiskan nilainya secara sekaligus.  Jadi simpanlah voucher dan gunakan kembali hingga nilainya habis terpakai.\n\nAnda akan menerima voucher Albert Heijn setiap minggunya pada hari Selasa. Apabila kami menghentikan bantuan ini Anda akan menerima pesan dari kami, yang menjelaskan kapan dan mengapa kami menghentikan bantuan.\n\nApakah Anda punya pertanyaan ? Kirimkan pesan di WhatsApp: \nhttps://wa.me/3197010286964',
      fr: "Ceci est un message de la Croix-Rouge.\n\nAvec ce message, vous recevrez:\n1. Un bon de supermarché Albert Heijn (cadeaukaart) - c'est la photo avec le code-barres.\n2. Une explication sur la façon d'utiliser le bon à Albert Heijn.\n\nSi vous avez reçu plusieurs bons, c'est parce que: \n1. Vous n'aviez pas encore reçu de bons des semaines précédentes.\n\n Le montant que vous recevez est écrit dans le coin supérieur du bon.\nVous pouvez utiliser les bons dans n'importe quel supermarché Albert Heijn aux Pays-Bas.\n\nCe n'est pas necessaire de tout dépenser d'un coup. Conservez donc les bons et réutilisez-les jusqu'à ce que le montant total soit épuisé.\n\nVous recevrez votre bon chaque semaine le mardi. Lorsque nous mettrons fin à l'aide, vous recevrez un message de notre part, vous expliquant quand et pourquoi nous mettons fin à l'aide.\n\nAvez-vous des questions? Envoyez-nous un message sur WhatsApp:\nhttps://wa.me/3197010286964",
    },
  },
  whatsappReply: {
    isSendMessageTemplate: false,
    isWhatsappTemplate: false,
    message: {
      ar: 'هذا رسالة آلية، إذا كانت لديك اسئلة يمكنك مراسلة الصليب الأحمر على واتس آب: +3197010286964',
      en: 'This is an automated message, for questions please contact the Red Cross Helpdesk on WhatsApp: +3197010286964',
      es: 'Éste es un mensaje automático, cualquier duda o pregunta por favor contacte al Buro de Asistencia de la Cruz Roja en WhatsApp: +3197010286964',
      nl: 'Dit is een geautomatiseerd bericht, voor vragen neem contact op met de Rode Kruis Helpdesk via WhatsApp: +3197010286964',
      pt_BR:
        'Esta é uma mensagem automatizada, para perguntas, entre em contato com o Helpdesk da Cruz Vermelha no WhatsApp: +3197010286964',
      tl: 'Ito ay automated na mensahe, para sa mga katanungan, maaring i-contact ang Red Cross Helpdesk sa WhatsApp: +3197010286964',
      in: 'Ini adalah pesan otomatis. apabila ada pertanyaan harap kontak the Red Cross Helpdesk di WhatsApp +3197010286964',
      fr: "Ceci est un message automatisé, pour toutes questions, s'il vous plaît, veuillez contacter le Guiche d'information de la Croix-Rouge sur WhatsApp: +3197010286964",
    },
  },
  remindInvite: {
    isSendMessageTemplate: true,
    label: {
      en: 'Remind invite',
    },
    isWhatsappTemplate: false,
    message: {
      ar: 'هذه الرسالة واردة من الصليب الأحمر.\n\nلا يزال بإمكانك الاشتراك في قسائم ألبرت هيجن (Albert Heijn) الأسبوعية. انقر على الرابط وعبأ بيانات الطلب:\n\nhttps://register.nlrc.121.global/?programs=2\n\nهل لديك أي أسئلة؟ راسلنا عبر الواتساب:\n\nhttps://wa.me/3197010286964\n\nأو اتصل بـ {{namePartnerOrganization}}.',
      en: 'This is a message from the Red Cross.\n\nYou can still sign up for the weekly Albert Heijn vouchers. Click on the link and complete the application:\n\nhttps://register.nlrc.121.global/?programs=2\n\nDo you have questions? Send us a message via WhatsApp:\n\nhttps://wa.me/3197010286964\n\nor contact {{namePartnerOrganization}}.',
      es: 'Este es un mensaje de la Cruz Roja.\n\nTodavía puedes apuntarte para recibir los vales semanales de Albert Heijn. Haz clic en el enlace y rellena la solicitud:\n\nhttps://register.nlrc.121.global/?programs=2\n\n¿Tienes alguna pregunta? Envíanos un mensaje por WhatsApp:\n\nhttps://wa.me/3197010286964\n\no ponte en contacto con {{namePartnerOrganization}}.',
      nl: 'Dit is een bericht van het Rode Kruis.\n\nJe kan je nog steeds aanmelden voor de wekelijkse Albert Heijn waardebonnen. Klik op de link en vul de aanvraag in:\n\nhttps://register.nlrc.121.global/?programs=2\n\nHeb je vragen? Stuur ons een bericht via WhatsApp:\n\nhttps://wa.me/3197010286964\n\nof neem contact op met {{namePartnerOrganization}}.',
      pt_BR:
        'Esta é uma mensagem da Cruz Vermelha.\n\nAinda pode inscrever-se para receber cupões semanais do Albert Heijn. Clique na ligação e conclua a candidatura:\n\nhttps://register.nlrc.121.global/?programs=2\n\nTem dúvidas? Envie-nos uma mensagem através do WhatsApp:\n\nhttps://wa.me/3197010286964\n\nou contacte o parceiro {{namePartnerOrganization}}.',
      fr: 'Ce message vous est envoyé par la Croix-Rouge.\n\nVous pouvez encore vous inscrire pour recevoir des bons d’achat hebdomadaires Albert Heijn. Cliquez sur le lien et complétez la demande :\n\nhttps://register.nlrc.121.global/?programs=2\n\nAvez-vous des questions ? Envoyez-nous un message via WhatsApp :\n\nhttps://wa.me/3197010286964\n\nou contactez {{namePartnerOrganization}}.',
    },
  },
  prepareToEndInclusion: {
    isSendMessageTemplate: true,
    label: {
      en: 'Prepare to end inclusion',
    },
    isWhatsappTemplate: false,
    message: {
      ar: 'هذه الرسالة واردة من الصليب الأحمر.\n\nستحصل على القسيمة الأخيرة في غضون أربعة أسابيع نظرًا لبلوغ الحد الأقصى لفترة المساعدات الغذائية.\n\nتكون مساعداتنا الغذائية مؤقتة دائمًا والهدف منها أن تكون معونة طارئة. نحن نعمل مع المنظمة الشريكة لنا.\n\nهل لديك أي أسئلة متعلقة بذلك؟ يُرجى الاتصال بـ {{namePartnerOrganization}} أو إرسال رسالة إلينا عبر الواتساب:\n\nhttps://wa.me/3197010286964\n\nنتمنى لكم كل التوفيق،',
      en: 'This is a message from the Red Cross.\n\nIn four weeks you will receive the last voucher because the maximum period of food aid has been reached.\n\nOur food aid is always temporary and intended as emergency aid. We work together with our partner organization.\n\nDo you have questions about this? Please contact {{namePartnerOrganization}} or send us a message via WhatsApp:\n\nhttps://wa.me/3197010286964\n\nWe wish you all the best.',
      es: 'Este es un mensaje de la Cruz Roja.\n\nDentro de cuatro semanas recibirás el último vale, porque se ha alcanzado el periodo máximo de ayuda alimentaria.\n\nNuestra ayuda alimentaria siempre es temporal y está pensada como una ayuda de emergencia. Colaboramos con nuestras organizaciones asociadas.\n\n¿Tienes alguna pregunta al respecto? Ponte en contacto con {{namePartnerOrganization}} o envíanos un mensaje por WhatsApp:\n\nhttps://wa.me/3197010286964\n\nTe deseamos todo lo mejor.',
      nl: 'Dit is een bericht van het Rode Kruis.\n\nOver vier weken ontvang je de laatste waardebon omdat de maximale periode van de voedselhulp dan is bereikt.\n\nOnze voedselhulp is altijd tijdelijk en bedoeld als noodhulp. Wij werken samen met onze partnerorganisatie.\n\nHeb je hier vragen over? Neem dan contact op met {{namePartnerOrganization}} of stuur ons een bericht via WhatsApp:\n\nhttps://wa.me/3197010286964\n\nWe wensen je het allerbeste.',
      pt_BR:
        'Esta é uma mensagem da Cruz Vermelha.\n\nDentro de quatro semanas irá receber o último cupão porque foi atingido o período máximo de ajuda alimentar.\n\nA nossa ajuda alimentar é sempre temporária e destina-se a ser uma ajuda de emergência. Trabalhamos em conjunto com a nossa organização parceira.\n\nTem dúvidas sobre isto? Contacte o parceiro {{namePartnerOrganization}} ou envie-nos uma mensagem através do WhatsApp:\n\nhttps://wa.me/3197010286964\n\nDesejamos-lhe as ma',
      fr: 'Ce message vous est envoyé par la Croix-Rouge.\n\nDans quatre semaines, vous recevrez le dernier bon d’achat, car la durée maximale de l’aide alimentaire a été atteinte.\n\nNotre aide alimentaire est toujours temporaire et destinée à être une aide d’urgence. Nous travaillons en collaboration avec notre organisation partenaire.\n\nAvez-vous des questions à ce sujet ? Contactez {{namePartnerOrganization}} ou envoyez-nous un message via WhatsApp :\n\nhttps://wa.me/3197010286964\n\nNous vous souhaitons une bonne continuation.',
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
  blockVisaCard: {
    isSendMessageTemplate: false,
    isWhatsappTemplate: false,
    message: {
      en: 'Dear parent/carer, your grocery card is blocked. If you do not know why, please contact customer service: call or whatsapp 097 010 204 851. School Meals',
      nl: 'Beste ouder/verzorger, uw boodschappenkaart is geblokkeerd. Als u niet weet waarom, bel of WhatsApp 097 010 204 851. Schoolmaaltijden',
      ar: 'عزيزي الوالد / مقدم الرعاية ، تم حظر بطاقة التسوق الخاصة بك. إذا كنت لا تعرف السبب ، فاتصل أو ارسل على واتساب 097010204851 .الوجبات المدرسية',
      tr: 'Sevgili veli/bakıcı, alışveriş kartınız bloke edildi. Eğer nedenini bilmiyorsanız, 097 010 204 851 nolu telefonu arayın ya da Whatsapp mesajı gönderin. Okul Öğünleri',
    },
  },
  unblockVisaCard: {
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
