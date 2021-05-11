Pullatessa suorita ```npm install``` komento ladataksesi vaadittavat kirjastot

Projektin saa buildattua ```npm run build``` komennolla

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

### Lisää Työntekijä Vuokrayritykselle ###
```http://localhost:3000/api/agencies/:id/workers```
```
:id = vuokrayrityksen id
{ "worker": "<työntekijän id>" }
    tai
{ "workers": ["<työntekijäId1>", "<työntekijäId2>"...] }

header
{ "x-access-token": "<vuokrayrityksen kirjautumistoken>" }

Status 200 (success): 
response.updated: <päivitetyn vuokrayrityksen url>
response.workersAdded: [workerId1, workerdId2...] (requestin työntekijät, jotka löytyivät ja lisättiin)
response.workersNotAdded: [workerId1, workerId2...] (requestin työntekijät joita ei löytynyt ja ei lisätty )

Status 400 (failure):
response.error: <virheviesti>

Status 401 (not authorized)
response.error: <virheviesti>
```

### Lisää Työntekijä Vuokrayritykselle ###
```http://localhost:3000/api/agencies/:id/workers```
```
:id = yrityksen id
{ "worker": "<työntekijän id>" }
    tai
{ "workers": ["<työntekijäId1>", "<työntekijäId2>"...] }

header
{ "x-access-token": "<yrityksen kirjautumistoken>" }

Status 200 (success): 
response.updated: <päivitetyn vuokrayrityksen url>
response.workersAdded: [workerId1, workerdId2...] (requestin työntekijät, jotka löytyivät ja lisättiin)
response.workersNotAdded: [workerId1, workerId2...] (requestin työntekijät joita ei löytynyt ja ei lisätty )

Status 400 (failure):
response.error: <virheviesti>

Status 401 (not authorized)
response.error: <virheviesti>
```

### Endpointin-testaus GET-kutsulla

```http://localhost:3000/api/login/```
```
{ Headersiin vaaditaan tokeni todennukseksi }

