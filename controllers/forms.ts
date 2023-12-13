import express from "express";
import PDFDocument from "pdfkit";
import fs from "fs";

const formsRouter = express.Router();

const getCurrentDate = () => {
  const currentDate = new Date();

  const day = String(currentDate.getDate()).padStart(2, "0");
  const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Months are zero-based
  const year = currentDate.getFullYear();

  const formattedDate = `${day}.${month}.${year}`;
  return formattedDate;
};

// FORM 1
formsRouter.post("/CustomerContractForm", (req, res) => {
  const texts = {
    form1Header:
      "LOMAKE 1 - ASIAKASSOPIMUKSEEN LIITTYVÄT TYÖTURVALLISUUS- JA TYÖHYVINVOINTIASIAT (vuokrausyrityksen ja käyttäjäyrityksen edustajat täyttävät yhdessä)",
    form1Text1:
      "Lomake on tarkoitus täyttää henkilöstöpalvelu- ja käyttäjäyrityksen yhteistyössä. Lomakkeen täyttämisellä ohjataan käymään olennaisimmat työturvallisuuteen, -terveyteen ja -hyvinvointiin liittyvät asiat läpi sekä suunnittelemaan ja sopimaan tärkeistä asioista. Täytetty lomake voidaan liittää asiakassopimuksen loppuun ja siihen voidaan myös viitata sopimuksessa. Lomake tarkistetaan ja sitä täydennetään työntekijän tilauksen yhteydessä.",
    form1Text2: "TYÖNTEKIJÖILTÄ TYÖSSÄ EDELLYTETTÄVÄ KOULUTUS JA TYÖKOKEMUS SEKÄ TYÖN AMMATTITAITOVAATIMUKSET",
    form1Text3:
      "TYÖN ERITYISPIIRTEET, TYÖSSÄ ESIINTYVÄT HAITTA-JA VAARATEKIJÄT SEKÄ MUUT TYÖTURVALLISUUDEN KANNALTA ERITYISESTI HUOMIOITAVAT SEIKAT (esim. terveydentilavaatimukset sekä erityistä varaa aiheuttava työ ja siihen liittyvät terveystarkastukset ja ilmoitus 16-17 vuotiaiden nuorten työntekijäin käyttämisestä vaaralliseen työhön)",
    form1Text4:
      "TYÖTEHTÄVISSÄ TARVITTAVAT HENKILÖNSUOJAIMET (+työvaatetus) JA KUVAUS SIITÄ KUMPI OSAPUOLI VASTAA TARVITTAVIEN SUOJAINTEN TOIMITTAMISESTA TYÖNTEKIJÖILLE JA SUOJAINTEN HUOLLOSTA",
    form1Text5:
      "KUVAUS VUOKRATYÖNTEKIJÖIDEN PEREHDYTYKSESTÄ JA TYÖNOPASTUKSESTA (ketkä perehdyttävät, kuinka kauan kestää, mitä asioita käydään läpi, mitä perehdytysmateriaalia vuokratyöntekijöille annetaan jne.)",
    form1Text6:
      "MITEN TOIMITAAN TYÖTAPATURMAN SATTUESSA VUOKRATYÖNTEKIJÄLLE, SAIRAUSPOISSAOLOTILANTEISSA JA MUISSA VAARATILANTEISSA (onnettomuus ja poikkeustilanteet, läheltä piti –tilanteet, väkivalta- ja uhkatilanteet)",
    form1Text7:
      "MITEN VUOKRATYÖNTEKIJÄ ILMOITTAA TYÖTAPATURMISTA, SAIRAUSPOISSAOLOISTA, MUISTA VAARATILANTEISTA TAI MUISTA TURVALLISUUSHAVAINNOISTA (ongelmat, puutteet, turvallisuusaloitteet)",
    form1Text8: "MITEN TUETAAN VUOKRATYÖNTEKIJÄN TYÖKYKYÄ (VARHAISEN TUEN MALLI)?",
    form1Text9: "TYÖNTEKIJÄ OTTAA TYÖTURVALLISUUSASIOISSA YHTEYTTÄ HENKILÖÖN/HENKILÖIHIN",
    form1Text10: "Käyttäjäyritys toimittaa vuokrayritykselle kopion (tarvittaessa)",
    form1Text11: "KUVAUS VUOKRAYRITYKSEN JA KÄYTTÄJÄYRITYKSEN VÄLISESTÄ YHTEYDENPIDOSTA ASIAKKUUDEN AIKANA",
    form1Text12: "VUOKRAYRITYKSEN YHTEYSHENKILÖN YHTEYSTIEDOT",
    form1Text13: "KÄYTTÄJÄYRITYKSEN YHTEYSHENKILÖN YHTEYSTIEDOT",
    form1Check1: "Lainsäädännöstä seuraavat työturvallisuusvastuut on käyty yhdessä läpi",
    form1Check2: "Työterveyshuollon työpaikkaselvityksestä",
    form1Check3: "Työsuojelun toimintaohjelmasta",
    form1Check4: "Pelastussuunnitelmasta",
    form1Check5: "Viimeisimmän riskin arvioinnin tuloksista",
    workRoom: "Työhuoneen sijanti",
    form1ByDate: "mennessä (päivämäärä)",
  };

  const formData = req.body;

  const doc = new PDFDocument();
  doc.font("Times-Roman");

  doc.fontSize(12).text(getCurrentDate());
  doc.fontSize(14).text(texts.form1Header);
  doc.moveDown();
  doc.fontSize(11).text(texts.form1Text1);
  doc.moveDown();

  doc.fontSize(12).text(`Vuokrausyritys:  ${formData.rentalCompany}`);
  doc.fontSize(12).text(`Käyttäjäyritys:   ${formData.userCompany}`);

  doc.moveDown();

  doc.fontSize(12).text(`${texts.form1Check1}: ${formData.check1 ? "Kyllä" : "Ei"}`);

  doc.moveDown();

  doc.fontSize(12).text(`${texts.form1Text2}`);
  doc.moveDown();
  doc.font("Times-Italic").fontSize(11).text(formData.form1Text2, {
    align: "center",
  });
  doc.moveDown();

  doc.font("Times-Roman").fontSize(12).text(`${texts.form1Text3}`);
  doc.moveDown();
  doc.font("Times-Roman").font("Times-Italic").fontSize(11).text(formData.form1Text3, {
    align: "center",
  });
  doc.moveDown();

  doc.font("Times-Roman").fontSize(12).text(`${texts.form1Text4}`);
  doc.moveDown();
  doc.font("Times-Italic").fontSize(11).text(formData.form1Text4, {
    align: "center",
  });
  doc.moveDown();

  doc.font("Times-Roman").fontSize(12).text(`${texts.form1Text5}`);
  doc.moveDown();
  doc.font("Times-Italic").fontSize(11).text(formData.form1Text5, {
    align: "center",
  });
  doc.moveDown();

  doc.font("Times-Roman").fontSize(12).text(`${texts.form1Text6}`);
  doc.moveDown();
  doc.font("Times-Italic").fontSize(11).text(formData.form1Text6, {
    align: "center",
  });
  doc.moveDown();

  doc.font("Times-Roman").fontSize(12).text(`${texts.form1Text7}`);
  doc.moveDown();
  doc.font("Times-Italic").fontSize(11).text(formData.form1Text7, {
    align: "center",
  });
  doc.moveDown();

  doc.font("Times-Roman").fontSize(12).text(`${texts.form1Text8}`);
  doc.moveDown();
  doc.font("Times-Italic").fontSize(11).text(formData.form1Text8, {
    align: "center",
  });

  doc.font("Times-Roman").fontSize(12).text(`${texts.form1Text9}`);
  doc.moveDown();

  doc.fontSize(12).text(`Nimi:   ${formData.name1}`);
  doc.fontSize(12).text(`Puhelinnumero:   ${formData.phonenumber1}`);
  doc.fontSize(12).text(`Sähköposti:   ${formData.email1}`);
  doc.fontSize(12).text(`Työhuoneen sijainti:   ${formData.workroom1}`);

  doc.fontSize(12).text(`Nimi:   ${formData.name2}`);
  doc.fontSize(12).text(`Puhelinnumero:   ${formData.phonenumber2}`);
  doc.fontSize(12).text(`Sähköposti:   ${formData.email2}`);
  doc.fontSize(12).text(`Työhuoneen sijainti:   ${formData.workroom2}`);

  doc.moveDown();

  doc.fontSize(12).text(`${texts.form1Text10}: `);
  doc.moveDown();
  doc.fontSize(12).text(`${texts.form1Check2}: ${formData.check2 ? "Kyllä" : "Ei"}`);
  doc.fontSize(12).text(`${texts.form1Check3}: ${formData.check3 ? "Kyllä" : "Ei"}`);
  doc.fontSize(12).text(`${texts.form1Check4}: ${formData.check4 ? "Kyllä" : "Ei"}`);
  doc.fontSize(12).text(`${texts.form1Check5}: ${formData.check5 ? "Kyllä" : "Ei"}`);

  doc.moveDown();

  doc.fontSize(12).text(`${texts.form1Text11}: `);
  doc.moveDown();
  doc.font("Times-Italic").fontSize(11).text(formData.form1Text11, {
    align: "center",
  });

  doc.font("Times-Roman").fontSize(12).text(`${texts.form1Text12}`);
  doc.moveDown();

  doc.fontSize(12).text(`Nimi:   ${formData.name3}`);
  doc.fontSize(12).text(`Puhelinnumero:   ${formData.phonenumber3}`);
  doc.fontSize(12).text(`Sähköposti:   ${formData.email3}`);

  doc.fontSize(12).text(`${texts.form1Text13}`);
  doc.moveDown();

  doc.fontSize(12).text(`Nimi:   ${formData.name4}`);
  doc.fontSize(12).text(`Puhelinnumero:   ${formData.phonenumber4}`);
  doc.fontSize(12).text(`Sähköposti:   ${formData.email4}`);

  const pdfStream = fs.createWriteStream("customercontractform.pdf");
  doc.pipe(pdfStream);
  doc.end();

  pdfStream.on("finish", () => {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="customercontractform.pdf"`);
    fs.createReadStream("customercontractform.pdf").pipe(res);
  });
});

// FORM 2
formsRouter.post("/ContractOfEmploymentForm", (req, res) => {
  const formData = req.body;

  const texts = {
    form2Header: "LOMAKE 2 – TYÖNTEKIJÄN YLEISPEREHDYTYS (vuokrausyrityksen perehdyttäjä täyttää)",
    form2Text1:
      "Henkilöstöpalveluyrityksen perehdyttäjä täyttää lomakkeen vuokratyöntekijän perehdytyksen yhteydessä. Lomakkeen aihealueiden luettelo toimii muistilistana perehdytyksessä läpikäytävistä asioista. Lomakkeen jälkimmäiseen osaan kirjataan työntekijälle tärkeiden henkilöiden yhteystiedot",
    form2Text2:
      "Kopio täytetystä lomakkeesta tulee antaa työntekijälle ja lähettää myös käyttäjäyritykselle. Täytetystä lomakkeesta käyttäjäyritys näkee mitä asioita yleisperehdytys on sisältänyt. Tämä auttaa käyttäjäyritystä työnopastuksen sisällön suunnittelussa.",
    form2Text3: "Yleisperehdytys annettu",
    form2Text4: "Seuraavat asiat on käyty läpi yleisperehdytyksen yhteydessä kaikille vuokratyöntekijöille",
    form2Text5:
      "Seuraavat asiat on käyty läpi yleisperehdytyksen yhteydessä uusille vuokratyöntekijöille (jotka saavat ensimmäistä kertaa yleisperehdytyksen)",
    form2Text6: "Työkyvyn varhaisen tuen malli ja sairauspoissaoloseuranta",
    form2Text7: "Esimiehen rooli",
    form2Text8: "VUOKRAYRITYKSEN YHTEYSHENKILÖN YHTEYSTIEDOT",
    form2Text9: "TYÖNTEKIJÄN PÄÄSY TYÖPAIKKAAN (kulkuyhteydet, kulkuluvat jne.)",
    form2Text10: "KÄYTTÄJÄYRITYKSEN YHTEYSHENKILÖN (JOLLE ILMOITTAUDUTAAN) YHTEYSTIEDOT",
    form2Text11: "Täytetyn lomakkeen kopio on",
    form2Check1: "Kasvotusten",
    form2Check2: "Puhelimitse",
    form2Check3: "Ylityökäytäntö",
    form2Check4: "Työtehtävä ja siinä vaadittava osaaminen",
    form2Check5: "Työssä tarvittavat henkilönsuojaimet(+työvaatetus) ja niiden saaminen käyttöön",
    form2Check6: "Kenelle työntekijä ilmoittaa havaitsemistaan vioista ja puutteista",
    form2Check7: "Olennaisimmat asiat käyttäjäyrityksen työpaikkaselvityksestä/riskien arvioinnista",
    form2Check8: "Työturvallisuuslain mukaiset työntekijän velvoitteet ja oikeus pidättäytyä työstä",
    form2Check9: "Toimintaohjeet tapaturman tai muun vaaratilanteen sattuessa vuokratyöntekijälle",
    form2Check10: "Vuokrayrityksen työsuojeluvaltuutettu",
    form2Check11: "Toimintaohjeet vuokratyöntekijän sairastuessa",
    form2Check12: "Työterveyshuollon palvelut",
    form2Check13: "Lähetetty työntekijälle postitse/sähköpostitse",
    form2Check14: "Annettu työntekijälle perehdytyksen päätteeksi",
    rentalCompanyAndOrientation: "Vuokrausyritys ja perehdytyksen antaja",
    userCompanyAddress: "Käyttäjäyrityksen osoite",
    workRoomPlace: "Työhuone/Ilmoittautumispaikka",
    registrationTime: "Ilmoittautumisaika (Pvm)",
  };

  const doc = new PDFDocument();
  doc.font("Times-Roman");

  doc.fontSize(12).text(getCurrentDate());
  doc.fontSize(14).text(texts.form2Header);
  doc.moveDown();
  doc.fontSize(11).text(texts.form2Text1);
  doc.fontSize(11).text(texts.form2Text2);

  doc.moveDown();
  doc.fontSize(12).text(texts.rentalCompanyAndOrientation);
  doc.fontSize(12).text(formData.rentalCompany);
  doc.fontSize(12).text(getCurrentDate());
  doc.moveDown();

  doc.fontSize(12).text(texts.form2Text3);
  doc.moveDown();
  doc.fontSize(12).text(formData.check ? "Kasvotusten tai puhelimitse" : "ei ole");

  doc.moveDown();

  doc.fontSize(12).text(`Vuokratyöntekijä: ${formData.worker}`);
  doc.fontSize(12).text(`${texts.form2Check3}: ${formData.check3 ? "Kyllä" : "Ei"}`);
  doc.fontSize(12).text(`${texts.form2Check4}: ${formData.check4 ? "Kyllä" : "Ei"}`);

  doc.moveDown();

  doc.fontSize(12).text(texts.form2Text4);
  doc.fontSize(12).text(`${texts.form2Check5}: ${formData.check5 ? "Kyllä" : "Ei"}`);
  doc.fontSize(12).text(`${texts.form2Check6}: ${formData.check6 ? "Kyllä" : "Ei"}`);
  doc.fontSize(12).text(`${texts.form2Check7}: ${formData.check7 ? "Kyllä" : "Ei"}`);
  doc.fontSize(12).text(`${texts.form2Check8}: ${formData.check8 ? "Kyllä" : "Ei"}`);

  doc.moveDown();

  doc.fontSize(12).text(texts.form2Text5);
  doc.fontSize(12).text(`${texts.form2Check9}: ${formData.check9 ? "Kyllä" : "Ei"}`);
  doc.fontSize(12).text(`${texts.form2Check10}: ${formData.check10 ? "Kyllä" : "Ei"}`);
  doc.fontSize(12).text(`${texts.form2Check11}: ${formData.check11 ? "Kyllä" : "Ei"}`);
  doc.fontSize(12).text(`${texts.form2Check12}: ${formData.check12 ? "Kyllä" : "Ei"}`);

  doc.moveDown();

  doc.fontSize(12).text(`Yhteystiedot: ${formData.contact1}`);
  doc.fontSize(12).text(`Puhelinnumero: ${formData.phonenumber1}`);

  doc.moveDown();
  doc.fontSize(12).text(texts.form2Text6);
  doc.moveDown();
  doc.fontSize(12).text(texts.form2Text7);
  doc.moveDown();
  doc.fontSize(12).text(texts.form2Text8);
  doc.moveDown();

  doc.fontSize(12).text(`Nimi:   ${formData.name1}`);
  doc.fontSize(12).text(`Puhelinnumero:   ${formData.phonenumber2}`);
  doc.fontSize(12).text(`Sähköposti:   ${formData.email1}`);
  doc.fontSize(12).text(`Käyttäjäyrityksen osoite:   ${formData.address}`);
  doc.moveDown();

  doc.fontSize(12).text(texts.form2Text9);
  doc.fontSize(12).text(formData.access);
  doc.moveDown();

  doc.fontSize(12).text(texts.form2Text10);
  doc.moveDown();
  doc.fontSize(12).text(`Nimi:   ${formData.name2}`);
  doc.fontSize(12).text(`Puhelinnumero:   ${formData.phonenumber3}`);
  doc.fontSize(12).text(`Sähköposti:   ${formData.email2}`);
  doc.fontSize(12).text(`Työhuone/Ilmoittautumispaikka:  ${formData.workRoomPlace}`);
  doc.moveDown();

  doc.fontSize(12).text(texts.form2Text10);
  doc.moveDown();
  doc.fontSize(12).text(`${texts.form2Check13}: ${formData.check13 ? "Kyllä" : "Ei"}`);
  doc.fontSize(12).text(`${texts.form2Check14}: ${formData.check14 ? "Kyllä" : "Ei"}`);
  doc.moveDown();

  doc.fontSize(12).text("ALLEKIRJOITUKSET");
  doc.moveDown();
  doc.fontSize(12).text(`Perehdyttäjä:   ${formData.orientator}`);
  doc.fontSize(12).text(`Perehdytetty:   ${formData.orientated}`);

  const pdfStream = fs.createWriteStream("contractofemployment.pdf");
  doc.pipe(pdfStream);
  doc.end();

  pdfStream.on("finish", () => {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="contractofemployment.pdf"`);
    fs.createReadStream("contractofemployment.pdf").pipe(res);
  });
});

