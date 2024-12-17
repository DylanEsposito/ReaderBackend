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

//DEE To remove
var page = {
    type : 'text',
    content : '',
    chp_id : ""
}
//DEE To remove
var chapter = {
    chp_id : "",
    pages : []
}
//DEE To remove
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

function write_to_json_file(filename, content){
    console.log("Writing to json file");
    //Want to pretty print the json so it is legible
    var json = JSON.stringify(content, null, 2);
    //console.log(json);
    fs.writeFile(filename, json, null, function(err) {
        if (err) throw err;
            console.log('complete');
        }
    );
}

//Reader the book json file and create an array with the information
function read_book_json(filename){
    const data = JSON.parse(filename);
    console.log(data.length);
}

const chunkSize = 5000;
var pages = [];
var myOtherStuff = {
    listOfPages: []
}

function createPages(fullString){
    //console.log("Trying to create pages");
    for(let i = 0; i < fullString.length; i += chunkSize){
        var page = [];
        myOtherStuff.listOfPages.push(fullString.substring(i, i + chunkSize));
    }
    console.log(myOtherStuff.listOfPages.length);
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

let numberOfPages = 0;

function createPagesThree(index, fullString){

    //currentBookInfo.listOfChapters[index].chapter_pages.push(fullString);
    //console.log("Trying to create pages");
    for(let i = 0; i < fullString.length; i += chunkSize){
        var page = [];
        //myOtherStuff.listOfPages.push(fullString.substring(i, i + chunkSize));
        currentBookInfo.listOfChapters[index].chapter_pages.push(
            fullString.substring(i, i + chunkSize));
        numberOfPages = numberOfPages + 1;
    }
    //.log(currentBookInfo.listOfChapters[index].chapter_pages.length);
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
//"./books/books.json"
const myLibrary = require("./books/books.json");
const { table, Console } = require('console');
var libraryToPass = [];
var libraryVersionTwo = {
    data : []
}
function createLibrary(){
    for(let q = 0; q < myLibrary.data.length; q++){
        //console.log(Library.data[q]);
        const bookEntry = {
            book_id : myLibrary.data[q].book_id,
            name : myLibrary.data[q].name,
            author : myLibrary.data[q].author,
            chapters : [],
            last_page : 0
        }
        libraryToPass.push(bookEntry);
    }
    //console.log(libraryToPass);
}

function createLibrayTwo(){
    for(let q = 0; q < myLibrary.data.length; q++){
        //console.log(Library.data[q]);
        const bookEntry = {
            book_id : myLibrary.data[q].book_id,
            name : myLibrary.data[q].name,
            author : myLibrary.data[q].author,
            chapters : [],
            last_page : 0
        }
        libraryVersionTwo.data.push(bookEntry);
    }
    console.log(libraryVersionTwo);
}

createLibrary();
createLibrayTwo();

const currentBookInfo = {
    book_id : 0,
    listOfChapters : [],
    totalPages : 0,
    lastPage : 0
}

function ExtractBook(pGivenId){
    console.log("In the extract book section");
    console.log(pGivenId);
    console.log("The given length of the library is " + myLibrary.data.length);

    console.log(myLibrary.data[pGivenId].last_page);
    console.log(myLibrary.data[pGivenId].subgenre);
    if(pGivenId > myLibrary.data.length - 1){
        console.log("Too long");
    }

    console.log("Trying to read " + myLibrary.data[pGivenId].name);
    
    const tempZip = new StreamZip({
        file: myLibrary.data[pGivenId].source_path,
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
    currentBookInfo.lastPage = myLibrary.data[pGivenId].last_page;
    currentBookInfo.lastChapterIndex = myLibrary.data[pGivenId].last_chapter;
    currentBookInfo.totalPages = 0;

    console.log("ExtractBook: Current last page and last chapter are " + 
        currentBookInfo.lastPage + currentBookInfo.lastChapterIndex);

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
        
        //console.log(tableOfChapters.listOfChapNames);
    });

    //Reset number of pages
    numberOfPages = 0;
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
                        //createPages(recoveredInfo.toString());
                        createPagesThree(j, recoveredInfo.toString());
                        //currentBookInfo.listOfChapters[j].chapter_pages.push(page);
                    }
                }
                i = i + 1;
            }
        }

        console.log("Total number of pages in book is " + numberOfPages);
        //write_to_json_file("testPages.json", currentBookInfo);
        console.log("All finished going through the book");
    });

    currentBook = pGivenId;
}

var bookTest = [];

