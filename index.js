const Discord = require('discord.js');

const { prefix, token} = require('./config.json');
const client = new Discord.Client();

const axios = require('axios');
const cheerio = require('cheerio');
const csv = require('csv-parser');
const fs = require('fs');

client.once('ready', () => {
	console.log('ready');
	//getCsv();
	//getCsvTwo();
})

// Sources : https://www.data.gouv.fr/fr/



// Message listener
client.on('message', message => {

    if(message.content.startsWith('cofrance -')){

		// Handles the actual message, for example if it's a given region.
		let msg = message.content;
		let regionSent = msg.split('-');

		// Array of regions to test a message, handle error if it's false.
		const regionsArray = ['bretagne', 'normandie', 'occitanie', 'corse']; // To be continued ...
		if(regionsArray.includes(regionSent[1].toLowerCase())) {

			// ! - Not that clean
			let regionCode = getRegion(regionSent[1]);
			console.log(regionCode);

			let currentDate = getDate();
			//formatMessage();

			let cases = getDatasCases(regionCode);
			//regionCode['depts'] = setDepartments(regionCode);
			let departmentsNbr = setDepartments(regionCode);
			
			console.log(departmentsNbr);
			filterRegionDepartments(departmentsNbr);

			const embedMsg = new Discord.MessageEmbed()
				.setColor('#0099ff')
				.setTitle('Région ' + regionSent[1] )
				.setDescription('Récapitulatifs Covid-19')
				.attachFiles(['assets/' + regionCode + '.png'])
				.attachFiles(['assets/marianne.png'])
				.setThumbnail('attachment://'+ regionCode + '.png')
				.addFields( 
					{ name : 'Cas recensés', value: cases.total},
					{ name : '♂ Hommes', value: cases.male + ' (+ _%)', inline: true},
					{ name : '♀ Femmes', value: cases.female + ' (+ _%)', inline: true},
					{ name : 'Hospitalisations', value: cases.hospits},
					{ name : 'Décès', value: 'N/A', inline:true },
				)
				.setTimestamp()
				.setFooter('Source : Santé publique France, Données actualisées :', 'attachment://marianne.png');
			message.channel.send(embedMsg);

		} else {
			return message.channel.send('Veuillez inscrire une région valide ❗');
		}
    }



})

/**
 * Gets CSV datas depending on date variable
 * 
 * TODO : Date de passage
 * @param {String} selectedDate - date.now during the sending process
 */
function getCsv () {

	const results = [];
	let fileTitle = 'regions';
	fs.createReadStream('region.csv')
		.pipe(csv())
		.on('data', (row) => {
			if(row.date_de_passage == "2020-03-28") {
				results.push(row)
			}
		})
		.on('end', () => {
			console.log('OK');
			writeJson(results);
		});
	
	//setRegions();
	
};

/**
 * Gets CSV datas 'dep_april' depending on date variable
 * 
 * TODO : Date de passage
 */
function getCsvTwo () {

	const results = [];
	let fileTitle = 'departments';
	fs.createReadStream('datas/dep_april.csv')
		// ! - Specifiying separator ; to read the CSV properly
		.pipe(csv({separator: ';'}))
		.on('data', (row) => {
			if(row.jour == "2020-03-28") {
				results.push(row);
				console.log(row);
			}			
		})
		.on('end', () => {
			console.log('OK');
			writeJson(results, fileTitle);
		});
	
};

// Writes a Json file with CSV datas
function writeJson(results, fileTitle) {

	const jsonString = JSON.stringify(results);

	fs.writeFile('datas/'+ fileTitle + '.json', jsonString, err => {
		if (err) {
			console.log('Error writing file', err)
		} else {
			console.log('Successfully wrote file')
		}
	})

};


// Gets now date
function getDate () {

	var now = new Date();
	//var dateFormat = now.toISOString().split("T")[0];
	var dateFormat = now.toLocaleDateString('en-GB');
	return dateFormat;
};

// Gets region from any valid message and returns its unique region code
function getRegion(msgRegion) {

	let allRegions = setRegions();
	console.log(msgRegion);
	//console.log(allRegions);
	//let results = allRegions.filter(function(p) { return p.code > 1 })
	let aimedRegion = filterItems(allRegions, msgRegion);
	console.log(aimedRegion);

	/*return results.code;
	
	if(allRegions.includes(53)) {
		console.log('it works');
	}
	*/

	let regionCode = aimedRegion[0].code;
	return regionCode;
};

function filterItems(array, string) {
    return array.filter(o =>
        Object.keys(o).some(k => o[k].toLowerCase().includes(string.toLowerCase())));
}

/**
 * Reads the JSON file and gets its data
 * 
 * @param {String} - a unique regioncode
 */
function getDatasCases(region) {

	let regionCode = region;
	
	//let json = fs.readFileSync('regions.json', 'utf-8');
	let json = require(__dirname + '/regions_test.json');
	//let recRegion = json[0]; - to be deleted

	let recapRegion = json.filter(function(o){
		// Make sure to return the given region & first array of datas.
		return (o.reg === regionCode && o.sursaud_cl_age_corona === "0")
	});

	console.log('Aimed recap region');
	console.log(recapRegion);

	// Creates object with total cases, gender differences
	let cases = {
		"total": recapRegion[0].nbre_pass_tot,
		"male": recapRegion[0].nbre_pass_tot_h,
		"female": recapRegion[0].nbre_pass_tot_f,
		"hospits": recapRegion[0].nbre_hospit_corona
	};

	return cases;
};