// FORM 3
formsRouter.post("/GuidanceToWorkForm", (req, res) => {
  const formData = req.body;

  const texts = {
    form3Header: "LOMAKE 3 – TYÖNOPASTUS (käyttäjäyrityksen työnopastaja täyttää)",
    form3Text1:
      "Käyttäjäyrityksen perehdyttäjä täyttää lomakkeen vuokratyöntekijän työnopastuksen yhteydessä. Lomakkeen aihealueiden luettelo toimii tarkistuslistana työnopastuksessa läpikäytävistä asioista. Lomakkeeseen täytetään myös käyttäjäyrityksessä vuokratyöntekijän esimiehenä toimivan henkilön yhteystiedot.",
    form3Text2:
      "Kopio täytetystä lomakkeesta tulee antaa työntekijälle ja henkilöstöpalveluyritykselle. Täytetty lomake toimii eräänlaisena todisteena käyttäjäyrityksen työnopastuksen antamisesta.",
    form3Text3: "Käyttäjäyritys ja työnopastuksen antaja",
    form3Text4: "Seuraavat asiat on käyty läpi käyttäjäyrityksen työntekijälle antamassa työnopastuksessa",
    form3Text5: "Käyttäjäyrityksen esimiehen (jos eri henkilö kuin edellinen) yhteystiedot",
    form3Check1: "Työtehtävät ja turvalliset työtavat",
    form3Check2: "Työssä esiintyvät haitta- ja vaaratekijät sekä niiltä suojautuminen",
    form3Check3: "Työajat ja tauot",
    form3Check4: "Turvavarusteiden ja henkilönsuojainten käyttäminen ja huoltaminen",
    form3Check5: "Siisteys ja järjestys",
    form3Check6: "Toiminta onnettomuus- ja poikkeustilanteissa",
    form3Check7:
      "Turvallisuushavaintojen tekeminen (työtapaturmat ja muut vaaratilanteet, aloitteet, puutteet/ongelmat)",
    form3Check8: "Ensiapukaapit, alkusammuttimet, poistumistiet jne.",
    form3Check9: "Henkilöstötilat (savuttomuus ym.)",
    form3Check10: "Erityishuomioitavat asiat",
    form3Check11:
      "Työn hyvä ergonomia (tuolien/pöytien/työtasojen säätäminen, työasennot ja liikkeet, nostotekniikat jne.)",
    form3Check12: "Tiedotuskäytännöt (ilmoitustaulut, sähköpostilistat jne.)",
    form3Check13: "Osallistuminen käyttäjäyrityksen kokouksiin ja muuhun viikottaiseen toimintaan",
    form3Check14: "Lupa-asiat (kulkukortit, tulityökortit jne.)",
    form3Check15: "Käyttäjäyrityksen työsuojeluvaltuutettu",
    form3Check16: "Keneltä kysytään apua sitä tarvittaessa",
  };

  const doc = new PDFDocument();
  doc.font("Times-Roman");

  doc.fontSize(12).text(getCurrentDate());
  doc.fontSize(14).text(texts.form3Header);
  doc.moveDown();
  doc.moveDown();
  doc.fontSize(12).text(texts.form3Text1);
  doc.moveDown();
  doc.fontSize(12).text(texts.form3Text2);
  doc.moveDown();

  doc.fontSize(12).text(`${texts.form3Text3}: ${formData.rentalCompany}`);
  doc.moveDown();

  doc.fontSize(12).text(`Vuokratyöntekijä: ${formData.worker}`);
  doc.moveDown();

  doc.fontSize(12).text(texts.form3Text4);
  doc.moveDown();

  doc.fontSize(12).text(`${texts.form3Check1}: ${formData.check1 ? "Kyllä" : "Ei"}`);
  doc.fontSize(12).text(`${texts.form3Check2}: ${formData.check2 ? "Kyllä" : "Ei"}`);
  doc.fontSize(12).text(`${texts.form3Check3}: ${formData.check3 ? "Kyllä" : "Ei"}`);
  doc.fontSize(12).text(`${texts.form3Check4}: ${formData.check4 ? "Kyllä" : "Ei"}`);
  doc.fontSize(12).text(`${texts.form3Check5}: ${formData.check5 ? "Kyllä" : "Ei"}`);
  doc.fontSize(12).text(`${texts.form3Check6}: ${formData.check6 ? "Kyllä" : "Ei"}`);
  doc.fontSize(12).text(`${texts.form3Check7}: ${formData.check7 ? "Kyllä" : "Ei"}`);
  doc.fontSize(12).text(`${texts.form3Check8}: ${formData.check8 ? "Kyllä" : "Ei"}`);
  doc.fontSize(12).text(`${texts.form3Check9}: ${formData.check9 ? "Kyllä" : "Ei"}`);
  doc.fontSize(12).text(`${texts.form3Check10}: ${formData.check10 ? "Kyllä" : "Ei"}`);
  doc.fontSize(12).text(`${texts.form3Check11}: ${formData.check11 ? "Kyllä" : "Ei"}`);
  doc.fontSize(12).text(`${texts.form3Check12}: ${formData.check12 ? "Kyllä" : "Ei"}`);
  doc.fontSize(12).text(`${texts.form3Check13}: ${formData.check13 ? "Kyllä" : "Ei"}`);
  doc.fontSize(12).text(`${texts.form3Check14}: ${formData.check14 ? "Kyllä" : "Ei"}`);
  doc.fontSize(12).text(`${texts.form3Check15}: ${formData.check15 ? "Kyllä" : "Ei"}`);
  doc.fontSize(12).text(`${texts.form3Check16}: ${formData.check16 ? "Kyllä" : "Ei"}`);
  doc.moveDown();

  doc.fontSize(12).text(`Nimi:   ${formData.name1}`);
  doc.fontSize(12).text(`Puhelinnumero:   ${formData.phonenumber1}`);
  doc.fontSize(12).text(`Sähköposti:   ${formData.email1}`);
  doc.fontSize(12).text(`Työhuone/Työpiste:  ${formData.workstation1}`);
  doc.moveDown();

  doc.fontSize(12).text(texts.form3Text4);
  doc.moveDown();
  doc.fontSize(12).text(`Nimi:   ${formData.name2}`);
  doc.fontSize(12).text(`Puhelinnumero:   ${formData.phonenumber2}`);
  doc.fontSize(12).text(`Sähköposti:   ${formData.email2}`);
  doc.fontSize(12).text(`Työhuone/Työpiste:  ${formData.workstation2}`);
  doc.moveDown();

  doc.fontSize(12).text("ALLEKIRJOITUKSET");
  doc.moveDown();
  doc.fontSize(12).text(`Perehdyttäjä:   ${formData.orientator}`);
  doc.fontSize(12).text(`Perehdytetty:   ${formData.orientated}`);

  const pdfStream = fs.createWriteStream("guidancetoworkform.pdf");
  doc.pipe(pdfStream);
  doc.end();

  pdfStream.on("finish", () => {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="guidancetoworkform.pdf"`);
    fs.createReadStream("guidancetoworkform.pdf").pipe(res);
  });
});

// FORM 4
formsRouter.post("/WorkPerformanceForm", (req, res) => {
  const formData = req.body;
  const texts = {
    form4Header: "LOMAKE 4 – TOIMINNAN ARVIOINTI (käyttäjäyrityksen ja vuokrayrityksen edustajat täyttävät)",
    form4Text1:
      "Henkilöstöpalveluyrityksen ja käyttäjäyrityksen edustajat täyttävät lomakkeen yhdessä. Loppupalaverissa tehdään yhteenveto toimeksiannon ja erityisesti työturvallisuuden varmistamisen sujumisesta. Lomakkeen alussa on muistilista toiminnan arvioinnissa läpikäytävistä asioista. Lomakkeen loppuosaan tulee kirjoittaa ylös toiminnan arvioinnin ja yhteisen analysoinnin aikana esiinnousseet olennaisimmat asiat (sekä toimeksiannon onnistumiset että kehittämistä vaativat asiat).",
    form4Text2:
      "Täytetystä lomakkeesta (tai sen kopiosta) tulee jäädä oma kappale molemmille osapuolille. Lomakkeeseen kirjattujen asioiden pohjalta yritykset voivat kehittää työturvallisuustoimintaansa seuraavassa vuokratyötoimeksiannossa. Palautteet on hyvä käydä läpi myös vuokratyöntekijän kanssa",
    form4Text3: "Seuraavat asiat on käyty läpi toimeksiannon päätyttyä tehdyssä jälkiarvioinnissa",
    form4Text4: "YHTEENVETO TOIMEKSIANNON (TYÖTURVALLISUUTEEN LIITTYVISTÄ) ONNISTUMISISTA JA HYVIN SUJUNEISTA ASIOISTA",
    form4Text5: "YHTEENVETO TOIMEKSIANNON AIKANA ILMENNEISTÄ ONGELMISTA/PARANTAMISTA VAATIVISTA ASIOISTA",
    form4Text6: "MITEN OMAA TOIMINTAA VOIDAAN KEHITTÄÄ, JOTTA EDELLÄ MAINITTUJA ASIOITA SAADAAN JATKOSSA PARANNETTUA",
    form4Check1:
      "Toimeksiannon aikana vuokratyöntekijöiltä saatu turvallisuuspalaute (työtapaturmat, muut vaaratilanteet, aloitteet, puutteet/ongelmat)",
    form4Check2: "Vuokratyöntekijöiden ammattitaidon ja osaamisen riittävyys suhteessa työtehtäviin",
    form4Check3: "Vuokratyöntekijöiden työssä suoriutuminen mukaanlukien työturvallisuusasiat",
    form4Check4: "Vuokratyöntekijöille sattuneet työtapaturmat ja niiden tutkintaraportit",
    form4Check5: "Käyttäjäyrityksen palaute vuokrayritykselle tämän toiminnasta toimeksiannon aikana",
    form4Check6:
      "Vuokrayrityksen (ja vuokratyöntekijöiden) palaute käyttäjäyritykselle tämän toiminnasta toimeksiannon aikana",
    form4Check7: "Tiedonkulun toimivuus toimeksiannon aikana (erityisesti vuokra- ja käyttäjäyrityksen välillä)",
    form4Check8: "Annetun perehdytyksen ja työnopastuksen riittävyys (määrä ja laatu)",
    form4Check9: "Työssä käytettyjen henkilönsuojainten ja turvavälineiden riittävyys",
    rentalCompanyCaps: "VUOKRAYRITYS",
    userCompanyCaps: "KÄYTTÄJÄYRITYS",
    cooperation: "YHTEISTYÖ",
  };

  const doc = new PDFDocument();
  doc.font("Times-Roman");

  doc.fontSize(12).text(getCurrentDate());
  doc.fontSize(14).text(texts.form4Header);
  doc.moveDown();
  doc.moveDown();
  doc.fontSize(12).text(texts.form4Text1);
  doc.moveDown();
  doc.fontSize(12).text(texts.form4Text2);
  doc.moveDown();

  doc.fontSize(12).text(texts.form4Text3);
  doc.moveDown();

  doc.fontSize(12).text(`${texts.form4Check1}: ${formData.check1 ? "Kyllä" : "Ei"}`);
  doc.fontSize(12).text(`${texts.form4Check2}: ${formData.check2 ? "Kyllä" : "Ei"}`);
  doc.fontSize(12).text(`${texts.form4Check3}: ${formData.check3 ? "Kyllä" : "Ei"}`);
  doc.fontSize(12).text(`${texts.form4Check4}: ${formData.check4 ? "Kyllä" : "Ei"}`);
  doc.fontSize(12).text(`${texts.form4Check5}: ${formData.check5 ? "Kyllä" : "Ei"}`);
  doc.fontSize(12).text(`${texts.form4Check6}: ${formData.check6 ? "Kyllä" : "Ei"}`);
  doc.fontSize(12).text(`${texts.form4Check7}: ${formData.check7 ? "Kyllä" : "Ei"}`);
  doc.fontSize(12).text(`${texts.form4Check8}: ${formData.check8 ? "Kyllä" : "Ei"}`);
  doc.fontSize(12).text(`${texts.form4Check9}: ${formData.check9 ? "Kyllä" : "Ei"}`);
  doc.moveDown();

  doc.fontSize(12).text(texts.form4Text4);
  doc.moveDown();
  doc.fontSize(12).text(formData.textArea1);
  doc.moveDown();

  doc.fontSize(12).text(texts.form4Text5);
  doc.moveDown();
  doc.fontSize(12).text(formData.textArea2);
  doc.moveDown();

  doc.fontSize(12).text(texts.form4Text6);
  doc.moveDown();

  doc.fontSize(12).text(`${texts.rentalCompanyCaps}:  ${formData.rentalCompany}`);
  doc.moveDown();

  doc.fontSize(12).text(`${texts.userCompanyCaps}:  ${formData.userCompany}`);
  doc.moveDown();

  doc.fontSize(12).text(`${texts.cooperation}:  ${formData.cooperation}`);

  const pdfStream = fs.createWriteStream("workperformanceform.pdf");
  doc.pipe(pdfStream);
  doc.end();

  pdfStream.on("finish", () => {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="workperformanceform.pdf"`);
    fs.createReadStream("workperformanceform.pdf").pipe(res);
  });
});

