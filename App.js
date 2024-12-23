const express = require('express');
const app = express();
const cors = require('cors');

//Idnetifying 
app.use(express.static('public'));
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

const chunkSize = 5000;

//DEE To rename
let numberOfPages = 0;
//DEE To rename
function createPages(index, fullString){

    for(let i = 0; i < fullString.length; i += chunkSize){
        var page = [];
        //myOtherStuff.listOfPages.push(fullString.substring(i, i + chunkSize));
        currentBookInfo.listOfChapters[index].chapter_pages.push(
            fullString.substring(i, i + chunkSize));
        numberOfPages = numberOfPages + 1;
    }
}

//DEE Variables for tracking location
let currentBook = 0;

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
        //DEE To remove, we dont' use this
        libraryToPass.push(bookEntry);
    }
}

//DEE To remove?
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
        //DEE To remove, we dont' use this
        libraryVersionTwo.data.push(bookEntry);
    }
    console.log(libraryVersionTwo);
}

//DEE Do we use these anymore?
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
        console.log("This is the covername " + coverName);
    });

    //Now extract cover to backend
    tempZip.extract(coverName, './extracted', err => {
        console.log(err ? 'Extract error' : 'Extracted');
    });

    let section = {
        id : '',
        conent : ''
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
            
            let chpTagSimply = chpTagTwo[0].replace(/['"]/g,'');

            let idTag = anchorTags[j].split("#");
            let idSimply = idTag[1].replace(/['"]/g,'');

            chapter.chapter_id = idSimply;
            chapter.chapter_name = chpTagSimply;

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
                
                for(let j = 0; j < currentBookInfo.listOfChapters.length; j++){
                    let currChapterId = currentBookInfo.listOfChapters[j].chapter_id;
                    //DEE Big issue, cannot continutally search like this, will add a lot of time
                    let recoveredInfo = currentFile.getElementById(
                        currChapterId.toString());
                    if(recoveredInfo !== null){
                        //console.log("Found id for " + currentBookInfo.listOfChapters[j].chapter_id);
                        let page = {
                            type : 'paragraph',
                            content : recoveredInfo.toString(),
                        }
                        createPages(j, recoveredInfo.toString());
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
  
    let response = {
        title : '',
        content: ''
    };
    res.setHeader("Content-Type", "text/html");
    let lastChapter = currentBookInfo.lastChapterIndex;
    let lastPage = currentBookInfo.lastPage;
    console.log("Last Page: This is the last page saved " + lastPage);

    //DEE There is a much better way to do it, store the title from 
    //the library into currentbookinfo
    response.title = myLibrary.data[currentBookInfo.book_id].name;

    if(currentBookInfo.listOfChapters.length > 0){
        if(typeof lastChapter !== "undefined" && typeof lastPage !== "undefined"){
            console.log("Can recover the values when loading in new book");
            response.content = currentBookInfo.listOfChapters[lastChapter].chapter_pages[lastPage];
        }else{
            console.log("Could not recover values when loading in new book with chapter index of "
                + currentBookInfo.lastChapterIndex + " and page of " + lastPage);
            currentBookInfo.lastChapterIndex = 0;
            currentBookInfo.lastPage = 0;
            response.content = currentBookInfo.listOfChapters[0].chapter_pages[0];
        }
    }else{
        console.log("number of chapters is about zero")
        response.content = "";
    }
    
    console.log("The current page we're at is" + lastPage);
    res.send(JSON.stringify(response));
});

app.get('/books/library', (req, res) => {
    var libraryToGive = [];
    for(let g = 0; g < myLibrary.data.length; g++){
        //console.log(g);
        const bookEntry = {
            book_id : myLibrary.data[g].book_id,
            name : myLibrary.data[g].name,
            author : myLibrary.data[g].author,
            genre : myLibrary.data[g].genre,
            subgenre : myLibrary.data[g].subgenre
        }
        libraryToGive.push(bookEntry);
    }
    res.json(libraryToGive);
});

app.get('/books/message', (req, res) => {
    console.log("Got mesasage request")
    res.json({message:'Hello friend from the server!'});
});

app.get('/books/testpage', (req, res) => {
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

/*
* Responsibilities:
* Verify the new page has any content, if not return an empty string
* Retrieve the next page, 
* After retrieving new page, save the index to Library object's last_page variable
*/
app.get('/books/nextpage', (req, res) => {
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
})

app.get('/books/previouspage', (req, res) => {
    
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
})

//DEEM Edge cases to consider, will have to consider white space, invalid numbers, and string values with quotes
app.post('/books/jumppage', (req, res)=>{

    //let response = pages[currentPage].toString();
    console.log(req.body);
    const targetPage = Number(req.body.number);
    console.log(`In jump page, trying to find the number of ${targetPage}`);

    let chapterLoc = 0;
    let pageLoc = 0;
    let currPage = 0;
    let foundPage = false;
    console.log("The length of the book is " + currentBookInfo.listOfChapters.length);
    for(let currChap = 0; currChap < currentBookInfo.listOfChapters.length; currChap++){
        console.log("Current chapter is " + currChap);
        for(let currPageIndex = 0; currPageIndex < currentBookInfo.listOfChapters[currChap].chapter_pages.length; currPageIndex++){
            console.log("The current page in the chapter is " + currPageIndex + " with its overall location being " + currPage);
            if(currPage === targetPage){
                console.log("Found the page in chapter " + currChap + " and it's page of " + currPageIndex);
                chapterLoc = currChap;
                pageLoc = currPageIndex;
                foundPage = true;
                break;
            }
            currPage++;
        }
        if(foundPage === true){
            console.log("Found page");
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
        console.log("Finishing out and saving");
        //DEE Should send this out as an alert or listener event
        write_to_json_file("books/bookSave.json", myLibrary);
        res.send(JSON.stringify(response));
    }else{
        res.send(JSON.stringify(""));
    }
});

app.post('/books/cover', (req, res) => {
    console.log("Trying to recover cover with value of " + req.body.number);
    const givenNumber = Number(req.body.number);
    let imagePath = "";

    if(givenNumber < myLibrary.data.length){
        console.log("Here is the image we recovered " + myLibrary.data[givenNumber].cover_path);
        imagePath = path.join(__dirname, myLibrary.data[givenNumber].cover_path);
    }
    const image = fs.readFileSync(imagePath);
    res.sendFile(imagePath);
});

app.get('/books/tableofcontents', (req, res) => {
    console.log("Table of contents hit, trying to return " + currentBookInfo.listOfChapters[0].chapter_name);
    let chapters = [];

    //Should be returning name and the index of the chapter so we can just return the start of the page
    for(let h = 0; h < currentBookInfo.listOfChapters.length; h++){
        let chapIndexes = {
            chapter_index: h,
            chapter_name: currentBookInfo.listOfChapters[h].chapter_name,
        }
        chapters.push(chapIndexes)
    }
    console.log("These are the table of contents we're returning " + chapters);
    res.send(JSON.stringify(chapters));
});

app.post('/books/loadchapter', (req, res)=> {
    console.log("Load chapter request hit");
    const targetChapter = Number(req.body.number);
    let response = "";
    if(targetChapter > currentBookInfo.listOfChapters.length - 1){
        response = currentBookInfo.listOfChapters[currentBookInfo.lastChapterIndex].chapter_pages[currentBookInfo.lastPage];
        res.send(JSON.stringify(response));
    }else{
        response = currentBookInfo.listOfChapters[targetChapter].chapter_pages[0];
        currentBookInfo.lastPage = 0;
        currentBookInfo.lastChapterIndex = targetChapter;
        myLibrary.data[currentBookInfo.book_id].last_page = 0;
        myLibrary.data[currentBookInfo.book_id].last_chapter = targetChapter;
        write_to_json_file("books/bookSave.json", myLibrary);
        res.send(JSON.stringify(response));
    }
});

app.listen(3088);