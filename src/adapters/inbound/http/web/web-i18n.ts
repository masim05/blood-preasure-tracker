export interface PolicySection {
  heading: string;
  content: string;
}

export interface WebTranslations {
  lang: string;
  appName: string;
  tagline: string;
  footer: {
    home: string;
    policy: string;
  };
  home: {
    metaTitle: string;
    story: string[];
    googlePlay: string;
  };
  policy: {
    metaTitle: string;
    intro: string;
    sections: PolicySection[];
  };
}

const SUPPORTED_LANGS = ['en', 'es', 'fr', 'pt', 'it', 'sv', 'ru', 'zh', 'ko', 'ja', 'th', 'vi'] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

const translations: Record<SupportedLang, WebTranslations> = {
  en: {
    lang: 'en',
    appName: 'Blood Pressure',
    tagline: 'Track your readings easily',
    footer: { home: 'Home', policy: 'Privacy Policy' },
    home: {
      metaTitle: 'Blood Pressure – Track your readings easily',
      story: [
        'I started tracking my blood pressure regularly and quickly realized the most annoying part wasn\'t taking the measurements — it was typing the numbers from photos of my blood pressure monitor into a spreadsheet.',
        'Since modern AI is pretty good at reading text from images, I figured this could be automated. So I built a simple app that turns a photo of a blood pressure monitor into a measurement record in a few taps.',
        'After using it myself, I thought: maybe I\'m not the only one with this problem. That\'s why I decided to publish it on Google Play.',
      ],
      googlePlay: 'Get it on Google Play',
    },
    policy: {
      metaTitle: 'Privacy Policy – Blood Pressure',
      intro: 'Your privacy matters. This policy explains what data Blood Pressure collects, why, and how it is handled.',
      sections: [
        {
          heading: 'Data We Collect',
          content: 'We collect the following information when you use the app: your email address and password (hashed) used to create your account; photos of your blood pressure monitor that you submit for recognition; blood pressure values (systolic, diastolic, pulse, arm side) extracted from those photos or entered manually; and the date and time of each measurement.',
        },
        {
          heading: 'How We Use Your Data',
          content: 'Your data is used solely to provide the app\'s features: authenticating your account, storing your measurement history so you can review it, and processing photos to extract blood pressure readings automatically.',
        },
        {
          heading: 'Third-Party Services',
          content: 'To recognise blood pressure values from photos, images are sent to third-party AI APIs (such as OpenAI). Images are transmitted for recognition purposes only and are not stored or used for training by those third parties. We do not sell or share your personal data with any other third parties.',
        },
        {
          heading: 'Data Storage',
          content: 'Your data is stored on secure cloud servers. We apply industry-standard measures to protect it from unauthorised access.',
        },
        {
          heading: 'Deleting Your Account and Data',
          content: 'You can request deletion of your account and all associated data at any time by emailing support@bloodpressure.app. We will process your request within 30 days.',
        },
        {
          heading: 'Medical Disclaimer',
          content: 'This app is not a medical device and does not diagnose, treat, cure, or prevent any medical condition. Always consult a qualified healthcare professional regarding your blood pressure and any health concerns.',
        },
        {
          heading: 'Contact',
          content: 'For privacy-related questions, contact us at support@bloodpressure.app.',
        },
      ],
    },
  },

  es: {
    lang: 'es',
    appName: 'Blood Pressure',
    tagline: 'Controla tus mediciones fácilmente',
    footer: { home: 'Inicio', policy: 'Política de privacidad' },
    home: {
      metaTitle: 'Blood Pressure – Controla tus mediciones fácilmente',
      story: [
        'Empecé a controlar mi presión arterial con regularidad y pronto me di cuenta de que la parte más molesta no era tomar las mediciones, sino escribir los números de las fotos de mi tensiómetro en una hoja de cálculo.',
        'Como la IA moderna es bastante buena leyendo texto en imágenes, pensé que esto podía automatizarse. Así que creé una sencilla aplicación que convierte una foto de un tensiómetro en un registro de medición con unos pocos toques.',
        'Tras usarla yo mismo, pensé: quizás no soy el único con este problema. Por eso decidí publicarla en Google Play.',
      ],
      googlePlay: 'Disponible en Google Play',
    },
    policy: {
      metaTitle: 'Política de privacidad – Blood Pressure',
      intro: 'Tu privacidad es importante. Esta política explica qué datos recopila Blood Pressure, por qué y cómo se gestionan.',
      sections: [
        {
          heading: 'Datos que recopilamos',
          content: 'Recopilamos la siguiente información cuando usas la aplicación: tu dirección de correo electrónico y contraseña (cifrada) para crear tu cuenta; fotos de tu tensiómetro que envías para reconocimiento; valores de presión arterial (sistólica, diastólica, pulso, lado del brazo) extraídos de esas fotos o introducidos manualmente; y la fecha y hora de cada medición.',
        },
        {
          heading: 'Cómo usamos tus datos',
          content: 'Tus datos se utilizan únicamente para ofrecer las funciones de la aplicación: autenticar tu cuenta, almacenar tu historial de mediciones para que puedas revisarlo y procesar fotos para extraer automáticamente los valores de presión arterial.',
        },
        {
          heading: 'Servicios de terceros',
          content: 'Para reconocer los valores de presión arterial en las fotos, las imágenes se envían a APIs de IA de terceros (como OpenAI). Las imágenes se transmiten únicamente con fines de reconocimiento y esos terceros no las almacenan ni las usan para entrenamiento. No vendemos ni compartimos tus datos personales con otros terceros.',
        },
        {
          heading: 'Almacenamiento de datos',
          content: 'Tus datos se almacenan en servidores cloud seguros. Aplicamos medidas estándar del sector para protegerlos del acceso no autorizado.',
        },
        {
          heading: 'Eliminar tu cuenta y datos',
          content: 'Puedes solicitar la eliminación de tu cuenta y todos los datos asociados en cualquier momento enviando un correo a support@bloodpressure.app. Procesaremos tu solicitud en un plazo de 30 días.',
        },
        {
          heading: 'Aviso médico',
          content: 'Esta aplicación no es un dispositivo médico y no diagnostica, trata, cura ni previene ninguna condición médica. Consulta siempre a un profesional de la salud cualificado sobre tu presión arterial y cualquier problema de salud.',
        },
        {
          heading: 'Contacto',
          content: 'Para consultas relacionadas con la privacidad, contáctanos en support@bloodpressure.app.',
        },
      ],
    },
  },

  fr: {
    lang: 'fr',
    appName: 'Blood Pressure',
    tagline: 'Suivez vos mesures facilement',
    footer: { home: 'Accueil', policy: 'Politique de confidentialité' },
    home: {
      metaTitle: 'Blood Pressure – Suivez vos mesures facilement',
      story: [
        'J\'ai commencé à surveiller ma tension artérielle régulièrement et j\'ai vite réalisé que la partie la plus fastidieuse n\'était pas de prendre les mesures, mais de retaper les chiffres des photos de mon tensiomètre dans un tableur.',
        'Comme l\'IA moderne est plutôt efficace pour lire du texte dans des images, j\'ai pensé que cela pouvait être automatisé. J\'ai donc créé une application simple qui transforme la photo d\'un tensiomètre en un enregistrement de mesure en quelques gestes.',
        'Après l\'avoir utilisée moi-même, je me suis dit : peut-être que je ne suis pas le seul avec ce problème. C\'est pourquoi j\'ai décidé de la publier sur Google Play.',
      ],
      googlePlay: 'Disponible sur Google Play',
    },
    policy: {
      metaTitle: 'Politique de confidentialité – Blood Pressure',
      intro: 'Votre vie privée est importante. Cette politique explique quelles données Blood Pressure collecte, pourquoi et comment elles sont traitées.',
      sections: [
        {
          heading: 'Données que nous collectons',
          content: 'Nous collectons les informations suivantes lors de l\'utilisation de l\'application : votre adresse e-mail et mot de passe (haché) pour créer votre compte ; les photos de votre tensiomètre que vous soumettez pour reconnaissance ; les valeurs de tension artérielle (systolique, diastolique, pouls, côté du bras) extraites de ces photos ou saisies manuellement ; ainsi que la date et l\'heure de chaque mesure.',
        },
        {
          heading: 'Utilisation de vos données',
          content: 'Vos données sont utilisées uniquement pour fournir les fonctionnalités de l\'application : authentifier votre compte, stocker votre historique de mesures pour vous permettre de le consulter, et traiter les photos pour extraire automatiquement les valeurs de tension artérielle.',
        },
        {
          heading: 'Services tiers',
          content: 'Pour reconnaître les valeurs de tension artérielle dans les photos, les images sont envoyées à des API d\'IA tierces (comme OpenAI). Les images sont transmises uniquement à des fins de reconnaissance et ne sont ni stockées ni utilisées à des fins d\'entraînement par ces tiers. Nous ne vendons ni ne partageons vos données personnelles avec d\'autres tiers.',
        },
        {
          heading: 'Stockage des données',
          content: 'Vos données sont stockées sur des serveurs cloud sécurisés. Nous appliquons des mesures conformes aux normes du secteur pour les protéger contre tout accès non autorisé.',
        },
        {
          heading: 'Suppression de votre compte et de vos données',
          content: 'Vous pouvez demander la suppression de votre compte et de toutes les données associées à tout moment en écrivant à support@bloodpressure.app. Nous traiterons votre demande dans un délai de 30 jours.',
        },
        {
          heading: 'Avertissement médical',
          content: 'Cette application n\'est pas un dispositif médical et ne diagnostique, ne traite, ne guérit ni ne prévient aucune condition médicale. Consultez toujours un professionnel de santé qualifié concernant votre tension artérielle et tout problème de santé.',
        },
        {
          heading: 'Contact',
          content: 'Pour toute question relative à la confidentialité, contactez-nous à support@bloodpressure.app.',
        },
      ],
    },
  },

  pt: {
    lang: 'pt',
    appName: 'Blood Pressure',
    tagline: 'Acompanhe suas leituras facilmente',
    footer: { home: 'Início', policy: 'Política de privacidade' },
    home: {
      metaTitle: 'Blood Pressure – Acompanhe suas leituras facilmente',
      story: [
        'Comecei a monitorar minha pressão arterial regularmente e percebi rapidamente que a parte mais irritante não era fazer as medições — era digitar os números das fotos do meu medidor de pressão numa planilha.',
        'Como a IA moderna é bastante boa em ler texto de imagens, achei que isso poderia ser automatizado. Então criei um aplicativo simples que transforma uma foto de um monitor de pressão arterial em um registro de medição com alguns toques.',
        'Depois de usar por conta própria, pensei: talvez eu não seja o único com esse problema. Por isso decidi publicar no Google Play.',
      ],
      googlePlay: 'Disponível no Google Play',
    },
    policy: {
      metaTitle: 'Política de privacidade – Blood Pressure',
      intro: 'Sua privacidade é importante. Esta política explica quais dados o Blood Pressure coleta, por quê e como são tratados.',
      sections: [
        {
          heading: 'Dados que coletamos',
          content: 'Coletamos as seguintes informações ao usar o aplicativo: seu endereço de e-mail e senha (com hash) para criar sua conta; fotos do seu monitor de pressão arterial enviadas para reconhecimento; valores de pressão arterial (sistólica, diastólica, pulso, lado do braço) extraídos dessas fotos ou inseridos manualmente; e a data e hora de cada medição.',
        },
        {
          heading: 'Como usamos seus dados',
          content: 'Seus dados são usados exclusivamente para fornecer os recursos do aplicativo: autenticar sua conta, armazenar seu histórico de medições para revisão e processar fotos para extrair automaticamente os valores de pressão arterial.',
        },
        {
          heading: 'Serviços de terceiros',
          content: 'Para reconhecer valores de pressão arterial em fotos, as imagens são enviadas a APIs de IA de terceiros (como OpenAI). As imagens são transmitidas apenas para fins de reconhecimento e não são armazenadas ou usadas para treinamento por esses terceiros. Não vendemos nem compartilhamos seus dados pessoais com outros terceiros.',
        },
        {
          heading: 'Armazenamento de dados',
          content: 'Seus dados são armazenados em servidores cloud seguros. Aplicamos medidas padrão do setor para protegê-los contra acesso não autorizado.',
        },
        {
          heading: 'Excluir sua conta e dados',
          content: 'Você pode solicitar a exclusão de sua conta e de todos os dados associados a qualquer momento enviando um e-mail para support@bloodpressure.app. Processaremos sua solicitação em até 30 dias.',
        },
        {
          heading: 'Aviso médico',
          content: 'Este aplicativo não é um dispositivo médico e não diagnostica, trata, cura ou previne nenhuma condição médica. Consulte sempre um profissional de saúde qualificado sobre sua pressão arterial e quaisquer preocupações de saúde.',
        },
        {
          heading: 'Contato',
          content: 'Para dúvidas relacionadas à privacidade, entre em contato pelo e-mail support@bloodpressure.app.',
        },
      ],
    },
  },

  it: {
    lang: 'it',
    appName: 'Blood Pressure',
    tagline: 'Tieni traccia delle tue misurazioni facilmente',
    footer: { home: 'Home', policy: 'Informativa sulla privacy' },
    home: {
      metaTitle: 'Blood Pressure – Tieni traccia delle tue misurazioni facilmente',
      story: [
        'Ho iniziato a monitorare regolarmente la mia pressione sanguigna e ho capito subito che la parte più fastidiosa non era effettuare le misurazioni, ma trascrivere i numeri dalle foto del mio sfigmomanometro in un foglio di calcolo.',
        'Poiché la moderna IA è piuttosto brava a leggere il testo nelle immagini, ho pensato che questo potesse essere automatizzato. Ho quindi creato una semplice app che trasforma la foto di un misuratore di pressione in un record di misurazione in pochi tocchi.',
        'Dopo averla usata io stesso, ho pensato: forse non sono l\'unico ad avere questo problema. Per questo ho deciso di pubblicarla su Google Play.',
      ],
      googlePlay: 'Disponibile su Google Play',
    },
    policy: {
      metaTitle: 'Informativa sulla privacy – Blood Pressure',
      intro: 'La tua privacy è importante. Questa informativa spiega quali dati raccoglie Blood Pressure, perché e come vengono gestiti.',
      sections: [
        {
          heading: 'Dati che raccogliamo',
          content: 'Raccogliamo le seguenti informazioni quando usi l\'app: il tuo indirizzo e-mail e la password (con hash) per creare il tuo account; le foto del tuo misuratore di pressione inviate per il riconoscimento; i valori della pressione sanguigna (sistolica, diastolica, polso, lato del braccio) estratti da quelle foto o inseriti manualmente; e la data e l\'ora di ogni misurazione.',
        },
        {
          heading: 'Come utilizziamo i tuoi dati',
          content: 'I tuoi dati vengono utilizzati esclusivamente per fornire le funzionalità dell\'app: autenticare il tuo account, archiviare la cronologia delle misurazioni per consentirti di consultarla e elaborare le foto per estrarre automaticamente i valori della pressione sanguigna.',
        },
        {
          heading: 'Servizi di terze parti',
          content: 'Per riconoscere i valori della pressione sanguigna nelle foto, le immagini vengono inviate ad API AI di terze parti (come OpenAI). Le immagini vengono trasmesse esclusivamente per il riconoscimento e non vengono archiviate o utilizzate per l\'addestramento da tali terze parti. Non vendiamo né condividiamo i tuoi dati personali con altre terze parti.',
        },
        {
          heading: 'Archiviazione dei dati',
          content: 'I tuoi dati sono archiviati su server cloud sicuri. Applichiamo misure standard del settore per proteggerli da accessi non autorizzati.',
        },
        {
          heading: 'Eliminazione del tuo account e dei tuoi dati',
          content: 'Puoi richiedere la cancellazione del tuo account e di tutti i dati associati in qualsiasi momento inviando una e-mail a support@bloodpressure.app. Elaboreremo la tua richiesta entro 30 giorni.',
        },
        {
          heading: 'Dichiarazione medica',
          content: 'Questa app non è un dispositivo medico e non diagnostica, tratta, cura né previene alcuna condizione medica. Consulta sempre un medico qualificato riguardo alla tua pressione sanguigna e a qualsiasi preoccupazione di salute.',
        },
        {
          heading: 'Contatti',
          content: 'Per domande relative alla privacy, contattaci all\'indirizzo support@bloodpressure.app.',
        },
      ],
    },
  },

  sv: {
    lang: 'sv',
    appName: 'Blood Pressure',
    tagline: 'Håll koll på dina mätningar enkelt',
    footer: { home: 'Hem', policy: 'Integritetspolicy' },
    home: {
      metaTitle: 'Blood Pressure – Håll koll på dina mätningar enkelt',
      story: [
        'Jag började mäta mitt blodtryck regelbundet och insåg snabbt att det jobbigaste inte var att ta mätningarna – det var att knappa in siffrorna från foton på min blodtrycksapparat i ett kalkylblad.',
        'Eftersom modern AI är ganska bra på att läsa text från bilder tänkte jag att det här skulle kunna automatiseras. Så jag byggde en enkel app som omvandlar ett foto av en blodtrycksapparat till ett mätrekord med några tryckningar.',
        'Efter att ha använt den själv tänkte jag: kanske är jag inte den enda med det här problemet. Det är därför jag bestämde mig för att publicera den på Google Play.',
      ],
      googlePlay: 'Hämta på Google Play',
    },
    policy: {
      metaTitle: 'Integritetspolicy – Blood Pressure',
      intro: 'Din integritet är viktig. Denna policy förklarar vilka uppgifter Blood Pressure samlar in, varför och hur de hanteras.',
      sections: [
        {
          heading: 'Uppgifter vi samlar in',
          content: 'Vi samlar in följande information när du använder appen: din e-postadress och ditt lösenord (hashat) för att skapa ditt konto; foton av din blodtrycksapparat som du skickar in för igenkänning; blodtrycksvärden (systoliskt, diastoliskt, puls, armens sida) extraherade från dessa foton eller angivna manuellt; samt datum och tid för varje mätning.',
        },
        {
          heading: 'Hur vi använder dina uppgifter',
          content: 'Dina uppgifter används enbart för att tillhandahålla appens funktioner: autentisera ditt konto, lagra din mäthistorik så att du kan granska den och bearbeta foton för att automatiskt extrahera blodtrycksvärden.',
        },
        {
          heading: 'Tjänster från tredje part',
          content: 'För att känna igen blodtrycksvärden från foton skickas bilder till AI-API:er från tredje part (t.ex. OpenAI). Bilder överförs enbart i igenkänningssyfte och lagras eller används inte för träning av dessa tredje parter. Vi säljer eller delar inte dina personuppgifter med andra tredje parter.',
        },
        {
          heading: 'Datalagring',
          content: 'Dina uppgifter lagras på säkra molnservrar. Vi tillämpar branschstandardiserade åtgärder för att skydda dem mot obehörig åtkomst.',
        },
        {
          heading: 'Ta bort ditt konto och dina uppgifter',
          content: 'Du kan begära radering av ditt konto och alla tillhörande uppgifter när som helst genom att skicka e-post till support@bloodpressure.app. Vi behandlar din begäran inom 30 dagar.',
        },
        {
          heading: 'Medicinsk ansvarsfriskrivning',
          content: 'Denna app är inte en medicinsk enhet och diagnostiserar, behandlar, botar eller förebygger inte några medicinska tillstånd. Rådfråga alltid en kvalificerad sjukvårdspersonal angående ditt blodtryck och eventuella hälsoproblem.',
        },
        {
          heading: 'Kontakt',
          content: 'För integritetsrelaterade frågor, kontakta oss på support@bloodpressure.app.',
        },
      ],
    },
  },

  ru: {
    lang: 'ru',
    appName: 'Blood Pressure',
    tagline: 'Отслеживайте показания с лёгкостью',
    footer: { home: 'Главная', policy: 'Политика конфиденциальности' },
    home: {
      metaTitle: 'Blood Pressure – Отслеживайте показания с лёгкостью',
      story: [
        'Я начал регулярно измерять давление и быстро понял: самое раздражающее — не само измерение, а то, что нужно вручную вводить цифры с фотографий тонометра в таблицу.',
        'Современный ИИ хорошо распознаёт текст на изображениях, поэтому я решил автоматизировать этот процесс. Так появилось простое приложение, которое за несколько нажатий превращает фото тонометра в запись измерения.',
        'Попользовавшись им сам, я подумал: наверное, я не единственный с такой проблемой. Именно поэтому я решил опубликовать приложение в Google Play.',
      ],
      googlePlay: 'Скачать в Google Play',
    },
    policy: {
      metaTitle: 'Политика конфиденциальности – Blood Pressure',
      intro: 'Ваша конфиденциальность важна для нас. В этой политике описано, какие данные собирает Blood Pressure, для чего и как они используются.',
      sections: [
        {
          heading: 'Какие данные мы собираем',
          content: 'При использовании приложения мы собираем следующие данные: ваш адрес электронной почты и хэш пароля для создания аккаунта; фотографии тонометра, которые вы отправляете для распознавания; значения артериального давления (систолическое, диастолическое, пульс, рука) — извлечённые с фотографий или введённые вручную; а также дату и время каждого измерения.',
        },
        {
          heading: 'Как мы используем ваши данные',
          content: 'Ваши данные используются исключительно для работы приложения: для аутентификации вашего аккаунта, хранения истории измерений и автоматического извлечения значений давления из фотографий.',
        },
        {
          heading: 'Сторонние сервисы',
          content: 'Для распознавания значений давления на фотографиях изображения передаются сторонним API на основе ИИ (например, OpenAI). Изображения передаются исключительно для целей распознавания и не сохраняются и не используются для обучения моделей этими сторонними сервисами. Мы не продаём и не передаём ваши персональные данные третьим лицам.',
        },
        {
          heading: 'Хранение данных',
          content: 'Ваши данные хранятся на защищённых облачных серверах. Мы применяем отраслевые стандарты безопасности для защиты от несанкционированного доступа.',
        },
        {
          heading: 'Удаление аккаунта и данных',
          content: 'Вы можете в любое время запросить удаление аккаунта и всех связанных данных, написав на support@bloodpressure.app. Мы обработаем ваш запрос в течение 30 дней.',
        },
        {
          heading: 'Медицинское предупреждение',
          content: 'Это приложение не является медицинским устройством и не предназначено для диагностики, лечения или профилактики каких-либо заболеваний. По всем вопросам, связанным с артериальным давлением и состоянием здоровья, обращайтесь к квалифицированному медицинскому специалисту.',
        },
        {
          heading: 'Контакты',
          content: 'По вопросам конфиденциальности пишите на support@bloodpressure.app.',
        },
      ],
    },
  },

  zh: {
    lang: 'zh',
    appName: 'Blood Pressure',
    tagline: '轻松追踪您的血压读数',
    footer: { home: '首页', policy: '隐私政策' },
    home: {
      metaTitle: 'Blood Pressure – 轻松追踪您的血压读数',
      story: [
        '我开始定期测量血压，很快就发现最烦人的地方不是测量本身——而是要把血压计照片上的数字手动输入到电子表格中。',
        '现代 AI 非常擅长从图像中识别文字，于是我觉得这个过程可以自动化。我开发了一款简单的应用，只需几次点击，就能把血压计的照片转化为一条测量记录。',
        '自己用了一段时间后，我想：也许不止我一个人有这个困扰。于是我决定将这款应用发布到 Google Play。',
      ],
      googlePlay: '在 Google Play 上获取',
    },
    policy: {
      metaTitle: '隐私政策 – Blood Pressure',
      intro: '您的隐私非常重要。本政策说明 Blood Pressure 收集哪些数据、原因及处理方式。',
      sections: [
        {
          heading: '我们收集的数据',
          content: '使用本应用时，我们会收集以下信息：您的电子邮件地址和密码（哈希值）用于创建账户；您提交用于识别的血压计照片；从照片中提取或手动输入的血压值（收缩压、舒张压、脉搏、测量手臂）；以及每次测量的日期和时间。',
        },
        {
          heading: '我们如何使用您的数据',
          content: '您的数据仅用于提供应用功能：账户身份验证、存储测量历史记录供您查阅，以及处理照片以自动提取血压值。',
        },
        {
          heading: '第三方服务',
          content: '为了从照片中识别血压值，图像会被发送至第三方 AI API（如 OpenAI）。图像仅用于识别目的，第三方不会存储或用于模型训练。我们不会向任何其他第三方出售或共享您的个人数据。',
        },
        {
          heading: '数据存储',
          content: '您的数据存储在安全的云服务器上。我们采用行业标准措施防止未经授权的访问。',
        },
        {
          heading: '删除账户和数据',
          content: '您可以随时通过发送电子邮件至 support@bloodpressure.app 申请删除账户及所有相关数据。我们将在 30 天内处理您的申请。',
        },
        {
          heading: '医疗免责声明',
          content: '本应用不是医疗设备，不用于诊断、治疗、治愈或预防任何疾病。请就您的血压及任何健康问题咨询具有资质的医疗专业人员。',
        },
        {
          heading: '联系方式',
          content: '如有隐私相关问题，请发送邮件至 support@bloodpressure.app。',
        },
      ],
    },
  },

  ko: {
    lang: 'ko',
    appName: 'Blood Pressure',
    tagline: '혈압 수치를 손쉽게 기록하세요',
    footer: { home: '홈', policy: '개인정보 처리방침' },
    home: {
      metaTitle: 'Blood Pressure – 혈압 수치를 손쉽게 기록하세요',
      story: [
        '혈압을 정기적으로 측정하기 시작하면서 가장 번거로운 일이 측정 자체가 아니라는 걸 금방 깨달았습니다. 바로 혈압계 사진에서 숫자를 스프레드시트에 일일이 입력하는 일이었죠.',
        '요즘 AI는 이미지에서 텍스트를 꽤 잘 읽기 때문에 이 과정을 자동화할 수 있다고 생각했습니다. 그래서 혈압계 사진을 몇 번의 탭만으로 측정 기록으로 변환해 주는 간단한 앱을 만들었습니다.',
        '직접 사용해 보고 나서 이런 불편함을 겪는 사람이 저뿐만은 아닐 것이라고 생각했습니다. 그래서 Google Play에 앱을 출시하기로 결심했습니다.',
      ],
      googlePlay: 'Google Play에서 다운로드',
    },
    policy: {
      metaTitle: '개인정보 처리방침 – Blood Pressure',
      intro: '귀하의 개인정보는 중요합니다. 이 방침은 Blood Pressure가 어떤 데이터를 수집하고, 왜 수집하며, 어떻게 처리하는지를 설명합니다.',
      sections: [
        {
          heading: '수집하는 데이터',
          content: '앱 사용 시 다음 정보를 수집합니다: 계정 생성에 사용하는 이메일 주소 및 비밀번호(해시 처리됨); 인식을 위해 제출하는 혈압계 사진; 해당 사진에서 추출되거나 수동으로 입력된 혈압 수치(수축기, 이완기, 맥박, 팔 측); 각 측정의 날짜 및 시간.',
        },
        {
          heading: '데이터 사용 방법',
          content: '귀하의 데이터는 앱 기능 제공에만 사용됩니다: 계정 인증, 검토할 수 있도록 측정 기록 저장, 혈압 수치 자동 추출을 위한 사진 처리.',
        },
        {
          heading: '제3자 서비스',
          content: '사진에서 혈압 수치를 인식하기 위해 이미지는 제3자 AI API(예: OpenAI)로 전송됩니다. 이미지는 인식 목적으로만 전송되며, 해당 제3자가 저장하거나 학습에 사용하지 않습니다. 귀하의 개인 데이터는 다른 제3자에게 판매되거나 공유되지 않습니다.',
        },
        {
          heading: '데이터 저장',
          content: '귀하의 데이터는 안전한 클라우드 서버에 저장됩니다. 당사는 무단 접근으로부터 보호하기 위해 업계 표준 조치를 적용합니다.',
        },
        {
          heading: '계정 및 데이터 삭제',
          content: 'support@bloodpressure.app으로 이메일을 보내 언제든지 계정 및 모든 관련 데이터의 삭제를 요청할 수 있습니다. 요청은 30일 이내에 처리됩니다.',
        },
        {
          heading: '의료 면책 조항',
          content: '이 앱은 의료 기기가 아니며, 어떠한 질병도 진단, 치료, 치유 또는 예방하지 않습니다. 혈압 및 건강 문제에 관해서는 항상 자격을 갖춘 의료 전문가와 상담하십시오.',
        },
        {
          heading: '문의',
          content: '개인정보 관련 문의는 support@bloodpressure.app으로 연락하시기 바랍니다.',
        },
      ],
    },
  },

  ja: {
    lang: 'ja',
    appName: 'Blood Pressure',
    tagline: '血圧の記録を手軽に',
    footer: { home: 'ホーム', policy: 'プライバシーポリシー' },
    home: {
      metaTitle: 'Blood Pressure – 血圧の記録を手軽に',
      story: [
        '血圧を定期的に測り始めたとき、一番面倒だったのは測定そのものではなく、血圧計の写真から数値をスプレッドシートに手入力することだと気づきました。',
        '最近のAIは画像からテキストを読み取るのが得意なので、これを自動化できるはずだと考えました。そこで、血圧計の写真を数回タップするだけで測定記録に変換できるシンプルなアプリを作りました。',
        '自分で使ってみて思ったのは、この問題を抱えているのは自分だけではないかもしれないということです。だからこそ、Google Playに公開することにしました。',
      ],
      googlePlay: 'Google Playで入手',
    },
    policy: {
      metaTitle: 'プライバシーポリシー – Blood Pressure',
      intro: 'お客様のプライバシーは重要です。このポリシーでは、Blood Pressureが収集するデータ、その目的、および取り扱い方法について説明します。',
      sections: [
        {
          heading: '収集するデータ',
          content: 'アプリ使用時に以下の情報を収集します：アカウント作成に使用するメールアドレスおよびパスワード（ハッシュ化）、認識のために送信する血圧計の写真、それらの写真から抽出または手動入力された血圧値（収縮期・拡張期・脈拍・腕の左右）、各測定の日時。',
        },
        {
          heading: 'データの利用方法',
          content: 'お客様のデータは、アプリの機能提供にのみ使用されます：アカウント認証、測定履歴の保存と閲覧、写真からの血圧値の自動抽出。',
        },
        {
          heading: 'サードパーティサービス',
          content: '写真から血圧値を認識するために、画像はサードパーティのAI API（OpenAI等）に送信されます。画像は認識目的のみに送信され、それらのサードパーティによって保存または学習に使用されることはありません。お客様の個人データを他のサードパーティに販売・共有することはありません。',
        },
        {
          heading: 'データの保管',
          content: 'お客様のデータは安全なクラウドサーバーに保管されます。不正アクセスを防ぐために業界標準のセキュリティ対策を講じています。',
        },
        {
          heading: 'アカウントとデータの削除',
          content: 'support@bloodpressure.app にメールを送ることで、いつでもアカウントおよびすべての関連データの削除を依頼できます。リクエストは30日以内に処理されます。',
        },
        {
          heading: '医療上の免責事項',
          content: 'このアプリは医療機器ではなく、いかなる疾患の診断・治療・治癒・予防も行いません。血圧やその他の健康上の懸念については、必ず資格を持つ医療専門家にご相談ください。',
        },
        {
          heading: 'お問い合わせ',
          content: 'プライバシーに関するご質問は support@bloodpressure.app までご連絡ください。',
        },
      ],
    },
  },

  th: {
    lang: 'th',
    appName: 'Blood Pressure',
    tagline: 'ติดตามค่าความดันโลหิตของคุณได้อย่างง่ายดาย',
    footer: { home: 'หน้าหลัก', policy: 'นโยบายความเป็นส่วนตัว' },
    home: {
      metaTitle: 'Blood Pressure – ติดตามค่าความดันโลหิตของคุณได้อย่างง่ายดาย',
      story: [
        'ฉันเริ่มวัดความดันโลหิตเป็นประจำ และรู้สึกได้ทันทีว่าส่วนที่น่าหงุดหงิดที่สุดไม่ใช่การวัดเอง แต่คือการพิมพ์ตัวเลขจากรูปถ่ายเครื่องวัดความดันลงในสเปรดชีต',
        'เนื่องจาก AI ยุคใหม่อ่านข้อความจากรูปภาพได้ดีมาก ฉันจึงคิดว่าขั้นตอนนี้น่าจะทำให้อัตโนมัติได้ ฉันจึงสร้างแอปง่ายๆ ที่แปลงรูปถ่ายเครื่องวัดความดันโลหิตให้กลายเป็นบันทึกการวัดเพียงไม่กี่แตะ',
        'หลังจากใช้งานด้วยตัวเองแล้ว ฉันคิดว่าคงไม่ใช่คนเดียวที่มีปัญหานี้ นั่นจึงเป็นเหตุผลที่ฉันตัดสินใจเผยแพร่แอปนี้บน Google Play',
      ],
      googlePlay: 'ดาวน์โหลดบน Google Play',
    },
    policy: {
      metaTitle: 'นโยบายความเป็นส่วนตัว – Blood Pressure',
      intro: 'ความเป็นส่วนตัวของคุณมีความสำคัญ นโยบายนี้อธิบายว่า Blood Pressure เก็บรวบรวมข้อมูลใด เพราะเหตุใด และข้อมูลได้รับการจัดการอย่างไร',
      sections: [
        {
          heading: 'ข้อมูลที่เราเก็บรวบรวม',
          content: 'เราเก็บรวบรวมข้อมูลต่อไปนี้เมื่อคุณใช้แอป: อีเมลและรหัสผ่าน (แบบ hash) สำหรับสร้างบัญชี รูปถ่ายเครื่องวัดความดันโลหิตที่คุณส่งมาเพื่อการจดจำ ค่าความดันโลหิต (systolic, diastolic, ชีพจร, แขนข้าง) ที่ดึงมาจากรูปถ่ายหรือกรอกเอง และวันที่และเวลาของการวัดแต่ละครั้ง',
        },
        {
          heading: 'วิธีที่เราใช้ข้อมูลของคุณ',
          content: 'ข้อมูลของคุณใช้เฉพาะเพื่อให้บริการฟีเจอร์ของแอป: การยืนยันตัวตนในบัญชี การจัดเก็บประวัติการวัดเพื่อให้คุณทบทวน และการประมวลผลรูปถ่ายเพื่อดึงค่าความดันโลหิตอัตโนมัติ',
        },
        {
          heading: 'บริการของบุคคลที่สาม',
          content: 'เพื่อจดจำค่าความดันโลหิตจากรูปถ่าย รูปภาพจะถูกส่งไปยัง AI API ของบุคคลที่สาม (เช่น OpenAI) รูปภาพถูกส่งเพื่อวัตถุประสงค์การจดจำเท่านั้น ไม่ถูกเก็บหรือนำไปฝึกโมเดลโดยบุคคลที่สาม เราไม่ขายหรือแบ่งปันข้อมูลส่วนตัวของคุณกับบุคคลที่สามอื่น',
        },
        {
          heading: 'การจัดเก็บข้อมูล',
          content: 'ข้อมูลของคุณถูกเก็บบนเซิร์ฟเวอร์คลาวด์ที่ปลอดภัย เราใช้มาตรการมาตรฐานอุตสาหกรรมเพื่อปกป้องข้อมูลจากการเข้าถึงโดยไม่ได้รับอนุญาต',
        },
        {
          heading: 'การลบบัญชีและข้อมูลของคุณ',
          content: 'คุณสามารถขอลบบัญชีและข้อมูลที่เกี่ยวข้องทั้งหมดได้ตลอดเวลาโดยส่งอีเมลมาที่ support@bloodpressure.app เราจะดำเนินการตามคำขอภายใน 30 วัน',
        },
        {
          heading: 'ข้อจำกัดความรับผิดชอบทางการแพทย์',
          content: 'แอปนี้ไม่ใช่อุปกรณ์ทางการแพทย์ และไม่ได้วินิจฉัย รักษา บำบัด หรือป้องกันภาวะทางการแพทย์ใดๆ โปรดปรึกษาผู้เชี่ยวชาญด้านสุขภาพที่มีคุณสมบัติเกี่ยวกับความดันโลหิตและข้อกังวลด้านสุขภาพเสมอ',
        },
        {
          heading: 'ติดต่อเรา',
          content: 'สำหรับคำถามเกี่ยวกับความเป็นส่วนตัว ติดต่อเราได้ที่ support@bloodpressure.app',
        },
      ],
    },
  },

  vi: {
    lang: 'vi',
    appName: 'Blood Pressure',
    tagline: 'Theo dõi chỉ số huyết áp dễ dàng',
    footer: { home: 'Trang chủ', policy: 'Chính sách quyền riêng tư' },
    home: {
      metaTitle: 'Blood Pressure – Theo dõi chỉ số huyết áp dễ dàng',
      story: [
        'Tôi bắt đầu đo huyết áp thường xuyên và nhanh chóng nhận ra phần phiền toái nhất không phải là đo đạc — mà là phải gõ tay các con số từ ảnh chụp máy đo huyết áp vào bảng tính.',
        'Vì AI hiện đại khá giỏi trong việc đọc văn bản từ hình ảnh, tôi nghĩ việc này có thể tự động hóa được. Vì vậy, tôi đã xây dựng một ứng dụng đơn giản chuyển đổi ảnh chụp máy đo huyết áp thành bản ghi đo lường chỉ bằng vài thao tác chạm.',
        'Sau khi tự dùng thử, tôi nghĩ: có lẽ không chỉ mình tôi có vấn đề này. Đó là lý do tôi quyết định đăng ứng dụng lên Google Play.',
      ],
      googlePlay: 'Tải trên Google Play',
    },
    policy: {
      metaTitle: 'Chính sách quyền riêng tư – Blood Pressure',
      intro: 'Quyền riêng tư của bạn rất quan trọng. Chính sách này giải thích Blood Pressure thu thập dữ liệu gì, tại sao và cách xử lý dữ liệu đó.',
      sections: [
        {
          heading: 'Dữ liệu chúng tôi thu thập',
          content: 'Chúng tôi thu thập các thông tin sau khi bạn sử dụng ứng dụng: địa chỉ email và mật khẩu (đã mã hóa) để tạo tài khoản; ảnh máy đo huyết áp bạn gửi để nhận dạng; các chỉ số huyết áp (tâm thu, tâm trương, mạch, cánh tay đo) được trích xuất từ ảnh hoặc nhập thủ công; và ngày giờ của từng lần đo.',
        },
        {
          heading: 'Cách chúng tôi sử dụng dữ liệu của bạn',
          content: 'Dữ liệu của bạn chỉ được dùng để cung cấp các tính năng của ứng dụng: xác thực tài khoản, lưu trữ lịch sử đo để bạn xem lại, và xử lý ảnh để tự động trích xuất chỉ số huyết áp.',
        },
        {
          heading: 'Dịch vụ bên thứ ba',
          content: 'Để nhận dạng chỉ số huyết áp từ ảnh, hình ảnh được gửi đến các API AI của bên thứ ba (như OpenAI). Hình ảnh chỉ được truyền cho mục đích nhận dạng và không được bên thứ ba lưu trữ hay dùng để huấn luyện mô hình. Chúng tôi không bán hoặc chia sẻ dữ liệu cá nhân của bạn với bên thứ ba khác.',
        },
        {
          heading: 'Lưu trữ dữ liệu',
          content: 'Dữ liệu của bạn được lưu trữ trên các máy chủ đám mây an toàn. Chúng tôi áp dụng các biện pháp bảo mật chuẩn ngành để bảo vệ dữ liệu khỏi truy cập trái phép.',
        },
        {
          heading: 'Xóa tài khoản và dữ liệu',
          content: 'Bạn có thể yêu cầu xóa tài khoản và toàn bộ dữ liệu liên quan bất kỳ lúc nào bằng cách gửi email đến support@bloodpressure.app. Chúng tôi sẽ xử lý yêu cầu của bạn trong vòng 30 ngày.',
        },
        {
          heading: 'Tuyên bố miễn trách nhiệm y tế',
          content: 'Ứng dụng này không phải là thiết bị y tế và không chẩn đoán, điều trị, chữa khỏi hay phòng ngừa bất kỳ tình trạng y tế nào. Hãy luôn tham khảo ý kiến chuyên gia y tế có chuyên môn về huyết áp và các vấn đề sức khỏe của bạn.',
        },
        {
          heading: 'Liên hệ',
          content: 'Với các câu hỏi liên quan đến quyền riêng tư, vui lòng liên hệ với chúng tôi tại support@bloodpressure.app.',
        },
      ],
    },
  },
};

export function resolveTranslations(acceptLanguage: string | undefined): WebTranslations {
  if (!acceptLanguage) return translations.en;

  const candidates = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag] = part.trim().split(';');
      return tag.trim().toLowerCase();
    })
    .filter(Boolean);

  for (const candidate of candidates) {
    const lang = candidate.split('-')[0];
    if (lang && lang in translations) {
      return translations[lang as SupportedLang];
    }
  }

  return translations.en;
}