function locatePage(pPage){
    console.log("Iterating through book " + currentBookInfo);
    console.log("The number of chapters is " + currentBookInfo.listOfChapters.length);
    let currPage = 0;
    for(let currChap = 0; currChap < currentBookInfo.listOfChapters.length; currChap++){
        console.log("Current chapter is " + currChap);
        for(let currChapIndex = 0; currChapIndex < currentBookInfo.listOfChapters[currChap].chapter_pages.length; currChapIndex++){
            console.log("The current page in the chapter is " + currChapIndex);
            currPage++;
            if(currPage === pPage){
                console.log("Found the page in chapter " + currChap + " and it's page of " + currChapIndex);
                break;
            }
        }
        if(currPage === pPage){
            break;
        }
        /*for(let currChapIndex = 0; currChapIndex < 
            currentBookInfo.listOfChapters[currChap].chapter_pages.length - 1; currChapIndex++){
                console.log("Current page is " + currPage);
                if(currPage === pPage){
                    console.log("Found page at " + currPage);
                }
                currPage++;
                
        }*/
    }
    console.log("The total number of pages is " + currPage);
}

//Automatically extracts the book
ExtractBook(0);


app.get('/', function(req, res){
    console.log("Hello world");
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
    let lastChapter = currentBookInfo.lastChapterIndex;
    let lastPage = currentBookInfo.lastPage;
    console.log("Last Page: This is the last page saved " + lastPage);
    if(currentBookInfo.listOfChapters.length > 0){
        if(typeof lastChapter !== "undefined" && typeof lastPage !== "undefined"){
            console.log("Can recover the values when loading in new book");
            response = currentBookInfo.listOfChapters[lastChapter].chapter_pages[lastPage];
        }else{
            console.log("Could not recover values when loading in new book with chapter index of "
                + currentBookInfo.lastChapterIndex + " and page of " + lastPage);
            currentBookInfo.lastChapterIndex = 0;
            currentBookInfo.lastPage = 0;
            response = currentBookInfo.listOfChapters[0].chapter_pages[0];
        }
    }else{
        console.log("number of chapters is about zero")
        response = "";
    }
    
    console.log("The current page we're at is" + lastPage);
    res.send(JSON.stringify(response));
});

app.get('/books/library', (req, res) => {
    console.log("Want to get all library books");
    console.log(myLibrary);
    var libraryToGive = [];
    for(let g = 0; g < myLibrary.data.length; g++){
        console.log(g);
        const bookEntry = {
            book_id : myLibrary.data[g].book_id,
            name : myLibrary.data[g].name,
            author : myLibrary.data[g].author,
            genre : myLibrary.data[g].genre,
            subgenre : myLibrary.data[g].subgenre
        }
        libraryToGive.push(bookEntry);
    }
    console.log(libraryToGive);
    res.json(libraryToGive);
});

app.get('/api/message', (req, res) => {
    console.log("Got mesasage request")
    res.json({message:'Hello friend from the server!'});
});

