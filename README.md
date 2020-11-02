Pullatessa suorita ```npm install``` komento ladataksesi vaadittavat kirjastot

Serveri lähtee pyörimään ```npm start``` komennolla

## TÄMÄNHETKISET API KUTSUT



### Käyttäjän luonti POST-kutsulla

```http://localhost:3000/api/users/```
```
{
	"username": "käyttäjänimi",
	"email": "sähköposti@sähköpsti.com",
	"password": "salasana"
}
```
### Yrityksen ja vuokrayrityksen luonti POST-Kutusulla
```http://localhost:3000/api/businesses```

```http://localhost:3000/api/agencies```
```
{
    "name": "Barona",
    "username": "Barona",
    "email": "Barona@gmail.com",
    "city": "Helsinki",
    "postnumber": "02300",
    "address": "kiertokuja 5 A",
    "phonenumber": "044-123-456",
    "password": "salasana"
}
```


### Yrityksen ja vuokrayrityksen kirjautuminen
```http://localhost:3000/api/login/business```

```http://localhost:3000/api/login/agency```
```	
{
	"username": "käyttäjänimi",
	"password": "salasana"
}
```
(Sessiosta syntyy tokeni)



### Käyttäjän kirjautuminen POST-kutsulla

```http://localhost:3000/api/login/worker```
```
{
	"username": "käyttäjänimi",
	"password": "salasana"
}
```
(Sessiosta syntyy tokeni)


### Endpointin-testaus GET-kutsulla

```http://localhost:3000/api/login/```
```
{ Headersiin vaaditaan tokeni todennukseksi }

