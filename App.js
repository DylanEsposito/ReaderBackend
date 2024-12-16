/*const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON bodies

// Sample API endpoint
app.get('/api/message', (req, res) => {
  res.json({ message: 'Hello from Express server!' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
*/

const express = require('express');
const app = express();
const cors = require('cors');

//Idnetifying 
app.use(express.static('public'));
app.use(express.static('images'));
app.use(express.static('uploads'));
app.use(cors());
app.use(express.json());

const fs = require('fs');
const path = require('path');

//Dom and streamzip
const {DOMParser} = require('xmldom');
const StreamZip = require('node-stream-zip');
const { create } = require('domain');

var absolutePath = path.resolve(".");

console.log(absolutePath);

/*const zip = new StreamZip({
    file: 'books/Frankenstein/Frankenstein.epub',
});*/

var page = {
    type : 'text',
    content : '',
    chp_id : ""
}

var chapter = {
    chp_id : "",
    pages : []
}

var book = {
    id: "",
    title: "",
    author: "",
    cover: "",
    chapters : []
}

function write_to_file(filename, content) {
    fs.writeFileSync(filename, content);
}

//Reader the book json file and create an array with the information
function read_book_json(filename){
    const data = JSON.parse(filename);
    console.log(data.length);
}

const chunkSize = 800;
var pages = [];
var myOtherStuff = [];

function createPages(fullString){
    for(let i = 0; i < fullString.length; i += chunkSize){
        myOtherStuff.push(fullString.substring(i, i + chunkSize));
    }
    console.log(myOtherStuff);
}

//
function createPagesTwo(paras){
    console.log(paras);
    const words = paras.split('</p>');
    //console.log(words);

    /*const str = "<p>Hello</p> World";
    const test = str.split("</p>"); // Split by space'
    
    console.log(test); // Output: ["Hello,", "World!"]*/
}

var htmlInfo = '';
var chapterDiv = '';

var chapters = [];
var cover = [];

//To understand
//1) Way to identify if application/epub+zip -> done through mimetype, very first file in zip
//2) Should figure out to open an epub file manually -> Done, just unzip it. Can reference file structure that way
//3)

//DEE Variables for tracking location
let currentBook = 0;
//DEE Pass in books.json so we can provide information to the user library
const Library = require("./books/books.json");
const { table, Console } = require('console');
var libraryToPass = [];

function createLibrary(){
    for(let q = 0; q < Library.data.length; q++){
        //console.log(Library.data[q]);
        const bookEntry = {
            book_id : Library.data[q].book_id,
            name : Library.data[q].name,
            author : Library.data[q].author,
            chapters : [],
            last_page : 0
        }
        libraryToPass.push(bookEntry);
    }
    console.log(libraryToPass);
}
createLibrary();

const currentBookInfo = {
    book_id : 0,
    listOfChapters : [],
    lastPage : 0
}

