// Privacy policy, terms and account-deletion info, shown at /privacy, /terms and /delete-account.
// These pages are public (Google Play links to them) and match what the app actually does with data.
export const CONTACT_EMAIL = 'mitchell.scholte04@gmail.com'
export const UPDATED = '2026-10-12'

const en = {
  privacy: {
    title: 'Privacy Policy',
    intro: 'WasteLess helps you keep track of the food you have so less of it gets thrown away. This policy explains what we store, why, who else is involved and what you can do about it. WasteLess is run by Mitchell Scholte in the Netherlands, who is responsible for your data under the GDPR.',
    sections: [
      { h: 'What we store', p: [
        'Your account: name, email address and password. The password is stored only as a secure hash; we cannot read it.',
        'Your pantry: the items you add (name, category, quantity, unit, expiry date, storage place, price, notes, barcode, product image link and nutrition values), when you opened them, and a history of what you added, used, froze or threw away. This history powers the Impact and Goals screens.',
        'Your household: which household you belong to, so members see the same pantry and activity.',
        'Your settings: reminder timing, diet preferences, units, monthly goal and whether you have WasteLess Plus.',
      ] },
      { h: 'What stays on your device', p: [
        'Receipt photos are read on your device and are never uploaded. To do this the app downloads a text-recognition engine and language files from a public download server (jsDelivr).',
        'Barcode scanning in the app uses Google’s on-device scanner (ML Kit). The camera image is processed on your phone.',
        'Reminders are scheduled on your device. Your language and theme are stored on your device.',
      ] },
      { h: 'Services we use', p: [
        'Hosting: our server and database run with cloud providers (Render and our database host). They store the data above on our behalf.',
        'Purchases: WasteLess Plus is sold through Google Play and the App Store. RevenueCat processes the purchase on our behalf and tells us whether your subscription is active; it knows your account ID, not your name or email. We never see your payment details.',
        'Product information: when you scan a barcode, the barcode number is looked up at Open Food Facts.',
        'Recipes: to suggest recipes, the names of your expiring ingredients are sent to TheMealDB. Recipe photos load from TheMealDB, and recipe videos play from YouTube (privacy-enhanced mode) only when you open a recipe that has one.',
      ] },
      { h: 'What we don’t do', p: [
        'No advertising, no analytics or tracking tools, and we never sell or share your data for marketing.',
      ] },
      { h: 'Why we use your data', p: [
        'To provide the app you signed up for (performance of a contract): your account, pantry, household, reminders and, if you subscribe, Plus. We keep your data only as long as you have an account.',
      ] },
      { h: 'Deleting your data', p: [
        'You can delete your account at any time in the app under Settings → Delete account. This immediately removes your account, your items, your history and your settings. If you were the only member of a household, the household is removed too; otherwise it passes to another member.',
        'Deleting your account does not cancel a store subscription. Cancel it in Google Play or the App Store.',
        `You can also ask us by email to delete your account: ${CONTACT_EMAIL}.`,
      ] },
      { h: 'Your rights', p: [
        `You can ask for a copy of your data, have it corrected or deleted, or object to how we use it, by emailing ${CONTACT_EMAIL}. You can also complain to the Dutch Data Protection Authority (Autoriteit Persoonsgegevens).`,
      ] },
      { h: 'Children', p: ['WasteLess is not meant for children under 16 and we don’t knowingly collect their data.'] },
      { h: 'Changes', p: ['If we change this policy, we update the date at the top and tell you in the app when the change matters.'] },
    ],
  },
  terms: {
    title: 'Terms of Use',
    intro: 'These terms apply to the WasteLess app and website. By creating an account you agree to them.',
    sections: [
      { h: 'Using WasteLess', p: [
        'You need an account to use WasteLess. Keep your password to yourself; you are responsible for what happens in your account.',
        'Don’t misuse the service: no attempts to break it, access other people’s data or use it for anything illegal.',
      ] },
      { h: 'Food safety', p: [
        'Expiry dates, freshness, reminders and recipes in WasteLess are based on what you enter and on general estimates. They are not food safety advice. Always check food yourself before eating it, and follow the label.',
      ] },
      { h: 'WasteLess Plus', p: [
        'WasteLess Plus is an auto-renewing subscription (monthly or yearly), sold through Google Play or the App Store. The price is shown before you buy.',
        'A free trial, if offered, turns into a paid subscription unless you cancel at least 24 hours before it ends.',
        'Your subscription renews automatically until you cancel it in your Google Play or App Store account settings. Cancelling stops future renewals; you keep Plus until the end of the paid period.',
        'Payments and refunds are handled by Google or Apple under their rules. Plus is shared with the members of your household while your subscription is active.',
      ] },
      { h: 'Your content', p: ['What you add to WasteLess stays yours. We only use it to run the app for you and your household.'] },
      { h: 'Availability and liability', p: [
        'We do our best to keep WasteLess working, but we can’t promise it will always be available or error-free. As far as the law allows, we are not liable for indirect damage, such as food that goes off or purchases you make based on the app.',
      ] },
      { h: 'Ending your account', p: [
        'You can delete your account at any time in Settings. We may suspend accounts that break these terms.',
      ] },
      { h: 'Changes and law', p: [
        'We may update these terms; we’ll tell you in the app about important changes. Dutch law applies.',
        `Questions: ${CONTACT_EMAIL}.`,
      ] },
    ],
  },
  deleteAccount: {
    title: 'Delete your WasteLess account',
    intro: 'You can delete your account and all its data yourself, in the app.',
    sections: [
      { h: 'In the app', p: [
        'Open WasteLess, tap the settings button at the top right, scroll down and tap Delete account, then confirm.',
      ] },
      { h: 'What is deleted', p: [
        'Your account (name, email, password), all items you added, your history of used, frozen and thrown-away food, and your settings. This happens immediately and can’t be undone.',
        'If you share a household, the household stays for the other members, and the items they added stay too.',
        'A WasteLess Plus subscription is billed by Google Play or the App Store and is not cancelled automatically. Cancel it in your store account settings.',
      ] },
      { h: 'Can’t use the app?', p: [
        `Email ${CONTACT_EMAIL} from the email address of your account and ask us to delete it. We delete it within 30 days and confirm by email.`,
      ] },
    ],
  },
}

