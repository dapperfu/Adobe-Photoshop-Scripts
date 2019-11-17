var runphotomergeFromScript = true; // must be before Photomerge include
var loadLayersFromScript = true; // must be before Photomerge include
//@includepath "/Applications/Adobe Photoshop CS4/Presets/Scripts/"


// Set Options
var psdOpts = new PhotoshopSaveOptions();
psdOpts.embedColorProfile = true;
psdOpts.alphaChannels = true;
psdOpts.layers = true;

var jpegOptions = new JPEGSaveOptions();
jpegOptions.quality=12;
jpegOptions.scans=5;

var tiffOptions = new TiffSaveOptions();
tiffOptions.imageCompression=TIFFEncoding.JPEG;
tiffOptions.layers=false;
//

var workFolder = Folder.selectDialog();
parseFolder(workFolder);

function parseFolder(folder) {
	var folders = folder.getFiles( function( file ) { return file instanceof Folder; } );
	var jpg= folder.getFiles("*.jpg");
	var dng= folder.getFiles("*.dng");
	var files=jpg.concat(dng);

	// Recursively Parse Folders
	for(var i = 0; i < folders.length; i++ ) {
			if (folders[i].name!="merged") {
				parseFolder(folders[i]);
			}
	}

	// If there are files in each of the folders.
	if (files.length>0) {
		var normal=Array();
		var under=Array();
		var over=Array();
		var pano=Array();
		files.sort();
		for (var k=0;k<(files.length/3);k++) {
			normal[k]=files[3*k];
			under[k]=files[3*k+1];
			over[k]=files[3*k+2];
		}
		pano[0]=mergeImages(normal,"0");
		pano[1]=mergeImages(under,"-2");
		pano[2]=mergeImages(over,"+2");
		for (var l=0;l<pano[0].length;l++) {
			alignImages(Array(pano[0][l],pano[1][l],pano[2][l]));
		}
	}
}

function mergeImages(fList,exposure) {
	//@include "Photomerge.jsx"
	//var alignmentKeys=Array("Prsp","cylindrical","spherical","sceneCollage","translation");
	var ret=Array();
	var alignmentKeys=Array("cylindrical","translation");
	//var alignmentKeys=Array("cylindrical");
	for (var j=0; j< alignmentKeys.length; j++) {
		photomerge.alignmentKey=alignmentKeys[j];
		// other setting that may need to be changed. Defaults below
		photomerge.advancedBlending	= true; // 'Bend Images Together' checkbox in dialog
		photomerge.lensCorrection		 = true; // Geometric Distortion Correction'checkbox in dialog
		photomerge.removeVignette        = true; // 'Vignette Removal' checkbox in dialog
		photomerge.createPanorama(fList,false);
		mergedFolder=new Folder(fList[0].parent.parent+"/merged");
		if (!mergedFolder.exists) {
			mergedFolder.create();
		}
		//var outFileJPG=new File(fList[0].parent+"/"+alignmentKeys[j]+"_"+exposure+'.jpg') ;
		var outFileTIFF=new File(mergedFolder+"/"+fList[0].parent.name+"_"+alignmentKeys[j]+"_"+exposure+".tif") ;
		if (!outFileTIFF.parent.exists) {
				outFileTIFF.parent.create();
		}
		// Save Documents
		ret[j]=outFileTIFF;
		activeDocument.saveAs(outFileTIFF, tiffOptions, true, Extension.LOWERCASE);
		activeDocument.close( SaveOptions.DONOTSAVECHANGES );
	}
	return ret;
}

function alignImages(fList) {
		//@include "Load Files into Stack.jsx"
		loadLayers.intoStack(fList,true);
		exportChildren(activeDocument,fList[0].parent);
		activeDocument.close(SaveOptions.DONOTSAVECHANGES);
}

function exportChildren(orgObj,folder) {
	for( var i = 0; i < orgObj.layers.length; i++) {
		orgObj.layers[i].visible = true;
		var layerName = orgObj.layers[i].name;  // store layer name before change doc
		var duppedDocumentTmp = orgObj.duplicate();
		duppedDocumentTmp.flatten();
		var saveFile = new File(folder + "/" + layerName);
		duppedDocumentTmp.saveAs(saveFile, tiffOptions, true, Extension.LOWERCASE);
		duppedDocumentTmp.close(SaveOptions.DONOTSAVECHANGES);
		orgObj.layers[i].visible = false;
	}
}
