// To handle all the cloud-related work 

angular.module('CloudCtrl', []).controller('CloudController', function($scope) {
	$scope.tagline = 'The is for cloud';
});

//#################################################### Get apis oauth here. First load dropbox then google
// api client instantiation
var dbClient = null
var gdClient = null // the client of google drive is gapi. To maintain the consistence among other clouds, we still assign gapi to a variable = false

//--------------------------------Dropbox APIs information
//Documentation: https://github.com/dropbox/dropbox-js
//To be more specific: https://github.com/dropbox/dropbox-js/blob/stable/guides/getting_started.md
var dropboxAPIKey = 'r2k206ydj5s5kv1';
var dropBoxClient = new Dropbox.Client({ key: dropboxAPIKey });

//Load DROPBOX OAUTH
dropBoxClient.authenticate(function(error,client){
	if(error) {
		console.log(error);
		return error;
	}	
	console.log('Dropbox is authorized successfully:', client);

	// assign value
	dbClient = new DbClient(client);		
		
	// Example with Dropbox. Get user information
	dbClient.getAccountInfo(function(accountInfo){
		console.log("Dropbox account info", accountInfo)
		console.log("Hello dropbox user, " + accountInfo.name + "!");
	});
		
	//LOAD GOOGLE DRIVE OAUTH
	handleGoogleClientLoad();
});

//----------------------------------Google APIs information
//https://developers.google.com/drive/v2/reference/
var CLIENT_ID = '102710631798-lb77ojeikkaa0dsjcuvq08igkd8llrjh.apps.googleusercontent.com';	//for johnny5550822
//var CLINET_ID = '900888398054.apps.googleusercontent.com';	//For labbook2013 account
var SCOPES = ['https://www.googleapis.com/auth/drive.install','https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/plus.login'];	//Different scope have different meaning, see https://developers.google.com/drive/scopes

/**
* Called when the client library is loaded to start the auth flow.
*/
function handleGoogleClientLoad() {
	//gapi.client.setApiKey(apiKey);
	window.setTimeout(checkAuth, 1000);	//e.g.500ms; remember to wait some time for the google script to load
}

/**
* Check if the current user has authorized the application.
*/
function checkAuth() {
	gapi.auth.authorize({
		'client_id': CLIENT_ID, 
		'scope': SCOPES, 
		'immediate': true
	}, handleAuthResult);	//immediate:true-->refresh the token without a popup
}

var getRootContent = function(file){
	dbClient.readDirContent('/' + file,function(files){
		if(files === null)
			dFile.push({original: file, id: "/" + file, name: file, size: "N/A", folder: "../img/checkbox.png", folder_image: "../img/file.png", folderDest: "../img/checkbox.png", select: false, selectDest: false, directory: false});

		else{
			dFile.push({original: file, id: "/" + file, name: file, size: "N/A", folder: "../img/checkbox.png", folder_image: "../img/folder.png", folderDest: "../img/checkbox.png", select: false, selectDest: false, directory: true, children: [], sibling: dFile});
			for(var i = 0; i < files.length; i++)
				getContent(dFile[dFile.length-1], '/' + file + '/' + files[i], files[i], dFile);
		}
					
		console.log("DFILE: ", file);
		dFile.sort(alphabeticizedSort);
		// dFile.sort(chronologicalSort);
	});
};

var getContent = function(parent, file, name, p){
	dbClient.readDirContent(file, function(files){
		if(files === null)
			parent.children.push({original: name, id: file, name: name, size: "N/A", folder: "../img/checkbox.png", folder_image: "../img/file.png", folderDest: "../img/checkbox.png", select: false, selectDest: false, directory: false, parent: p, mother: parent});

		else{
			parent.children.push({original: name, id: file, name: name, size: "N/A", folder: "../img/checkbox.png", folder_image: "../img/folder.png", folderDest: "../img/checkbox.png", select: false, selectDest: false, directory: true, children: [], sibling: parent.children, parent: p, mother: parent});
			for(var i = 0; i < files.length; i++)
				getContent(parent.children[parent.children.length-1], file + '/' + files[i], files[i], parent.children);
			console.log("GOTFILES: ", files);
		}
					
		console.log("DFILE: ", file);
		parent.children.sort(alphabeticizedSort);
		// parent.children.sort(chronologicalSort);
		// parent.children.sort(fileSizeSort);
	});
};