// Gets every Departments code from a given region - wip
function getDepartmentsFromRegion(region) {

    const regions = [

        {code: '53', name: 'Bretagne', departments: [
            '29','35','56','22'
        ]},
        {code: '53', name: 'Occitanie', departments: [
            '78','10','26','33'
        ]},
        {code: '88', name: 'Loire', departments: [
            '51','21','74','66'
        ]}
    ];

    console.log(regions);

    let selectedRegion = regions.filter(function (region) { return region.name == "Loire" });
    console.log(selectedRegion[0].departments);

}


// Region departments setter from a Region Code.
function setDepartments(regionCode) {

	let departments = [];

	switch (regionCode) {
		case '53':
		  console.log('Set Bretagne');
		  departments = ['56', '29', '35', '22'];
		  break;
		// To be continued ...
		case '88':
			console.log('Set Loire');
		case '76':
		  console.log('Set Occitanie');
		  break;
		default:
		  console.log('Sorry, we couldnt find the region coded as ' + regionCode + '.');
	}
	
	return departments;
}

function filterRegionDepartments(departments) {

	//let departments = ['56', '29'];

	let json = require(__dirname + '/datas/departments.json');
	// Filter departments from JSON file, making sure it selects both genders.
	let filteredItems = json.filter( obj => departments.includes(obj.dep) && obj.sexe === '0');

	//console.log(filteredItems);
	return filteredItems;
}



// A list of regions of France with number codes from INSEE
function setRegions() {


	const regions = [
		{
			code: '1', 
			maj: 'GUADELOUPE', 
			regular: 'Guadeloupe',
		},	{	
			code: '2', 
			maj: 'MARTINIQUE', 
			regular: 'Martinique',
		},	{
			code: '3', 
			maj: 'GUYANE', 
			regular: 'Guyane'
		},	{
			code: '4', maj: 'LA REUNION', regular: 'La Réunion'
		},	{
			code: '6', 
			maj: 'MAYOTTE', 
			regular: 'Mayotte'
		},	{
			code: '11', 
			maj: 'ILE DE FRANCE', 
			regular: 'Ile-de-France'
		},	{
			code: '24', maj: 'CENTRE VAL DE LOIRE', regular: 'Centre-Val de Loire'
		},	{
			code: '27', 
			maj: 'BOURGOGNE FRANCHE COMTE', 
			regular: 'Bourgogne-Franche-Comté'
		},	{
			code: '28', 
			maj: 'NORMANDIE',
			regular: 'Normandie'
		},	{
			code: '32', 
			maj: 'HAUTS DE FRANCE',	
			regular: 'Hauts-de-France'
		},	{
			code: '44', 
			maj: 'GRAND EST', 
			regular :'Grand Est'
		},	{
			code: '52', 
			maj: 'PAYS DE LA LOIRE', 
			regular: 'Pays de la Loire'
		},	{
			code: '53', 
			maj: 'BRETAGNE', 
			regular: 'Bretagne'
		},	{
			code: '94', 
			maj: 'CORSE', 
			regular: 'Corse'
		},	{
			code: '76', 
			maj: 'OCCITANIE', 
			regular: 'Occitanie'
		},	{
			code: '84', 
			maj: 'AUVERGNE RHONE ALPES', 
			regular: 'Auvergne-Rhone-Alpes'
		},	{
			code: '93', 
			maj: 'PROVENCE ALPES COTE D AZUR', 
			regular: 'Provence-Alpes-Côte dAzur'
		}
			
	];
	/*
	const regions = [
		[1, 'GUADELOUPE','Guadeloupe'],	
		[2, 'MARTINIQUE','Martinique'],
		[3, 'GUYANE', 'Guyane'],
		[4, 'LA REUNION', 'La Réunion'],
		[6, 'MAYOTTE', 'Mayotte'],
		[11, 'ILE DE FRANCE', 'Ile-de-France'],	
		[24, 'CENTRE VAL DE LOIRE', 'Centre-Val de Loire'],
		[27, 'BOURGOGNE FRANCHE COMTE', 'Bourgogne-Franche-Comté'],
		[28, 'NORMANDIE', 'Normandie'],
		[32, 'HAUTS DE FRANCE',	'Hauts-de-France'],
		[44, 'GRAND EST', 'Grand Est'],
		[52, 'PAYS DE LA LOIRE', 'Pays de la Loire'],
		[53, 'BRETAGNE', 'Bretagne'],
		[75, 'NOUVELLE AQUITAINE', 'Nouvelle-Aquitaine'],
		[76, 'OCCITANIE', 'Occitanie'],
		[84, 'AUVERGNE RHONE ALPES', 'Auvergne-Rhone-Alpes'],
		[93, 'PROVENCE ALPES COTE D AZUR', 'Provence-Alpes-Côte dAzur'],
		[94, 'CORSE', 'Corse']
	];
	*/
	return regions;

}

async function getCountries () {
	let response;
	try {
		response = await axios.get('https://www.worldometers.info/coronavirus/');
		if (response.status !== 200) {
			console.log('Error', response.status);
		}
	} catch (err) {
		return null;
	}
	// get HTML and parse death rates
	const html = cheerio.load(response.data);
    const mainNbr = html('.maincounter-number');
	console.log(mainNbr.html());
};


client.login(token);