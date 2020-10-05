Pullatessa suorita ```npm install``` komento ladataksesi vaadittavat kirjastot

Serveri lähtee pyörimään ```npm start``` komennolla

## TÄMÄNHETKISET API KUTSUT



### Käyttäjän luonti POST-kutsulla

```http://localhost:3000/api/users/```

{
	"username": "käyttäjänimi",
	"email": "sähköposti@sähköpsti.com",
	"password": "salasana"
}


### Käyttäjän kirjautuminen POST-kutsulla

```http://localhost:3000/api/login```

{
	"username": "käyttäjänimi",
	"password": "salasana"
}

(Sessiosta syntyy tokeni)


### Endpointin-testaus GET-kutsulla

```http://localhost:3000/api/login/```

{ Headersiin vaaditaan tokeni todennukseksi }