/**
* Called when authorization server replies.
*/
function handleAuthResult(authResult) {
	if (authResult && !authResult.error) {
		console.log('Google drive client is authorized successfully', gapi)

		// load the particular drive api and then just into main application
		gapi.client.load('drive', 'v2', function(){
			//assign the drive api
			gdClient = new GdClient(gapi.client.drive)
			
			var googleFileDisplay = function(){
				gdClient.getAccountInfo(function(account){
					gdClient.retrieveChildrenFiles(account.rootFolderId,false,false,function(files){
						console.log("ALL FILES: ", files);
						for(var i = 0; i < files.length; i++){
							console.log("FILESIZE: ", files[i].size);

							var extension = "";
							if(!files[i].fileExtension){
								var exportLinks = files[i].exportLinks;
								for (var property in exportLinks) {				
									if (exportLinks.hasOwnProperty(property)) {
										switch (property){
										case "application/pdf":
											extension = ".pdf";
											break;
										case "application/rtf":
											extension = ".rtf";
											break;
										case "application/vnd.oasis.opendocument.text":
											extension = ".txt";
											break;
										case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
											extension = ".doc";
											break;
										case "text/html":
											extension = ".html";
											break;
										case "text/plain":
											extension = ".txt";
											break;
										case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
											extension = ".xlsx";
											break;
										case "application/x-vnd.oasis.opendocument.spreadsheet":
											extension = ".xlsx";
											break;
										case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
											extension = ".ppt";
											break;
										case "image/png":
											extension = ".png";
											break;
										case "image/jpeg":
											extension = ".jpeg";
											break;
										case "image/svg+xml":
											extension = ".xml";
											break;
										}
									}
								}
							}

							if(files[i].mimeType === "application/vnd.google-apps.folder"){
								gFile.push({original: files[i], id: files[i].id, name: files[i].title + extension, size: files[i].modifiedDate.split("T")[0] + "\n" + (Math.ceil(files[i].fileSize /= 1000000) || "N/A"), folder: "../img/checkbox.png", folder_image: "../img/folder.png", folderDest: "../img/checkbox.png", select: false, selectDest: false, directory: true, children: [], sibling: gFile});
								
								if(files[i].fileSize)
									gFile[gFile.length-1].size += " MB";
							}

							else{
								gFile.push({original: files[i], id: files[i].id, name: files[i].title  + extension, size: files[i].modifiedDate.split("T")[0] + "\n" + (Math.ceil(files[i].fileSize /= 1000000) || "N/A"), folder: "../img/checkbox.png", folder_image: "../img/file.png", folderDest: "../img/checkbox.png", select: false, selectDest: false, directory: false});
							
								if(files[i].fileSize)
									gFile[gFile.length-1].size += " MB";
							}
						}

						gFile.sort(alphabeticizedSort);
						// gFile.sort(chronologicalSort);
						// gFile.sort(fileSizeSort);
						console.log("GFILE: ", gFile);

						for(var x = 0; x < gFile.length; x++){
							if(gFile[x].directory){
								gdClient.retrieveChildrenFiles(gFile[x].id,false,false,function(files, fileId){
									var cur = -1;
									for(var i = 0; i < gFile.length; i++){
										if(gFile[i].id === fileId){
											cur = i;
											break;
										}
									}

									for(var i = 0; i < files.length; i++){
										var extension = "";
										if(!files[i].fileExtension){
											var exportLinks = files[i].exportLinks;
											for (var property in exportLinks) {				
												if (exportLinks.hasOwnProperty(property)) {
													switch (property){
													case "application/pdf":
														extension = ".pdf";
														break;
													case "application/rtf":
														extension = ".rtf";
														break;
													case "application/vnd.oasis.opendocument.text":
														extension = ".txt";
														break;
													case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
														extension = ".doc";
														break;
													case "text/html":
														extension = ".html";
														break;
													case "text/plain":
														extension = ".txt";
														break;
													case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
														extension = ".xlsx";
														break;
													case "application/x-vnd.oasis.opendocument.spreadsheet":
														extension = ".xlsx";
														break;
													case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
														extension = ".ppt";
														break;
													case "image/png":
														extension = ".png";
														break;
													case "image/jpeg":
														extension = ".jpeg";
														break;
													case "image/svg+xml":
														extension = ".xml";
														break;
													}
												}
											}
										}

										if(files[i].mimeType === "application/vnd.google-apps.folder"){
											gFile[cur].children.push({original: files[i], id: files[i].id, name: files[i].title + extension, size: files[i].modifiedDate.split("T")[0] + "\n" + (Math.ceil(files[i].fileSize /= 1000000) || "N/A"), folder: "../img/checkbox.png", folderDest: "../img/checkbox.png", folder_image: "../img/folder.png", select: false, selectDest: false, directory: true, children: [], parent: gFile, sibling: gFile[cur].children, mother: gFile[cur]});
										
											if(files[i].fileSize)
												gFile[cur].children[gFile[cur].children.length-1].size += " MB";
										}
											
										else{
											gFile[cur].children.push({original: files[i], id: files[i].id, name: files[i].title  + extension, size: files[i].modifiedDate.split("T")[0] + "\n" + (Math.ceil(files[i].fileSize /= 1000000) || "N/A"), folder: "../img/checkbox.png", folderDest: "../img/checkbox.png", folder_image: "../img/file.png", select: false, selectDest: false, directory: false, parent: gFile, mother: gFile[cur]});
										
											if(files[i].fileSize)
												gFile[cur].children[gFile[cur].children.length-1].size += " MB";
										}
									}

									gFile[cur].children.sort(alphabeticizedSort);
									// gFile[cur].children.sort(chronologicalSort);
									// gFile[cur].children.sort(fileSizeSort);

									// gFile[cur].children[0].parent = gFile.slice();
									console.log("GFILE CHILDREN: ", gFile[cur].children);
								});	
							}
						}	

					});
				});
			};

			var dropboxFileDisplay = function(){
				dbClient.readDirContent('/',function(files){
					for(var i = 0; i < files.length; i++)
						getRootContent(files[i]);

					console.log("DFILE: ", files);
				});	
			};

			googleFileDisplay();
			dropboxFileDisplay();

			

			gdClient.getAccountInfo(function(account){
				console.log('handleGoogleClientLoad gDrive user:',account.name)
				console.log('THe root folderId is:', account.rootFolderId)
				
				// jump into drive test
				// dropboxTests()
				// gDriveTests()

			})

		});
	} else {
		console.log("Fail to do google drive client oauth");
	}
}

