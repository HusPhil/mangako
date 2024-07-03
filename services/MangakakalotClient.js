import axios from 'axios';
import cheerio from 'cheerio';
import uuid from 'react-native-uuid'
import { Buffer } from 'buffer';


const headers = {
    'sec-ch-ua': '"Microsoft Edge";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
    'Referer': 'https://chapmanganato.to/',
    'sec-ch-ua-mobile': '?0',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0',
    'sec-ch-ua-platform': '"Windows"'
};

export const getMangaByOrder = async (targetUrl, selector) => {
    try {
        const response = await axios.get(targetUrl, { headers });

        if (response.status === 200) {
            const html = response.data;
            const $ = cheerio.load(html);
            const scrapedData = [];

            $(selector).each((index, element) => {
                const title = $(element).find('a').attr('title');
                const link = $(element).find('a').attr('href');
                const imageUrl = $(element).find('img').attr('src');

                scrapedData.push({
                    "id": uuid.v4(),
                    "title": title,
                    "link": link,
                    "cover": imageUrl,
                });
            });
            return scrapedData; 
        } else {
            console.log(`Failed to scrape data. Status code: ${response.status}`);
            return null
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
        throw error
    }
};

export const getMangaBySearch = async (targetUrl, selector) => {
  try {
      const response = await axios.get(targetUrl, { headers });

      if (response.status === 200) {
          const html = response.data;
          const $ = cheerio.load(html);
          const scrapedData = [];

          $(selector).each((index, element) => {
              const title = $(element).find('h3.story_name').text().trim();
              const link = $(element).find('a').attr('href');
              const imageUrl = $(element).find('img').attr('src');

              scrapedData.push({
                  "id": uuid.v4(),
                  "title": title,
                  "link": link,
                  "cover": imageUrl,
              });
          });
          return scrapedData; 
      } else {
          console.log(`Failed to scrape data. Status code: ${response.status}`);
          return null
      }
  } catch (error) {
      console.error(`Error: ${error.message}`);
      throw error
  }
};

export const getMangaDetails = async (mangaUrl) => {
    try {
      const targetUrl = mangaUrl;
      const source = targetUrl.match(/https?:\/\/([^\/]+)/)[1]
      const response = await axios.get(targetUrl, { headers });
  
      if (response.status === 200) {
        const html = response.data;
        const $ = cheerio.load(html);

        let mangaDetails = null;

        switch(source) {
          case 'chapmanganato.to':
            mangaDetails = {
              id: uuid.v4(),
              author: $('td:contains("Author(s) :")').next().text().trim(),
              status: $('td:contains("Status :")').next().text().trim(),
              alternativeNames: $('td:contains("Alternative :")').next().text().trim().split(';').map(altTitle => altTitle.trim()),
              tags: $('td:contains("Genres :")').next().text().trim().split(' - ').map(genre => genre.trim()),
              desc: $('#panel-story-info-description').text().trim().substring($('#panel-story-info-description').text().trim().indexOf(":")+1).trim(),
            };
            break
          case 'mangakakalot.com':
            const author = $('li:contains("Author(s) :")').text().trim()
            const status = $('li:contains("Status :")').text().trim()
            const altTitles = $('li:contains("Alternative :")').text().trim()
            const tags = $('li:contains("Genres :")').text().trim()
            const desc = $('#noidungm').text().trim()

            mangaDetails = {
              id: uuid.v4(),
              author: author.substring(author.indexOf(":")+1).trim(),
              status: status.substring(status.indexOf(":")+1).trim(),
              alternativeNames: altTitles.substring(altTitles.indexOf(":")+1).trim().split(';').map(altTitle => altTitle.trim()),
              tags: tags.substring(tags.indexOf(":")+1).trim().split(",").map(genre => genre.trim()).filter(genre => genre !== ""),
              desc: desc.substring(desc.indexOf(":")+1).trim(),
            };
            break
        }
        return mangaDetails;
      } else {
        console.log(`Failed to scrape data. Status code: ${response.status}`);
        return null;
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
      return null;
    }
};

export const getChapterPageUrls = async (mangaUrl) => {
    try {
        const targetUrl = mangaUrl;
        const response = await axios.get(targetUrl, { headers });
    
        if (response.status === 200) {
          const html = response.data;
          const $ = cheerio.load(html);
  
          const chapterImageUrls = [];
  
          const imgElements = $('div.container-chapter-reader > img');

          for (let i = 0; i < imgElements.length; i++) {
            const imgUrl = $(imgElements[i]).attr('src');
            chapterImageUrls.push(imgUrl);
          }



          return chapterImageUrls;
        } else {
          console.log(`Failed to scrape data. Status code: ${response.status}`);
          return null;
        }
      } catch (error) {
        console.error(`Error: ${error.message}`);
        return null;
      }
};

export const getChapterList = async (mangaUrl, abortSignal) => {
  try {
    const targetUrl = mangaUrl;
    const source = targetUrl.match(/https?:\/\/([^\/]+)/)[1]
    const response = await axios.get(targetUrl, { headers, signal: abortSignal });

    if (response.status === 200) {
      const html = response.data;
      const $ = cheerio.load(html);

      const chapterList = [];

      switch(source) {
        case 'chapmanganato.to':
          $('ul.row-content-chapter > li').each((index, item) => {
            const chTitle = $(item).find('a').text().trim();
            const publishDate = $(item).find('span.chapter-time.text-nowrap').text().trim();
            const chapterUrl = $(item).find('a').attr('href');
            const chapId = `${chapterUrl}-${chTitle}-${publishDate}`;
        
            chapterList.push({
                chapId,
                chTitle,
                publishDate,
                chapterUrl,
            });
          });
          break
        case 'mangakakalot.com':
          $('div.chapter-list > div.row').each((index, item) => {
            const chTitle = $(item).find('a').text().trim();
            const publishDate = $(item).find('span').eq(2).text().trim();
            const chapterUrl = $(item).find('a').attr('href');
            const chapId = `${chapterUrl}-${chTitle}-${publishDate}`;
        
            chapterList.push({
                chapId,
                chTitle,
                publishDate,
                chapterUrl,
            });
          });
          break
        
      }
      
      return chapterList;
    } else {
      console.log(`Failed to scrape data. Status code: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return null;
  }
};

export const getMangaInfo = async (mangaUrl, abortSignal) => {
  try {
    const targetUrl = mangaUrl;
    const source = new URL(targetUrl).hostname;
    const response = await axios.get(targetUrl, { headers, signal: abortSignal });

    if (response.status !== 200) {
      console.log(`Failed to scrape data. Status code: ${response.status}`);
      return null;
    }

    const html = response.data;
    const $ = cheerio.load(html);

    const chapterList = [];
    let mangaDetails = null;

    if (source === 'chapmanganato.to') {
      $('ul.row-content-chapter > li').each((index, item) => {
        const chapterLink = $(item).find('a');
        const chTitle = chapterLink.text().trim();
        const publishDate = $(item).find('span.chapter-time.text-nowrap').text().trim();
        const chapterUrl = chapterLink.attr('href');
        const chapId = `${chapterUrl}-${chTitle}-${publishDate}`;

        chapterList.push({
          chapId,
          chTitle,
          publishDate,
          chapterUrl,
        });
      });

      mangaDetails = {
        id: uuid.v4(),
        author: $('td:contains("Author(s) :")').next().text().trim(),
        status: $('td:contains("Status :")').next().text().trim(),
        alternativeNames: $('td:contains("Alternative :")').next().text().trim().split(';').map(altTitle => altTitle.trim()),
        tags: $('td:contains("Genres :")').next().text().trim().split(' - ').map(genre => genre.trim()),
        desc: $('#panel-story-info-description').text().trim().substring($('#panel-story-info-description').text().trim().indexOf(":") + 1).trim(),
      };
    } else if (source === 'mangakakalot.com') {
      $('div.chapter-list > div.row').each((index, item) => {
        const chapterLink = $(item).find('a');
        const chTitle = chapterLink.text().trim();
        const publishDate = $(item).find('span').eq(2).text().trim();
        const chapterUrl = chapterLink.attr('href');
        const chapId = `${chapterUrl}-${chTitle}-${publishDate}`;

        chapterList.push({
          chapId,
          chTitle,
          publishDate,
          chapterUrl,
        });
      });

      mangaDetails = {
        id: uuid.v4(),
        author: $('li:contains("Author(s) :")').contents().filter(function () { return this.nodeType === 3; }).text().trim(),
        status: $('li:contains("Status :")').contents().filter(function () { return this.nodeType === 3; }).text().trim(),
        alternativeNames: $('li:contains("Alternative :")').contents().filter(function () { return this.nodeType === 3; }).text().trim().split(';').map(altTitle => altTitle.trim()),
        tags: $('li:contains("Genres :")').contents().filter(function () { return this.nodeType === 3; }).text().trim().split(",").map(genre => genre.trim()).filter(genre => genre !== ""),
        desc: $('#noidungm').text().trim().substring($('#noidungm').text().trim().indexOf(":") + 1).trim(),
      };
    }

    return { chapterList, mangaDetails };
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request canceled', error.message);
    } else {
      console.log('Error:', error.message);
    }
    return null;
  }
};

export const getChapterPageImage = async (imageUrl) => {
  try {
    // Make the request and get the image data as an arraybuffer
    const response = await axios({
      method: 'get',
      url: imageUrl,
      responseType: 'arraybuffer',
      headers: headers,
    });

    if (response.status === 200) {
      const base64Image = Buffer.from(response.data).toString('base64');
      return base64Image;
    } else {
      console.error(`Failed to retrieve the image. Status code: ${response.status}`);
      return null; // Handle failure case as needed
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    throw error; // Re-throw error to handle it in the calling function
  }
};