app.get('/api/testpage', (req, res) => {
    console.log("Got mesasage request");
    
    let targetPage = 25;
    let chapterLoc = 0;
    let pageLoc = 0;
    let currPage = 0;
    for(let currChap = 0; currChap < currentBookInfo.listOfChapters.length; currChap++){
        console.log("Current chapter is " + currChap);
        for(let currPageIndex = 0; currPageIndex < currentBookInfo.listOfChapters[currChap].chapter_pages.length; currPageIndex++){
            console.log("The current page in the chapter is " + currPageIndex);
            if(currPage === targetPage){
                console.log("Found the page in chapter " + currChap + " and it's page of " + currPageIndex);
                chapterLoc = currChap;
                pageLoc = currPageIndex;
                break;
            }else{
                currPage++;
            }
        }
        if(currPage === targetPage){
            break;
        }
    }

    //Now pass the chapter location and page location and return the content
    //Eventually have to locate the last page in the chapter pages, will have to redo this logic
    if(currentBookInfo.listOfChapters[chapterLoc].chapter_pages !== 'undefined' 
        || currentBookInfo.listOfChapters[chapterLoc].chapter_pages !== null){
        let response = currentBookInfo.listOfChapters[chapterLoc].chapter_pages[pageLoc];
        currentBookInfo.lastPage = pageLoc;
        currentBookInfo.lastChapterIndex = chapterLoc;
        myLibrary.data[currentBookInfo.book_id].last_page = pageLoc;
        myLibrary.data[currentBookInfo.book_id].last_chapter = chapterLoc;
        //DEE Should send this out as an alert or listener event
        write_to_json_file("books/bookSave.json", myLibrary);
        res.send(JSON.stringify(response));
    }else{
        res.send(JSON.stringify(""));
    }

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

var currChapter = 0;
var lastPage = 0;
/*
* Responsibilities:
* Verify the new page has any content, if not return an empty string
* Retrieve the next page, 
* After retrieving new page, save the index to Library object's last_page variable
*/
app.get('/api/nextpage', (req, res) => {
    res.setHeader("Content-Type", "text/html");
    console.log("Next page selected");
    let currChapterIndex = currentBookInfo.lastChapterIndex;
    if(currChapterIndex === 'undefined'){
        console.log("Setting current chapter index back to zero " + currChapterIndex);
        currChapterIndex = 0;
    }

    let newPage = currentBookInfo.lastPage + 1;

    console.log(currChapterIndex);   
    if(currChapterIndex >= currentBookInfo.listOfChapters.length - 1){
        currChapterIndex = currentBookInfo.listOfChapters.length - 1;
    }
    
    //Need to check if lastPageIndex is larger than lenght of chapters
    if(newPage >= currentBookInfo.listOfChapters[currChapterIndex].chapter_pages.length){
        console.log("Need to progress to a new chapter");
        //We're at the final page
        if(currChapterIndex >= currentBookInfo.listOfChapters.length - 1){
            currChapterIndex = currentBookInfo.listOfChapters.length - 1;
            newPage = currentBookInfo.listOfChapters[currChapterIndex].chapter_pages.length - 1;
        }else{
            console.log("Resetting current chapter");
            currChapterIndex = currChapterIndex + 1;
            newPage = 0;
        }
    }
    
    console.log("The current chapter is " + currChapterIndex);
    console.log("The current page in the chapter is " + newPage);
    console.log("The length of the current chapter is " + currentBookInfo.listOfChapters[currChapterIndex].chapter_pages.length)
    
    
    //Eventually have to locate the last page in the chapter pages, will have to redo this logic
    if(currentBookInfo.listOfChapters[currChapterIndex].chapter_pages !== 'undefined' 
        || currentBookInfo.listOfChapters[currChapterIndex].chapter_pages !== null){
        let response = currentBookInfo.listOfChapters[currChapterIndex].chapter_pages[newPage];
        currentBookInfo.lastPage = newPage;
        currentBookInfo.lastChapterIndex = currChapterIndex;
        myLibrary.data[currentBookInfo.book_id].last_page = newPage;
        myLibrary.data[currentBookInfo.book_id].last_chapter = currChapterIndex;
        //console.log(response);
        //DEE Should send this out as an alert or listener event
        write_to_json_file("books/bookSave.json", myLibrary);
        res.send(JSON.stringify(response));
    }else{
        res.send(JSON.stringify(""));
    }
    
    /*
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
        myLibrary.data[currentBookInfo.book_id].last_page = newPage;
        //DEE Should send this out as an alert or listener event
        write_to_json_file("testSave.json", myLibrary);
        res.send(JSON.stringify(response));
    }else{
        res.send(JSON.stringify(""));
    }*/
})

app.get('/api/previouspage', (req, res) => {
    
    res.setHeader("Content-Type", "text/html");
    console.log("Next page selected");
    let currChapterIndex = currentBookInfo.lastChapterIndex;

    if(currChapterIndex === 'undefined'){
        console.log("Setting current chapter index back to zero " + currChapterIndex);
        currChapterIndex = 0;
    }

    let newPage = currentBookInfo.lastPage - 1;
    console.log(newPage);

    console.log(currChapterIndex);   
    if(currChapterIndex <= 0){
        currChapterIndex = 0;
    }
    
    //Need to check if lastPageIndex is smaller than zer0
    if(newPage < 0){
        //We're at the first page
        if(currChapterIndex <= 0){
            currChapterIndex = 0;
            newPage = 0;
        }else{
            currChapterIndex = currChapterIndex - 1;
            newPage = currentBookInfo.listOfChapters[currChapterIndex].chapter_pages.length - 1;
            console.log("Resetting to previous chapter");
        }
    }

    console.log("The current chapter is " + currChapterIndex);
    console.log("The current page in the chapter is " + 
        newPage);
    
    //Eventually have to locate the last page in the chapter pages, will have to redo this logic
    if(currentBookInfo.listOfChapters[currChapterIndex].chapter_pages !== 'undefined' 
        || currentBookInfo.listOfChapters[currChapterIndex].chapter_pages !== null){
        let response = currentBookInfo.listOfChapters[currChapterIndex].chapter_pages[newPage];
        currentBookInfo.lastPage = newPage;
        currentBookInfo.lastChapterIndex = currChapterIndex;
        myLibrary.data[currentBookInfo.book_id].last_page = newPage;
        myLibrary.data[currentBookInfo.book_id].last_chapter = currChapterIndex;
        //console.log(response);
        //DEE Should send this out as an alert or listener event
        write_to_json_file("books/bookSave.json", myLibrary);
        res.send(JSON.stringify(response));
    }else{
        res.send(JSON.stringify(""));
    }

    /*console.log("Previous page request");
    
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
        myLibrary.data[currentBookInfo.book_id].last_page = newPage;
        //DEE Should send this out as an alert or listener event
        write_to_json_file("testSave.json", myLibrary);
        res.send(JSON.stringify(response));
    }else{
        res.send(JSON.stringify(""));
    }*/
})

//DEEM Edge cases to consider, will have to consider white space, invalid numbers, and string values with quotes
app.post('/api/jumppage', (req, res)=>{
    //let response = pages[currentPage].toString();
    console.log(req.body);
    const targetPage = Number(req.body.number);
    console.log(`Received the number of ${targetPage}`);

    let chapterLoc = 0;
    let pageLoc = 0;
    let currPage = 0;
    for(let currChap = 0; currChap < currentBookInfo.listOfChapters.length; currChap++){
        console.log("Current chapter is " + currChap);
        for(let currPageIndex = 0; currPageIndex < currentBookInfo.listOfChapters[currChap].chapter_pages.length; currPageIndex++){
            console.log("The current page in the chapter is " + currPageIndex);
            if(currPage === targetPage){
                console.log("Found the page in chapter " + currChap + " and it's page of " + currPageIndex);
                chapterLoc = currChap;
                pageLoc = currPageIndex;
                break;
            }else{
                currPage++;
            }
        }
        if(currPage === targetPage){
            break;
        }
    }

    //Now pass the chapter location and page location and return the content
    //Eventually have to locate the last page in the chapter pages, will have to redo this logic
    if(currentBookInfo.listOfChapters[chapterLoc].chapter_pages !== 'undefined' 
        || currentBookInfo.listOfChapters[chapterLoc].chapter_pages !== null){
        let response = currentBookInfo.listOfChapters[chapterLoc].chapter_pages[pageLoc];
        currentBookInfo.lastPage = pageLoc;
        currentBookInfo.lastChapterIndex = chapterLoc;
        myLibrary.data[currentBookInfo.book_id].last_page = pageLoc;
        myLibrary.data[currentBookInfo.book_id].last_chapter = chapterLoc;
        //DEE Should send this out as an alert or listener event
        write_to_json_file("books/bookSave.json", myLibrary);
        res.send(JSON.stringify(response));
    }else{
        res.send(JSON.stringify(""));
    }

    res.json({message:'Hello friend from the server!'});

    /*
    let targetPage = currentBookInfo.lastPage;

    console.log(`Current page is ` + targetPage);

    //DEE Might need to get rid of -1 
    if(targetPage < 1 || targetPage > currentBookInfo.listOfChapters.length -1){
        targetPage = 0;
    }
    
    //DEE Might need to get rid of -1 
    if(givenNumber > -1 && givenNumber < currentBookInfo.listOfChapters.length -1){
        targetPage = givenNumber;
        console.log("Our number falls within range " + givenNumber);
    }

    if(currentBookInfo.listOfChapters[targetPage].chapter_pages !== 'undefined' 
        || currentBookInfo.listOfChapters[targetPage].chapter_pages !== null){
        let response = currentBookInfo.listOfChapters[targetPage].chapter_pages[0];
        //DEE Simplify down and only store in one page
        currentBookInfo.lastPage = targetPage;
        myLibrary.data[currentBookInfo.book_id].last_page = targetPage;
        //DEE Should send this out as an alert or listener event
        write_to_json_file("testSave.json", myLibrary);
        res.send(JSON.stringify(response));
    }else{
        res.send(JSON.stringify(""));
    }*/
});

app.get('/api/image', (req, res) => {
    const imagePath = path.join(__dirname, 'images', 'your-image.jpg'); // Replace 'your-image.jpg' with the actual image file name
    const image = fs.readFileSync(imagePath);
  
    res.writeHead(200, {
      'Content-Type': 'image/jpeg' // Adjust the Content-Type based on the image type
    });
    res.end(image, 'binary');
  });

//locatePage(25);
app.listen(3088);

/*app.get('/', function(request, response){
    response.sendFile('absolutePathToYour/htmlPage.html');
});*/