formsRouter.post("/OrientationAndGuidanceForm", (req, res) => {
  const formData = req.body;

  const texts = {
    form5Header: "LOMAKE 5 – Perehdytys ja työnopastus kiireellisissä tilanteissa",
    form5Text1:
      "Tilanteissa, joissa työntekijä tarvitaan nopeasti tekemään työtä, voidaan osa perehdytyksestä jättää tehtäväksi työn aloittamisen jälkeen. Turvallisuuteen liittyvät tärkeimmät asiat tulee kuitenkin aina kertoa työntekijälle heti alussa. Tässä lomakkeessa on asiat, jotka ainakin tulee käydä läpi ennen työn aloitusta.",
    form5Text2: "Henkilöstöpalveluyrityksen perehdytys kiireellisessä tapauksessa",
    form5Text3: "Työhön liittyvät turvallisuus- ja terveysriskit",
    form5Text4: "Henkilöstöpalveluyrityksen yhteishenkilön yhteystiedot",
    form5Text5: "Käyttäjäyrityksen osoite ja ohjeet työpaikalle pääsemiseen (esim. kulkuluvat)",
    form5Text6: "Käyttäjäyrityksen yhteyshenkilön yhteystiedot",
    form5Text7: "Käyttäjäyrityksen työnopastus kiireellisessä tapauksessa",
    form5Text8: "Turvavarusteiden ja henkilönsuojainten käyttäminen",
    jobAdvisor: "Työnopastaja",
    userCompanyName: "Käyttäjäyrityksen nimi",
    serviceCompany: "Henkilöstöpalveluyrityksen nimi",
  };

  const doc = new PDFDocument();
  doc.font("Times-Roman");

  doc.fontSize(12).text(getCurrentDate());
  doc.fontSize(14).text(texts.form5Header);
  doc.moveDown();
  doc.moveDown();
  doc.fontSize(12).text(texts.form5Text1);
  doc.moveDown();

  doc.fontSize(12).text(texts.form5Text2);
  doc.moveDown();

  doc.fontSize(12).text(`Henkilöstöpalveluyrityksen nimi:  ${formData.serviceCompany}`);
  doc.moveDown();

  doc.fontSize(12).text(`Perehdyttäjä:  ${formData.orientator}`);
  doc.moveDown();

  doc.fontSize(12).text(`Vuokratyöntekijä:  ${formData.worker}`);
  doc.moveDown();

  doc.fontSize(12).text(`Työtehtävä ja siinä vaadittava osaaminen:`);
  doc.moveDown();

  doc.fontSize(12).text(formData.requiredSkills);
  doc.moveDown();

  doc.fontSize(12).text(`Työssä tarvittavat henkilönsuojaimet(+työvaatetus) ja niiden saaminen käyttöön:`);
  doc.moveDown();
  doc.fontSize(12).text(formData.protectiveEquipment);
  doc.moveDown();

  doc.fontSize(12).text(`Työhön liittyvät turvallisuus- ja terveysriskit:`);
  doc.moveDown();
  doc.fontSize(12).text(formData.safetyAndRisks);
  doc.moveDown();

  doc.fontSize(12).text(`Henkilöstöpalveluyrityksen yhteishenkilön yhteystiedot:  ${formData.contact1}`);
  doc.moveDown();

  doc.fontSize(12).text(`Käyttäjäyrityksen osoite ja ohjeet työpaikalle pääsemiseen (esim. kulkuluvat):`);
  doc.moveDown();
  doc.fontSize(12).text(formData.addressAndInstructions);
  doc.moveDown();

  doc.fontSize(12).text(`Käyttäjäyrityksen yhteyshenkilön yhteystiedot:  ${formData.contact2}`);
  doc.moveDown();

  doc.fontSize(12).text(`${texts.form5Text7}:  ${formData.contact2}`);
  doc.moveDown();

  doc.fontSize(12).text(`Käyttäjäyrityksen nimi:  ${formData.userCompanyName}`);
  doc.moveDown();

  doc.fontSize(12).text(`Työnopastaja:  ${formData.jobAdvisor}`);
  doc.moveDown();

  doc.fontSize(12).text(`Vuokratyöntekijä:  ${formData.worker2}`);
  doc.moveDown();

  doc.fontSize(12).text(`Työtehtävät ja turvalliset työtavat:  ${formData.workDuties}`);
  doc.moveDown();

  doc
    .fontSize(12)
    .text(`Työssä esiintyvät haitta- ja vaaratekijät sekä niiltä suojautuminen:  ${formData.harmfulAndDangerous}`);
  doc.moveDown();

  doc.fontSize(12).text(`Työajat ja tauot:  ${formData.hoursAndBreaks}`);
  doc.moveDown();

  doc.fontSize(12).text(`Turvavarusteiden ja henkilönsuojainten käyttäminen:  ${formData.equipment}`);
  doc.moveDown();

  doc.fontSize(12).text(`Toiminta onnettomuus- ja poikkeustilanteissa:  ${formData.accidents}`);
  doc.moveDown();

  doc.fontSize(12).text(`Ensiapukaapit, alkusammuttimet, poistumistiet jne.:  ${formData.firstAidCabinets}`);
  doc.moveDown();

  doc.fontSize(12).text(`Henkilöstötilat (savuttomuus ym.):  ${formData.facilities}`);
  doc.moveDown();

  doc.fontSize(12).text(`Erityishuomioitavat asiat:  ${formData.specials}`);
  doc.moveDown();

  doc.fontSize(12).text(`Tiedotuskäytännöt (ilmoitustaulut, sähköpostilistat jne.):  ${formData.informationPractices}`);
  doc.moveDown();

  doc.fontSize(12).text(`Lupa-asiat (kulkukortit, tulityökortit jne.):  ${formData.licensing}`);
  doc.moveDown();

  doc.fontSize(12).text(`Keneltä kysytään apua sitä tarvittaessa:  ${formData.askHelp}`);
  doc.moveDown();

  const pdfStream = fs.createWriteStream("orientationandguidanceform.pdf");
  doc.pipe(pdfStream);
  doc.end();

  pdfStream.on("finish", () => {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="orientationandguidanceform.pdf"`);
    fs.createReadStream("orientationandguidanceform.pdf").pipe(res);
  });
});

export default formsRouter;