const nl = {
  privacy: {
    title: 'Privacybeleid',
    intro: 'WasteLess helpt je bijhouden welk eten je in huis hebt, zodat er minder wordt weggegooid. Dit beleid legt uit wat we opslaan, waarom, wie er nog meer bij betrokken is en wat jij ermee kunt. WasteLess wordt gerund door Mitchell Scholte in Nederland, die volgens de AVG verantwoordelijk is voor je gegevens.',
    sections: [
      { h: 'Wat we opslaan', p: [
        'Je account: naam, e-mailadres en wachtwoord. Het wachtwoord bewaren we alleen als veilige hash; we kunnen het niet lezen.',
        'Je voorraad: de items die je toevoegt (naam, categorie, hoeveelheid, eenheid, houdbaarheidsdatum, bewaarplek, prijs, notities, barcode, link naar productfoto en voedingswaarden), wanneer je ze opende, en een geschiedenis van wat je toevoegde, opmaakte, invroor of weggooide. Die geschiedenis gebruiken de schermen Impact en Doelen.',
        'Je huishouden: bij welk huishouden je hoort, zodat leden dezelfde voorraad en activiteit zien.',
        'Je instellingen: wanneer je herinneringen krijgt, dieetvoorkeuren, eenheden, maanddoel en of je WasteLess Plus hebt.',
      ] },
      { h: 'Wat op je toestel blijft', p: [
        'Foto’s van kassabonnen worden op je toestel gelezen en nooit geüpload. Daarvoor downloadt de app een tekstherkenningsprogramma en taalbestanden van een openbare downloadserver (jsDelivr).',
        'Barcodes scannen in de app gebeurt met de scanner van Google op je toestel (ML Kit). Het camerabeeld wordt op je telefoon verwerkt.',
        'Herinneringen worden op je toestel ingepland. Je taal en thema worden op je toestel bewaard.',
      ] },
      { h: 'Diensten die we gebruiken', p: [
        'Hosting: onze server en database draaien bij cloudproviders (Render en onze databaseprovider). Zij bewaren bovenstaande gegevens namens ons.',
        'Aankopen: WasteLess Plus wordt verkocht via Google Play en de App Store. RevenueCat verwerkt de aankoop namens ons en laat ons weten of je abonnement actief is; het kent je account-ID, niet je naam of e-mailadres. Je betaalgegevens zien wij nooit.',
        'Productinformatie: als je een barcode scant, zoeken we het barcodenummer op bij Open Food Facts.',
        'Recepten: om recepten voor te stellen sturen we de namen van je bijna verlopen ingrediënten naar TheMealDB. Receptfoto’s komen van TheMealDB, en receptvideo’s spelen via YouTube (privacyvriendelijke modus), alleen als je een recept met video opent.',
      ] },
      { h: 'Wat we niet doen', p: [
        'Geen advertenties, geen analyse- of trackingtools, en we verkopen of delen je gegevens nooit voor marketing.',
      ] },
      { h: 'Waarom we je gegevens gebruiken', p: [
        'Om de app te leveren waarvoor je je aanmeldde (uitvoering van een overeenkomst): je account, voorraad, huishouden, herinneringen en, als je een abonnement neemt, Plus. We bewaren je gegevens alleen zolang je een account hebt.',
      ] },
      { h: 'Je gegevens verwijderen', p: [
        'Je kunt je account altijd verwijderen in de app via Instellingen → Account verwijderen. Daarmee verdwijnen direct je account, je items, je geschiedenis en je instellingen. Was je het enige lid van een huishouden, dan wordt het huishouden ook verwijderd; anders gaat het over naar een ander lid.',
        'Je account verwijderen zegt een store-abonnement niet op. Zeg het op in Google Play of de App Store.',
        `Je kunt ons ook per e-mail vragen je account te verwijderen: ${CONTACT_EMAIL}.`,
      ] },
      { h: 'Je rechten', p: [
        `Je kunt een kopie van je gegevens opvragen, ze laten corrigeren of verwijderen, of bezwaar maken tegen het gebruik, door te mailen naar ${CONTACT_EMAIL}. Je kunt ook een klacht indienen bij de Autoriteit Persoonsgegevens.`,
      ] },
      { h: 'Kinderen', p: ['WasteLess is niet bedoeld voor kinderen onder de 16 en we verzamelen bewust geen gegevens van hen.'] },
      { h: 'Wijzigingen', p: ['Als we dit beleid aanpassen, passen we de datum bovenaan aan en laten we het je in de app weten als de wijziging ertoe doet.'] },
    ],
  },
  terms: {
    title: 'Gebruiksvoorwaarden',
    intro: 'Deze voorwaarden gelden voor de WasteLess-app en -website. Door een account aan te maken ga je ermee akkoord.',
    sections: [
      { h: 'WasteLess gebruiken', p: [
        'Je hebt een account nodig om WasteLess te gebruiken. Houd je wachtwoord voor jezelf; je bent verantwoordelijk voor wat er in je account gebeurt.',
        'Misbruik de dienst niet: geen pogingen om hem te breken, bij gegevens van anderen te komen of hem voor iets illegaals te gebruiken.',
      ] },
      { h: 'Voedselveiligheid', p: [
        'Houdbaarheidsdatums, versheid, herinneringen en recepten in WasteLess zijn gebaseerd op wat jij invoert en op algemene schattingen. Het is geen advies over voedselveiligheid. Controleer eten altijd zelf voordat je het eet, en volg het etiket.',
      ] },
      { h: 'WasteLess Plus', p: [
        'WasteLess Plus is een automatisch verlengend abonnement (maandelijks of jaarlijks), verkocht via Google Play of de App Store. De prijs zie je vóór je koopt.',
        'Een gratis proefperiode, als die wordt aangeboden, gaat over in een betaald abonnement tenzij je minstens 24 uur voor het einde opzegt.',
        'Je abonnement wordt automatisch verlengd totdat je het opzegt in je Google Play- of App Store-accountinstellingen. Opzeggen stopt toekomstige verlengingen; je houdt Plus tot het einde van de betaalde periode.',
        'Betalingen en terugbetalingen worden door Google of Apple afgehandeld volgens hun regels. Plus wordt gedeeld met de leden van je huishouden zolang je abonnement actief is.',
      ] },
      { h: 'Jouw inhoud', p: ['Wat je aan WasteLess toevoegt, blijft van jou. We gebruiken het alleen om de app voor jou en je huishouden te laten werken.'] },
      { h: 'Beschikbaarheid en aansprakelijkheid', p: [
        'We doen ons best om WasteLess goed te laten werken, maar kunnen niet beloven dat het altijd beschikbaar of foutloos is. Voor zover de wet het toestaat, zijn we niet aansprakelijk voor indirecte schade, zoals eten dat bederft of aankopen die je doet op basis van de app.',
      ] },
      { h: 'Je account beëindigen', p: [
        'Je kunt je account altijd verwijderen via Instellingen. We kunnen accounts blokkeren die deze voorwaarden overtreden.',
      ] },
      { h: 'Wijzigingen en recht', p: [
        'We kunnen deze voorwaarden aanpassen; belangrijke wijzigingen laten we je in de app weten. Nederlands recht is van toepassing.',
        `Vragen: ${CONTACT_EMAIL}.`,
      ] },
    ],
  },
  deleteAccount: {
    title: 'Je WasteLess-account verwijderen',
    intro: 'Je kunt je account en alle gegevens zelf verwijderen in de app.',
    sections: [
      { h: 'In de app', p: [
        'Open WasteLess, tik rechtsboven op de instellingenknop, scrol naar beneden, tik op Account verwijderen en bevestig.',
      ] },
      { h: 'Wat er wordt verwijderd', p: [
        'Je account (naam, e-mailadres, wachtwoord), alle items die je toevoegde, je geschiedenis van opgemaakt, ingevroren en weggegooid eten, en je instellingen. Dat gebeurt direct en kan niet ongedaan worden gemaakt.',
        'Deel je een huishouden, dan blijft het huishouden bestaan voor de andere leden, net als de items die zij toevoegden.',
        'Een WasteLess Plus-abonnement loopt via Google Play of de App Store en wordt niet automatisch opgezegd. Zeg het op in je store-accountinstellingen.',
      ] },
      { h: 'Kun je de app niet gebruiken?', p: [
        `Mail naar ${CONTACT_EMAIL} vanaf het e-mailadres van je account en vraag ons het te verwijderen. We verwijderen het binnen 30 dagen en bevestigen dat per e-mail.`,
      ] },
    ],
  },
}

export const LEGAL_DOCS = { en, nl }