// ################################################################################################
// main loop: once the oauth is done you can do whatever you want here for google drive, dropobx, or etc
// You may have to re-do oauth from time to time: ignore at this stage - 111415
// ################################################################################################

/**
* Once the authis good, then load the api and do something.
* You can treat this as a test
*/
function gDriveTests(){
		//--------------------------- google drive
		//console.log(gdClient)
		var rootFolderId = '0AN9TACL_6_flUk9PVA'

		
		// receive all file and folder from root 
		gdClient.retrieveChildrenFiles(rootFolderId,false,false,function(files){
			console.log('----gDrive TEST:retreive files from google drive:', files)
		})

		// Rename
		fileID = "0B99TACL_6_flYW9XTGhVUTJuZFU"
		newTitle = 'mii.pdf'
		gdClient.rename(fileID, newTitle,function(file){
			console.log('----gDrive TEST:rename:', file)
		})

		/*
		// get a file meta
		gdClient.getItemMeta(rootFolderId,function(meta){
			console.log('----gDrive TEST: get root folder meta data',meta)
		})

		// Create a google doc and then remove it
		folderId = rootFolderId
		title = 'Testing'
		mimeType = 'application/vnd.google-apps.document'
		gdClient.createGFile(folderId,title,mimeType,function(resp,result){
			console.log('----gDrive TEST: Create a new google item in root folder', result)

			// delete it then
			gdClient.deleteItem(result.id,function(resp,result){
				console.log('----gDrive TEST: remove an item {0}'.f(result))
			})
		})
		*/

		// Create a Folder in a destination id
		// projects 
		/*title = 'testFolder'
		destFolderId = "0B99TACL_6_flMmYxN2YyMjRTMGs"
		console.log('-------TEST: create a folder in google drive')
		gdClient.createFolder(destFolderId,title,function(){

		})
		*/

		/*
		// Copy/move a file from google drive to dropbox
		// 112215: more complicated to do this cause there are manay different data type in google drive and the way to download them is a bit different
		// File "TobeRemoved.txt" in google drive: "0B99TACL_6_flODJOdThkcnJOM2c"
		// File "xxx.exe" in google drive: 0B99TACL_6_flYlZKZGVuNVZJVTA
		// File "xxxx.pdf" "0B99TACL_6_flYW9XTGhVUTJuZFU"
		// A google doc "15tyK4ZMCK4s3giD6OtxdQPdcOwXkBJBxBiEv0ewAHw4"
		fileId = "0B99TACL_6_flODJOdThkcnJOM2c"
		console.log('----TEST: copying/moving a file from google drive to dropbox')
		destination = '/' // destination of the file
		options = {noOverwrite: true}
		isCopy = true
		gdClient.aFileToDropbox(fileId, dbClient, destination, options, isCopy, function(){

		})
		*/
		
}