function ExtractBook(pGivenId){
    console.log("In the extract book section");
    console.log(pGivenId);
    console.log("The given length of the library is " + Library.data.length);

    if(pGivenId > Library.data.length - 1){
        console.log("Too long");
    }

    console.log("Trying to read " + Library.data[pGivenId].name);
    
    const tempZip = new StreamZip({
        file: Library.data[pGivenId].source_path,
    });

    //const data = tempZip.entryData('OEBPS/content.opf');

    //Order
    //First verify we have a book using the mimetype
    //Second retrieve cover and store it into extracted
    //Third retrieve the table of contents to allows us to skip around to chapters, do not have that be a page
    // We could blacklist the table of contents page from being added to the book
    //Fourth retrieve the content from each of the xhtml pages, split up by chapter

    tempZip.on('ready', () => {
        const mimeType = tempZip.entryDataSync('mimetype');
        const document = new DOMParser().parseFromString(mimeType.toString(), "application/xhtml+xml");
        //console.log(document.toString());

        if(document.toString() === 'application/epub+zip'){
            console.log("Epub is valid")
        }else{
            console.log("Epub is not valid");
            tempZip.close();
            return;
        }
    });

    //Alright we can prgoress set currentBookInfo to a new id
    currentBookInfo.book_id = pGivenId;
    currentBookInfo.listOfChapters = [];
    currentBookInfo.lastPage = libraryToPass[pGivenId].last_page;

    let coverName = '';
    //Now retrieve the cover 
    tempZip.on('ready', () => {
        const contentOPF = tempZip.entryDataSync('OEBPS/content.opf');
        const xmlDoc = new DOMParser().parseFromString(contentOPF.toString(), "application/xhtml+xml");
        
        const coverImage = xmlDoc.getElementById("item1");
        //console.log(coverImage.attributes[0].nodeValue); 
        let coverName = coverImage.attributes[0].nodeValue;
        coverName = 'OEBPS/' + coverName;
        //console.log(coverName);
    });

    //Now extract cover to backend
    tempZip.extract(coverName, './extracted', err => {
        console.log(err ? 'Extract error' : 'Extracted');
    });

    let section = {
        id : '',
        conent : ''
    }

    //We'll need the ids to determine which section we're in
    //We'll need the chap names 
    const tableOfChapters = {
        listOfIds : [],
        listOfChapNames : []
    }
    
    //Now retrieve table of contents and their ahref links
    tempZip.on('ready', ()=> {
        
        const toc = tempZip.entryDataSync('OEBPS/toc.xhtml');       
        
        //Retrieves full a tag with inner text
        const chapterNames = toc.toString().match(/<a[^>]*>(.*?)<\/a>/gi);

        //Retrieves just a tag inner attributes
        const anchorTags = toc.toString().match(/<a[^>]+href="([^"]+)"/g);
        //console.log(anchorTags.length);

        for(let j = 0; j < chapterNames.length; j++){

            let chapter = {
                chapter_id: '',
                chapter_name : '',
                chapter_pages: []
            }
            let chpTag = chapterNames[j].split(">");
            let chpTagTwo = chpTag[1].split("<");
            //console.log(chpTagTwo[0])
            
            let removeQuotes = chpTagTwo[0].replace(/['"]/g,'');

            let idTag = anchorTags[j].split("#");
            let noQuotes = idTag[1].replace(/['"]/g,'');

            tableOfChapters.listOfIds[j] = JSON.stringify(noQuotes);
            tableOfChapters.listOfChapNames[j] = removeQuotes;

            chapter.chapter_id = noQuotes;
            chapter.chapter_name = removeQuotes;

            currentBookInfo.listOfChapters.push(chapter);
        }  
        
        //console.log(currentBookInfo);
        
        //console.log(tableOfChapters.listOfIds.length);
        console.log(tableOfChapters.listOfChapNames);
    });

    //console.log(tableOfContents.listOfContent.length);

    //Now retrieve all of the html pages
    tempZip.on('ready', () => {

        let i = 0;
        //console.log('Entries to read: ' + tempZip.entriesCount);
        for (const entry of Object.values(tempZip.entries())) {
            //console.log("The current entry's name is " + entry.name);
            if(entry.name.endsWith('htm.xhtml')){
                //console.log("The current entry's name is " + entry.name);
                const data = tempZip.entryDataSync(entry);
                const currentFile = new DOMParser().parseFromString(data.toString(), "application/xhtml+xml");
                
                //console.log(listOfIds.toString());
                //console.log(currentBook.listOfChapters[0].chapter_id);
                let nextChapter = currentBookInfo.listOfChapters[i];
                let currChap_id = currentBookInfo.listOfChapters[i].chapter_id;

                for(let j = 0; j < currentBookInfo.listOfChapters.length; j++){
                    let currChapterId = currentBookInfo.listOfChapters[j].chapter_id;
                    //DEE Big issue, cannot continutally search like this, will add a lot of time
                    let recoveredInfo = currentFile.getElementById(
                        currChapterId.toString());
                    //console.log(recoveredInfo);
                    if(recoveredInfo !== null){
                        //console.log("Found id for " + currentBookInfo.listOfChapters[j].chapter_id);
                        let page = {
                            type : 'paragraph',
                            content : recoveredInfo.toString(),
                        }
                        //console.log(recoveredInfo.toString());
                        
                        currentBookInfo.listOfChapters[j].chapter_pages.push(page);
                    }
                }
                i = i + 1;
            }
        }

        //console.log(currentBookInfo);

        /*
        for (const entry of Object.values(tempZip.entries())) {
            //console.log("The current entry's name is " + entry.name);
            if(entry.name.endsWith('htm.xhtml')){
                const data = tempZip.entryDataSync(entry);

                const document = new DOMParser().parseFromString(data.toString(), "application/xhtml+xml");
                //chapterDiv = doc.getElementsByClassName('chapter');

                //Creating a file full of the chapter object
                let currChap = document.getElementsByClassName('chapter');
                
                let chapterName = document.getElementsByTagName('h2');

                //Automatically separated because of p tag
                const paragraphs = document.getElementsByTagName('p'); 

                if(entry.name.endsWith('h-2.htm.xhtml')){
                    write_to_file('fullChapter.txt', currChap.toString());
                    write_to_file('onlyParagraphs.txt', paragraphs.toString());
                }
                
                //Data pulled as to be converted to a string in order to retain html
                //createPages(currChap.toString());
                var myEntry = {
                    type : 'paragraph',
                    content : currChap.toString(),
                    chap_name : chapterName,
                    chap_id : i
                }
                pages.push(myEntry);
            }
        }*/
        console.log("All finished going through the book");
    });

    //Test - Grab table of contents
    /*tempZip.on('ready', () => {
        const contentOPF = tempZip.entryDataSync('OEBPS/content.opf');
        console.log(contentOPF.toString());
    });

    const tocHTML = tempZip.entryDataSync('OEBPS/toc.xhtml.opf');
        console.log()

    /*
    tempZip.on('ready', () => {
        console.log('Entries to read: ' + tempZip.entriesCount);
        
        
        var i = 0;

        //Empty pages array
        pages = [];

        //Can I retrieve a specific file first?
        
        //Locate content.opf
        for(const entry of Object.values(tempZip.entries())){
            if(entry.name.endsWith('opf')){
                const data = tempZip.entryDataSync(entry);
                //console.log(data);
                const xmlDoc = new DOMParser().parseFromString(data.toString(), "application/xml");
            
                const manifest = xmlDoc.getElementsByTagName('manifest');

                const pageHeader = xmlDoc.getElementById('pg-header');

                console.log(manifest.toString());
            }
        }

        for (const entry of Object.values(tempZip.entries())) {
            console.log("The current entry's name is " + entry.name);
            if(entry.name.endsWith('htm.xhtml')){
                const data = tempZip.entryDataSync(entry);

                const document = new DOMParser().parseFromString(data.toString(), "application/xhtml+xml");
                //chapterDiv = doc.getElementsByClassName('chapter');

                let tableOfConents = document.getElementsByClassName("pginternal");

                if(tableOfConents !== undefined){
                    console.log("Found table of contents");
                    console.log("The current entry's name is " + entry.name);
                }

                //Creating a file full of the chapter object
                let currChap = document.getElementsByClassName('chapter');
                
                let chapterLink = document.getElementsByTagName('a');
                //console.log(chapterLink.toString());
                let chapterName = document.getElementsByTagName('h2');

                //Automatically separated because of p tag
                const paragraphs = document.getElementsByTagName('p'); 

                //console.log(paragraphs[4].toString());
                //for(let j = 0; j < paragraphs.length; j++){
                //    console.log(paragraphs[4]);
                //}
                //createPagesTwo(paragraphs.toString());

                if(entry.name.endsWith('h-2.htm.xhtml')){
                    write_to_file('fullChapter.txt', currChap.toString());
                    write_to_file('onlyParagraphs.txt', paragraphs.toString());
                }
                
                //chapters.push(currChap);
                
                //Data pulled as to be converted to a string in order to retain html
                //createPages(currChap.toString());
                var myEntry = {
                    type : 'paragraph',
                    content : currChap.toString(),
                    chap_name : chapterName,
                    chap_id : i
                }
                pages.push(myEntry);
            }
        }
        console.log("All finished going through the book");
    });*/
    currentBook = pGivenId;
}

//Automatically extracts the book
ExtractBook(0);

app.get('/', function(req, res){
    console.log("Hello world");
    //res.send('Hello world!');
   //res.send("Hello world");
   //res.send(chapterDiv[0].textContent);
   //Data pulled as to be converted to a string in order to retain html
   //res.send(chapterDiv[0].toString());
   //res.send('<h1> Hello world </h1>')
   //res.sendFile(htmlInfo);
});

app.post('/books/newbook', (req,res) => {
    const givenNumber = Number(req.body.number);
    if (givenNumber === null){
        console.log("No number given");
    }
    console.log("Received request for book with id of " + req.body.number.toString());
    console.log(givenNumber);
    if(givenNumber !== currentBook){
        ExtractBook(givenNumber);
    }
    let response = "All set";
    res.setHeader("Content-Type", "text/html");
    res.send(JSON.stringify(response));
});

app.get('/books/lastpage', (req,res) => {
  
    let response = "";
    res.setHeader("Content-Type", "text/html");
    let lastPage = currentBookInfo.lastPage;
    console.log("Last Page method: This is the last page saved " + lastPage);
    if(currentBookInfo.listOfChapters.length > 0){
        response = currentBookInfo.listOfChapters[lastPage].chapter_pages[0];
    }else{
        console.log("number of chapters is about zero")
        response = "";
    }
    
    console.log("The current page we're at is" + lastPage);
    res.send(JSON.stringify(response));
});

app.get('/books/library', (req, res) => {
    console.log("Received request for library books");
    res.json(libraryToPass);
});

app.get('/api/message', (req, res) => {
    console.log("Got mesasage request")
    res.json({message:'Hello friend from the server!'});
});

//DEE Have previouspage, nextpage, jumpage use this method to determine which content to return
function retrievePageConent(pageNumber){

    let contentToReturn = '';

    if(pages[pageNumber] === undefined){
        console.log("Page is empty");
        contentToReturn = JSON.stringify("");
        return contentToReturn;
    }
    else if(pages[pageNumber].type == 'image'){
        console.log("Have to return an image name " + pages[pageNumber].content.toString());
        //res.end(pages[pageNumber].content, 'binary');
        contentToReturn = JSON.stringify("");
        return contentToReturn;
    }else{
        let response = pages[pageNumber].content;

        if(response === undefined){
            console.log("Page is missing");
            res.send(JSON.stringify(""));
        }else{
            libraryToPass[currentBook].last_page = pageNumber;
            res.send(JSON.stringify(response));
        }
    }
}

/*
* Responsibilities:
* Verify the new page has any content, if not return an empty string
* Retrieve the next page, 
* After retrieving new page, save the index to Library object's last_page variable
*/
app.get('/api/nextpage', (req, res) => {

    res.setHeader("Content-Type", "text/html");
    let newPage = currentBookInfo.lastPage;
    console.log(newPage);
    if(newPage >= currentBookInfo.listOfChapters.length - 1){
        newPage = currentBookInfo.listOfChapters.length - 1;
    }else{
        newPage = newPage + 1;
        console.log("This is the current page " + newPage);
    }
    
    //Eventually have to locate the last page in the chapter pages, will have to redo this logic
    if(currentBookInfo.listOfChapters[newPage].chapter_pages !== 'undefined' 
        || currentBookInfo.listOfChapters[newPage].chapter_pages !== null){
        let response = currentBookInfo.listOfChapters[newPage].chapter_pages[0];
        currentBookInfo.lastPage = newPage;
        libraryToPass[currentBookInfo.book_id].last_page = newPage;
        res.send(JSON.stringify(response));
    }else{
        res.send(JSON.stringify(""));
    }
    /*
    console.log("Next page request");
    currentPage = libraryToPass[currentBook].last_page;
    if(pages.length < 1){
        console.log("Pages is empty");
        res.send(JSON.stringify(""));
        return;
    }
    
    if(currentPage > pages.length - 1){
        currentPage = pages.length - 1;
    }else{
        currentPage = currentPage + 1;
        console.log("This is the current page " + currentPage);
    }
    
    res.setHeader("Content-Type", "text/html");

    if(currentBookInfo.listOfChapters[currentPage].page[0] === undefined){
        console.log("Page is empty");
        res.send(JSON.stringify(""));
    }
    else if(pages[currentPage].type == 'image'){
        console.log("Have to return an image name " + pages[currentPage].content.toString());
        //res.sendFile(pages[currentPage].content.toString());
       
        res.end(pages[currentPage].content, 'binary');
    }else{
        console.log(pages[currentPage].type);
        //let response = pages[currentPage].content;
        let response = currentBookInfo.listOfChapters[currentPage].page[0].toString();

        if(response === undefined){
            console.log("Page is missing");
            res.send(JSON.stringify(""));
        }else{
            libraryToPass[currentBook].last_page = currentPage;
            console.log("The current page we're at is" + currentPage);
            res.send(JSON.stringify(response));
            //res.send(JSON.stringify(response));
            //res.json({message:'Hello friend from the server!'});
        }
        
    }*/
})

app.get('/api/previouspage', (req, res) => {
    console.log("Previous page request");
    
    let newPage = currentBookInfo.lastPage;
    console.log(newPage);
    if(newPage < 1){
        newPage = 0;
    }else{
        newPage = newPage - 1;
    }
    res.setHeader("Content-Type", "text/html");

    if(currentBookInfo.listOfChapters[newPage].chapter_pages[0] != 'undefined'){
        let response = currentBookInfo.listOfChapters[newPage].chapter_pages[0];
        //DEE Simplify down and only store in one page
        currentBookInfo.lastPage = newPage;
        libraryToPass[currentBookInfo.book_id].last_page = newPage;
        res.send(JSON.stringify(response));
    }else{
        res.send(JSON.stringify(""));
    }

    /*if(currentBookInfo.listOfChapters[currentPage].page[0] === undefined){
        console.log("Page is empty");
        res.send(JSON.stringify(""));
    }
    else if(pages[currentPage].type == 'image'){
        console.log("Have to return an image name " + pages[currentPage].content.toString());
        res.sendFile(pages[currentPage].content.toString());
    }else{
        console.log(pages[currentPage].type);
        //let response = pages[currentPage].content.toString();
        let response = currentBookInfo.listOfChapters[currentPage].page[0].toString();

        console.log("The current page we're at is" + currentPage);
        libraryToPass[currentBook].last_page = currentPage;
        res.send(JSON.stringify(response));
    }*/
})

//DEEM Edge cases to consider, will have to consider white space, invalid numbers, and string values with quotes
app.post('/api/jumppage', (req, res)=>{
    //let response = pages[currentPage].toString();
    console.log(req.body);
    const givenNumber = Number(req.body.number);
    console.log(`Received the number of ${givenNumber}`);

    let targetPage = currentBookInfo.lastPage;

    console.log(`Current page is ` + targetPage);

    if(targetPage < 1 || targetPage > currentBookInfo.listOfChapters.length -1){
        targetPage = 0;
    }
    
    if(givenNumber > -1 && givenNumber < currentBookInfo.listOfChapters.length -1){
        targetPage = givenNumber;
        console.log("Our number falls within range " + givenNumber);
    }

    if(currentBookInfo.listOfChapters[targetPage].chapter_pages !== 'undefined' 
        || currentBookInfo.listOfChapters[targetPage].chapter_pages !== null){
        let response = currentBookInfo.listOfChapters[targetPage].chapter_pages[0];
        //DEE Simplify down and only store in one page
        currentBookInfo.lastPage = targetPage;
        libraryToPass[currentBookInfo.book_id].last_page = targetPage;
        res.send(JSON.stringify(response));
    }else{
        res.send(JSON.stringify(""));
    }
});

app.get('/api/image', (req, res) => {
    const imagePath = path.join(__dirname, 'images', 'your-image.jpg'); // Replace 'your-image.jpg' with the actual image file name
    const image = fs.readFileSync(imagePath);
  
    res.writeHead(200, {
      'Content-Type': 'image/jpeg' // Adjust the Content-Type based on the image type
    });
    res.end(image, 'binary');
  });

app.listen(3088);

/*app.get('/', function(request, response){
    response.sendFile('absolutePathToYour/htmlPage.html');
});*/