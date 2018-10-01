var mkdirp = require('mkdirp');
var firebase = require('firebase');
var config = require('./config.js');
const download = require('download');
const fs = require('fs');
var _ = require('lodash');

var args = process.argv.slice(2);
let command = args[0]

config.initDatabase();

/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
// Outils d'écriture et de creation de répértoires //
/////////////////////////////////////////////////////
/////////////////////////////////////////////////////

createDirectory = function (directory) {

    mkdirp(directory, function (err) {
        if (err) console.error('erreur inconnue à la création du répertoire')
        else console.log('Creation du répertoire :' + directory)
    });
}

writeJson = function (directory, json, zooName) {

    createDirectory(directory)

    let localJson = JSON.stringify(json, null, 2);

    fs.writeFile(directory + 'data.json', localJson, (err) => {
        if (err) throw err;
        console.log('Copie des données pour le zoo ' + zooName);
    });
}

downloadPhoto = function (url, path, fileName) {
    console.log('telechargement de ' + url)
    download(url).then(data => {
        fs.writeFileSync(path + fileName, data);
        console.log(url + ' téléchargement terminé')

    });
}

/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
///////////// Outils de synchro cloud ///////////////
/////////////////////////////////////////////////////
/////////////////////////////////////////////////////

startSync = function (command) {

    if(command === 'all') {
        var ref = firebase.database().ref();
        ref.once('value')
            .then(result => {
    
                let remoteData = result.val()
                parseJsonData(remoteData)
            })
    } else if (command === undefined) {
        console.log('Indiquer le zoo à synchroniser / All pour tout synchroniser')
        return
    } else {
        var ref = firebase.database().ref(command);
        ref.once('value')
            .then(result => {
    
                let remoteData = result.val()

                syncAssets(command, remoteData)
                
            })
    }
}

/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
/////////  Outils de parsing des données ////////////
/////////////////////////////////////////////////////
/////////////////////////////////////////////////////


parseJsonData = function (remoteData) {

    zooList = Object.keys(remoteData)

    for (let index = 0; index < zooList.length; index++) {

        let zooName = zooList[index]

        let zooData = {
            [zooName]: remoteData[zooName]
        }

        console.log(zooData)

        writeJson(zooName + '/', zooData, zooName)
        syncAssets(zooName, zooData[zooName])
    }
}

syncAssets = function (zooName, zooData) {
    syncAnimationsPhotos(zooData.animationsData, zooName)
    syncEventsPhotos(zooData.eventsData, zooName)
    syncServicesPhotos(zooData.servicesData, zooName)
    syncSpeciesPhotos(zooData.speciesData, zooName)
}


syncAnimationsPhotos = function (animationsData, zooName) {

    for (let index = 0; index < animationsData.length; index++) {
        let animation = animationsData[index]
        let fileName = 'photoprofil.jpg'
        let animationId = animationsData[index].animationId
        let path = zooName + '/Sources/Assets/animations/' + animationId + '/'

        createDirectory(path)
        downloadPhoto(animation.animationProfilePicture, path, fileName)

        if (_.has(animation, ['animationPhotos'])) {

            let photoList = animation.animationPhotos

            for (let index = 0; index < photoList.length; index++) {
                let photo = photoList[index]
                let fileName = 'photo' + index + '.jpg'
                let path = zooName + '/Sources/Assets/animations/' + animationId + '/Gallery/'
                createDirectory(path)
                downloadPhoto(animation.animationProfilePicture, path, fileName)
            }
        }
    }
}

syncEventsPhotos = function (eventsData, zooName) {


    for (let index = 0; index < eventsData.length; index++) {
        let event = eventsData[index]
        let eventId = eventsData[index].eventId
        let fileName = 'photoprofil.jpg'
        let path = zooName + '/Sources/Assets/events/' + eventId + '/'
        createDirectory(path)

        downloadPhoto(event.eventProfilePicture, path, fileName)

        if (_.has(event, ['eventPhotos'])) {

            let photoList = event.eventPhotos

            for (let index = 0; index < photoList.length; index++) {
                let photo = photoList[index].photoURL
                let fileName = 'photo' + index + '.jpg'
                let path = zooName + '/Sources/Assets/events/' + eventId + '/Gallery/'

                createDirectory(path)
                downloadPhoto(photo, path, fileName)
            }
        }
    }
}

syncServicesPhotos = function (servicesData, zooName) {

    for (let index = 0; index < servicesData.length; index++) {
        let service = servicesData[index]
        let fileName = 'photoprofil.jpg'
        let serviceId = servicesData[index].serviceId
        let path = zooName + '/Sources/Assets/services/' + serviceId + '/'

        createDirectory(path)
        downloadPhoto(service.serviceProfilePicture, path, fileName)


        if (_.has(service, ['servicePhotos'])) {

            let photoList = service.servicePhotos

            for (let index = 0; index < photoList.length; index++) {
                let photo = photoList[index].photoURL
                let fileName = 'photo' + index + '.jpg'
                let path = zooName + '/Sources/Assets/services/' + serviceId + '/Gallery/'
                createDirectory(path)
                downloadPhoto(photo, path, fileName)
            }
        }
    }
}

syncSpeciesPhotos = function (speciesData, zooName) {


    // téléchargement profile picture specie



    for (let index = 0; index < speciesData.length; index++) {
        let specie = speciesData[index]
        let specieId = specie.specieId
        let fileName = 'photoprofil.jpg'
        let path = zooName + '/Sources/Assets/species/' + specieId + '/'

        createDirectory(path)
        downloadPhoto(specie.specieProfilePicture, path, fileName)

        // Si animaux téléchargement de la photoprofil puis de la liste de photo

        if (_.has(specie, ['specieAnimals'])) {
            let animalList = specie.specieAnimals


            for (let index = 0; index < animalList.length; index++) {
                let animal = animalList[index]
                let animalId = animal.animalId
                let fileName = 'photoprofil.jpg'
                let path = zooName + '/Sources/Assets/species/' + specie.specieId + '/animals/' + animalId + '/'

                createDirectory(path)
                downloadPhoto(animal.animalPhotoProfil, path, fileName)

                if (_.has(animal, ['animalPhotos'])) {
                    let animalPhotos = animal.animalPhotos

                    for (let index = 0; index < animalPhotos.length; index++) {
                        let animalPhoto = animalPhotos[index].photoURL
                        let fileName = 'photo' + index + '.jpg'
                        let path = zooName + '/Sources/Assets/species/' + specie.specieId + '/animals/' + animalId + '/Gallery/'
                        createDirectory(path)
                        downloadPhoto(animalPhoto, path, fileName)
                    }
                }
            }
        }

        if (_.has(specie, ['speciePhotos'])) {

            let speciePhotosList = specie.speciePhotos

            for (let index = 0; index < speciePhotosList.length; index++) {
                let speciePhoto = speciePhotosList[index].photoURL
                console.log(speciePhoto)
                let fileName = 'photo' + index + '.jpg'
                let path = zooName + '/Sources/Assets/species/' + specieId + '/Gallery/'
                createDirectory(path)
                downloadPhoto(speciePhoto, path, fileName)
            }
        }
    }
    return
}


startSync(command)