/**
* Once the authis good, then load the api and do something.
* You can treat this as a test
*/
function dropboxTests(){
		//--------------------------- Dropbox
		console.log('Test Dropbox......')

		
		// // Load a directory content
		// dbClient.readDirContent('/Apps',function(result){
		// 	console.log('----dropbox TEST: read a directory', result)

		// })

		//Read a file content
		/*
		dbClient.readAFile('gitignore.txt', function(result){
			console.log('----dropbox TEST: read a file content', result)
		})
		*/

		// rename
		/*
		filePath = '/testing/b.pdf';
		newFilePath = '/testing/d.pdf';
		dbClient.rename(filePath, newFilePath, function(resp){
			console.log('----dropbox TEST: rename',resp)
		})
		*/

		/*
		// Create download link for an item
		filePath = 'gitignore.txt'
		options = {download:true} // download link instead of preview
		dbClient.getDownloadLink(filePath, options, function(result){
			console.log('----dropbox TEST: create download link for an item', result)
		})

		// identity all the files and folder in dropbox recursively
		cPos = 0
		fileList = ['/']
		fileIsFolderList = [1]
		dbClient.readDirAllContent(cPos,fileList,fileIsFolderList, function(fileList, fileIsFolderList){
			console.log('----dropbox TEST: obtain all the files and folder in dropbox', fileList, fileIsFolderList)
		})
		*/

		// upload something to the file
		/*
		destination = '/testDb.txt'
		options = {noOverwrite: true}
		data = 'dddd'
		dbClient.upload(destination,data,options,function(){
			console.log('----Dropbox test: upload an item')
		})
		*/

		
		// upload a file to a google drive destination from dropbox
		// TEST: elab's folder in gDrive: "0B99TACL_6_flb2EwbnhiLUVNdEE"
		path = '/'
		fileName = 'dumb.js';
		// fileName = 'gitignore.txt'
		destFolderId = "0B99TACL_6_flb2EwbnhiLUVNdEE"
		gClient = gdClient
		isCopy = true

		console.log('----dropbox TEST: upload a file to google drive.')
		console.log('Moving/Copying a file from dropbox to gooogle drive.......')
		dbClient.aFileToGDrive(path,fileName,destFolderId, gClient, isCopy, function(){
		})
		

		/*
		// Create a folder
		destFolderId = '/testing/testings/'
		dbClient.mkdir(destFolderId,function(resp){
			console.log('------dropbox TEST: Create a folder!',resp)
		})
		*/
}


