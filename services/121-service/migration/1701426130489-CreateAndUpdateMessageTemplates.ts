import { MigrationInterface, QueryRunner } from 'typeorm';
import { MessageTemplateEntity } from '../src/notifications/message-template/message-template.entity';
import { ProgramEntity } from '../src/programs/program.entity';

export class CreateAndUpdateMessageTemplates1701426130489
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Commit transaction because the tables are needed before the insert
    await queryRunner.commitTransaction();
    await this.migrateData(queryRunner);
    // Start artifical transaction because typeorm migrations automatically tries to close a transcation after migration
    await queryRunner.startTransaction();
  }

  private async migrateData(queryRunner: QueryRunner): Promise<void> {
    const manager = queryRunner.manager;

    const messageTemplateRepository = manager.getRepository(
      MessageTemplateEntity,
    );

    // Update existing templates
    const templates = await messageTemplateRepository.find();
    const genericTransactionCodeTemplates = [
      'visaDebitCardCreated',
      'visaLoad',
      'jumboCardSent',
    ];
    for await (const template of templates) {
      if (template.message.includes('{{1}}')) {
        if (genericTransactionCodeTemplates.includes(template.type)) {
          template.message = template.message.replace('{{1}}', '[[1]]');
        } else {
          template.message = template.message.replace('{{1}}', '[[amount]]');
        }
        await messageTemplateRepository.save(template);
      }
    }

    // Add new status-change templates
    // use the same templates for LVV and PV (although PV does not need arabic)
    const programRepository = manager.getRepository(ProgramEntity);

    // Raw get many is used else it tries to explicitly select the columns of the entity
    // that are only created in a next migration (and thus not yet available e.g. enableScope)
    const relevantPrograms = await programRepository
      .createQueryBuilder('program')
      .select('program.id as id')
      .where('program.ngo = :ngo', { ngo: 'NLRC' })
      .andWhere('program.id IN (:...ids)', { ids: [1, 2] })
      .getRawMany();

    const newTemplates = {
      invited: {
        isWhatsappTemplate: false,
        message: {
          en: 'This is a message from the Red Cross. {{namePartnerOrganization}} has passed on your telephone number to us.\n\nWe can help you with weekly Albert Heijn vouchers. Click on the link and complete the application:\n\nhttps://register.nlrc.121.global/?programs=2\n\nYou need an internet connection to open the link.\n\nDo you have questions? Send us a message via WhatsApp:\n\nhttps://wa.me/3197010286964\n\nor contact {{namePartnerOrganization}}.',
          es: 'Este es un mensaje de la Cruz Roja. {{namePartnerOrganization}} nos ha facilitado tu número de teléfono.\n\nPodemos ayudarte con los vales semanales de Albert Heijn. Haz clic en el enlace y rellena la solicitud:\n\nhttps://register.nlrc.121.global/?programs=2\n\nNecesitas tener conexión a internet para abrir el enlace.\n\n¿Tienes alguna duda? Envíanos un mensaje por WhatsApp:\n\nhttps://wa.me/3197010286964\n\no ponte en contacto con {{namePartnerOrganization}}.',
          nl: 'Dit is een bericht van het Rode Kruis. {{namePartnerOrganization}} heeft jouw telefoonnummer aan ons doorgegeven.\n\nWe kunnen jou helpen met wekelijkse Albert Heijn waardebonnen. Klik op de link en vul de aanvraag in:\n\nhttps://register.nlrc.121.global/?programs=2\n\nJe hebt een internetverbinding nodig om de link te openen.\n\nHeb je vragen? Stuur ons een bericht via WhatsApp:\n\nhttps://wa.me/3197010286964\n\nof neem contact op met {{namePartnerOrganization}}.',
          pt_BR:
            'Esta é uma mensagem da Cruz Vermelha. O parceiro {{namePartnerOrganization}} passou-nos o seu número de telefone.\n\nPodemos ajudar com cupões semanais do Albert Heijn. Clique na ligação e conclua a candidatura:\n\nhttps://register.nlrc.121.global/?programs=2\n\nPrecisa de uma ligação à Internet para abrir a ligação.\n\nTem dúvidas? Envie-nos uma mensagem através do WhatsApp:\n\nhttps://wa.me/3197010286964\n\nou contacte o parceiro {{namePartnerOrganization}}.',
          ar: 'هذه الرسالة واردة من الصليب الأحمر. {{namePartnerOrganization}} قد أرسل إلينا رقم هاتفك.\n\nيمكننا مساعدتك من خلال قسائم ألبرت هيجن (Albert Heijn) الأسبوعية. انقر على الرابط وعبأ بيانات الطلب:\n\nhttps://register.nlrc.121.global/?programs=2\n\nيجب أن يتوفر لديك اتصال بالإنترنت لفتح الرابط.\n\nهل لديك أي أسئلة؟ راسلنا عبر الواتساب:\n\nhttps://wa.me/3197010286964\n\nأو اتصل بـ {{namePartnerOrganization}}.',
          fr: "Ce message vous est envoyé par la Croix-Rouge. {{namePartnerOrganization}} nous a communiqué votre numéro de téléphone.\n\nNous pouvons vous aider avec des bons d'achat hebdomadaires Albert Heijn. Cliquez sur le lien et complétez la demande:\n\nhttps://register.nlrc.121.global/?programs=2\n\nVous avez besoin d’une connexion Internet pour ouvrir le lien.\n\nAvez-vous des questions? Envoyez-nous un message via WhatsApp:\n\nhttps://wa.me/3197010286964\n\nou contactez {{namePartnerOrganization}}.",
        },
      },
      included: {
        isWhatsappTemplate: false,
        message: {
          en: 'This is a message from the Red Cross.\n\nThanks for registering. From now on you will receive an Albert Heijn voucher via WhatsApp every Tuesday. You will receive the vouchers as long as you are on the list of {{namePartnerOrganization}}.\n\nThe Red Cross can also provide you with information about, for example, medical assistance, food or safety. Check out our website:\n\nhttps://helpfulinformation.redcross.nl/\n\nor ask your question via WhatsApp:\n\nhttps://wa.me/3197010286964',
          es: 'Este es un mensaje de la Cruz Roja.\n\nGracias por registrarte. A partir de ahora recibirás un vale de Albert Heijn por WhatsApp todos los martes. Recibirás los vales mientras estés en la lista de {{namePartnerOrganization}}.\n\nLa Cruz Roja también puede ofrecerte información sobre, por ejemplo, asistencia sanitaria, alimentos o seguridad. Consulta nuestra página web:\n\nhttps://helpfulinformation.redcross.nl/\n\no pregúntanos a través de WhatsApp:\n\nhttps://wa.me/3197010286964',
          nl: 'Dit is een bericht van het Rode Kruis.\n\nBedankt voor je inschrijving. Je ontvangt vanaf nu elke dinsdag een Albert Heijn waardebon via WhatsApp. Je ontvangt de waardebonnen zo lang je op de lijst staat van {{namePartnerOrganization}}.\n\nHet Rode Kruis kan je ook informatie geven over bijvoorbeeld medische hulp, voedsel of veiligheid. Kijk  op onze website:\n\nhttps://helpfulinformation.redcross.nl/\n\nof stel je vraag via WhatsApp:\n\nhttps://wa.me/3197010286964',
          pt_BR:
            'Esta é uma mensagem da Cruz Vermelha.\n\nAgradecemos o seu registo. A partir de agora irá receber um cupão do Albert Heijn através do WhatsApp todas as terças-feiras. Vai receber os cupões enquanto estiver na lista do parceiro {{namePartnerOrganization}}.\n\nA Cruz Vermelha também pode dar-lhe informações sobre, por exemplo, assistência médica, alimentação ou segurança. Veja o nosso Website:\n\nhttps://helpfulinformation.redcross.nl/\n\nou coloque a sua dúvida através do WhatsApp:\n\nhttps://wa.me/3197010286964',
          ar: 'هذه الرسالة واردة من الصليب الأحمر.\n\nشكرًا لكم على التسجيل. اعتبارًا من الآن، ستُرسل إليك قسيمة ألبرت هيجن (Albert Heijn) عبر الواتساب كل ثلاثاء. ستتلقى القسائم طالما أنك مدرج في قائمة {{namePartnerOrganization}}.\n\nيمكن أن يزودك الصليب الأحمر أيضًا بمعلومات عن المساعدات الطبية أو المساعدات الغذائية أو المساعدات المتعلقة بالسلامة، على سبيل المثال. تفقد موقعنا الإلكتروني:\n\nhttps://helpfulinformation.redcross.nl/\n\nأو اطرح سؤالك عبر الواتساب:\n\nhttps://wa.me/3197010286964',
          fr: "Ce message vous est envoyé par la Croix-Rouge.\n\nMerci de votre inscription. Désormais, vous recevrez chaque mardi un bon d'achat Albert Heijn via WhatsApp. Vous recevrez les bons tant que vous figurerez sur la liste de {{namePartnerOrganization}}.\n\nLa Croix-Rouge peut également vous communiquer des informations concernant, par exemple, l'assistance médicale, la nourriture ou la sécurité. Consultez notre site web:\n\nhttps://helpfulinformation.redcross.nl/\n\nou posez vos questions via WhatsApp:\n\nhttps://wa.me/3197010286964",
        },
      },
      inclusionEnded: {
        isWhatsappTemplate: false,
        message: {
          en: 'This is a message from the Red Cross.\n\nThis week you received your last voucher because you are no longer on the list of {{namePartnerOrganization}}.\n\nDo you have questions about this? Send us a message via WhatsApp:\n\nhttps://wa.me/3197010286964\n\nor contact {{namePartnerOrganization}}.\n\nWe wish you all the best.',
          es: 'Este es un mensaje de la Cruz Roja.\n\nEsta semana has recibido tu último vale porque ya no estás en la lista de {{namePartnerOrganization}}.\n\n¿Tienes alguna pregunta al respecto? Envíanos un mensaje por WhatsApp:\n\nhttps://wa.me/3197010286964\n\no ponte en contacto con {{namePartnerOrganization}}.\n\nTe deseamos todo lo mejor.',
          nl: 'Dit is een bericht van het Rode Kruis.\n\nDeze week heb je je laatste waardebon ontvangen omdat je niet meer op de lijst van {{namePartnerOrganization}} staat.\n\nHeb je hier vragen over? Stuur ons dan een bericht via WhatsApp:\n\nhttps://wa.me/3197010286964\n\nof neem contact op met {{namePartnerOrganization}}.\n\nWe wensen je het allerbeste.',
          pt_BR:
            'Esta é uma mensagem da Cruz Vermelha.\n\nEsta semana recebeu o seu último cupão porque já não está na lista do parceiro {{namePartnerOrganization}}.\n\nTem dúvidas sobre isto? Envie-nos uma mensagem através do WhatsApp:\n\nhttps://wa.me/3197010286964\n\nou contacte o parceiro {{namePartnerOrganization}}.\n\nDesejamos-lhe as maiores felicidades.',
          ar: 'هذه الرسالة واردة من الصليب الأحمر.\n\nتلقيت هذا الأسبوع قسيمتك الأخيرة لأنك لم تُعد مدرجًا في قائمة {{namePartnerOrganization}}.\n\nهل لديك أي أسئلة متعلقة بذلك؟ راسلنا عبر الواتساب:\n\nhttps://wa.me/3197010286964\n\nأو اتصل بـ {{namePartnerOrganization}}.\n\nنتمنى لكم كل التوفيق،',
          fr: 'Ce message vous est envoyé par la Croix-Rouge.\n\nCette semaine, vous avez reçu votre dernier bon d’achat, car vous ne figurez plus sur la liste de {{namePartnerOrganization}}.\n\nAvez-vous des questions à ce sujet ? Envoyez-nous un message via WhatsApp :\n\nhttps://wa.me/3197010286964\n\nou contactez {{namePartnerOrganization}}.\n\nNous vous souhaitons une bonne continuation.',
        },
      },
      rejected: {
        isWhatsappTemplate: false,
        message: {
          en: 'This is a message from the Red Cross.\n\nUnfortunately, we have to reject your request for Albert Heijn vouchers. You have not been signed up for this help by one of our partner organizations.\n\nDo you have questions about this? Please contact us via WhatsApp:\n\nhttps://wa.me/3197010286964',
          es: 'Este es un mensaje de la Cruz Roja.\n\nLamentablemente, tenemos que rechazar tu solicitud de vales de Albert Heijn. No apareces inscrito para esta ayuda por ninguna de nuestras organizaciones asociadas.\n\n¿Tienes alguna pregunta al respecto? Ponte en contacto con nosotros a través de WhatsApp:\n\nhttps://wa.me/3197010286964',
          nl: 'Dit is een bericht van het Rode Kruis.\n\nHelaas moeten wij jouw aanvraag voor Albert Heijn waardebonnen afwijzen. Je bent niet voor deze hulp aangemeld door een van onze partnerorganisaties.\n\nHeb je hier vragen over? Neem dan contact met ons op via WhatsApp:\n\nhttps://wa.me/3197010286964',
          pt_BR:
            'Esta é uma mensagem da Cruz Vermelha.\n\nInfelizmente, tivemos que rejeitar o seu pedido de cupões do Albert Heijn. Não se inscreveu para receber esta ajuda de uma das nossas organizações parceiras.\n\nTem dúvidas sobre isto? Contacte-nos através do WhatsApp:\n\nhttps://wa.me/3197010286964',
          ar: 'هذه الرسالة واردة من الصليب الأحمر.\n\nيؤسفنا أن نرفض طلبك للحصول على قسائم ألبرت هيجن (Albert Heijn). لست مسجلاً لدى إحدى المنظمات الشريكة لنا للحصول على هذه المساعدات.\n\nهل لديك أي أسئلة متعلقة بذلك؟ يُرجى مراسلتنا عبر الواتساب:\n\nhttps://wa.me/3197010286964',
          fr: 'Ce message vous est envoyé par la Croix-Rouge.\n\nMalheureusement, nous ne pouvons pas accepter votre demande de bons d’achat Albert Heijn. Vous n’avez pas été inscrit pour cette aide par l’une de nos organisations partenaires.\n\nAvez-vous des questions à ce sujet ? Contactez-nous via WhatsApp:\n\nhttps://wa.me/3197010286964',
        },
      },
    };

    for (const program of relevantPrograms) {
      for (const type of Object.keys(newTemplates)) {
        for (const language of Object.keys(newTemplates[type].message)) {
          const template = {
            type,
            language,
            isWhatsappTemplate: newTemplates[type].isWhatsappTemplate,
            message: newTemplates[type].message[language],
            programId: program.id,
          };
          await messageTemplateRepository.save(template);
        }
      }
    }
  }
  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Nothing to do
  }
}
