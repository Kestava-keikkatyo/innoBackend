Pullatessa suorita ```npm install``` komento ladataksesi vaadittavat kirjastot

Serveri lähtee pyörimään ```npm start``` komennolla

## TÄMÄNHETKISET API KUTSUT



Käyttäjän luonti POST-kutsulla

```http://localhost:3000/user/signup```

{
	"username": "käyttäjänimi",
	"email": "sähköposti@sähköpsti.com",
	"password": "salasana"
}

(Sessiosta syntyy tokeni)




Käyttäjän kirjautminen POST-kutsulla

```http://localhost:3000/user/login/```

{
	"email": "sähköposti@sähköpsti.com",
	"password": "salasana"
}

(Sessiosta syntyy tokeni)




Endpointin-testaus GET-kutsulla

```http://localhost:3000/user/me/```

{ Headersiin vaaditaan tokeni todennukseksi }

